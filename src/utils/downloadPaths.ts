import * as FileSystem from 'expo-file-system/legacy';

/**
 * Offline manga storage structure:
 * <documentDirectory>/manga/<mangaId>/<chapterId>/
 *   pages.json     ← metadata, written last as completion sentinel
 *   0.webp, 1.webp ← page images (or .jpg if compression disabled)
 */

const MANGA_DIR = `${FileSystem.documentDirectory}manga/`;

export interface PageIndex {
  chapterId: number;
  pageCount: number;
  pages: Array<{ index: number; filename: string; url?: string }>;
  // Compression metadata (added during download)
  isCompressed?: boolean;
  quality?: number; // WebP quality 1-100, or undefined if not compressed
}

export function chapterDir(mangaId: number, chapterId: number): string {
  return `${MANGA_DIR}${mangaId}/${chapterId}/`;
}

export function pagePath(mangaId: number, chapterId: number, index: number, ext = 'jpg'): string {
  return `${chapterDir(mangaId, chapterId)}${index}.${ext}`;
}

export function indexPath(mangaId: number, chapterId: number): string {
  return `${chapterDir(mangaId, chapterId)}pages.json`;
}

/**
 * Check if a chapter is fully downloaded by verifying pages.json exists.
 * pages.json is written last, so its presence is the completion sentinel.
 */
export async function isChapterDownloaded(mangaId: number, chapterId: number): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(indexPath(mangaId, chapterId));
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Read the pages.json index for a downloaded chapter.
 * Returns null if the file doesn't exist or is malformed.
 */
export async function readChapterIndex(
  mangaId: number,
  chapterId: number,
): Promise<PageIndex | null> {
  try {
    const path = indexPath(mangaId, chapterId);
    const content = await FileSystem.readAsStringAsync(path);
    const parsed = JSON.parse(content) as PageIndex;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Delete all downloaded files for a chapter.
 * Recursively removes the chapter directory.
 */
export async function deleteChapterFiles(mangaId: number, chapterId: number): Promise<void> {
  try {
    const path = chapterDir(mangaId, chapterId);
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      await FileSystem.deleteAsync(path, { idempotent: true });
    }
  } catch {
    // Ignore errors (file may not exist)
  }
}

export interface ChapterDownloadInfo {
  isCompressed: boolean;
  quality?: 'Low' | 'Medium' | 'High';
  sizeBytes: number;
}

/**
 * Get compression info and total size for a downloaded chapter.
 * Returns undefined if chapter is not downloaded.
 */
export async function getChapterDownloadInfo(
  mangaId: number,
  chapterId: number,
): Promise<ChapterDownloadInfo | undefined> {
  try {
    const index = await readChapterIndex(mangaId, chapterId);
    if (!index || index.pages.length === 0) return undefined;

    // Use stored compression metadata from pages.json
    const isCompressed = index.isCompressed ?? false;
    let quality: 'Low' | 'Medium' | 'High' | undefined;

    if (isCompressed && index.quality) {
      // Map numeric quality (1-100) to label
      if (index.quality <= 70) quality = 'Low';
      else if (index.quality <= 85) quality = 'Medium';
      else quality = 'High';
    }

    // Calculate total size
    const chapDir = chapterDir(mangaId, chapterId);
    let totalSize = 0;

    for (const page of index.pages) {
      try {
        const filePath = `${chapDir}${page.filename}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists && fileInfo.size) {
          totalSize += fileInfo.size;
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return { isCompressed, quality, sizeBytes: totalSize };
  } catch {
    return undefined;
  }
}
