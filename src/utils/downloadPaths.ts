import * as FileSystem from 'expo-file-system/legacy';

/**
 * Offline manga storage structure:
 * <documentDirectory>/manga/<mangaId>/<chapterId>/
 *   pages.json     ← metadata, written last as completion sentinel
 *   0.jpg, 1.jpg   ← page images
 */

const MANGA_DIR = `${FileSystem.documentDirectory}manga/`;

export interface PageIndex {
  chapterId: number;
  pageCount: number;
  pages: Array<{ index: number; filename: string; url?: string }>;
}

export function chapterDir(mangaId: number, chapterId: number): string {
  return `${MANGA_DIR}${mangaId}/${chapterId}/`;
}

export function pagePath(mangaId: number, chapterId: number, index: number): string {
  return `${chapterDir(mangaId, chapterId)}${index}.jpg`;
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
