import { and, desc, eq, gt, inArray, or, sql } from 'drizzle-orm';
import { db } from '@db/client';
import { manga, chapter, type Manga, type Chapter } from '@db/schema';
import type { SChapter } from '@/types/extensions';

export async function getLibraryManga(): Promise<Manga[]> {
  return db
    .select()
    .from(manga)
    .where(eq(manga.inLibrary, true))
    .orderBy(desc(manga.libraryAddedAt));
}

export async function updateMangaDetails(
  id: number,
  details: {
    title: string;
    author?: string;
    artist?: string;
    description?: string;
    status: number;
    thumbnailUrl?: string;
    genre?: string; // comma-separated from extension
  },
): Promise<void> {
  // Convert comma-separated genre to JSON array string
  let genreJson: string | null = null;
  if (details.genre) {
    const genres = details.genre
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
    if (genres.length > 0) {
      genreJson = JSON.stringify(genres);
    }
  }

  await db
    .update(manga)
    .set({
      title: details.title,
      author: details.author ?? null,
      artist: details.artist ?? null,
      description: details.description ?? null,
      status: details.status,
      thumbnailUrl: details.thumbnailUrl ?? null,
      genre: genreJson,
      initialized: true,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(manga.id, id));
}

export async function toggleMangaInLibrary(
  id: number,
  inLibrary: boolean,
): Promise<void> {
  await db
    .update(manga)
    .set({
      inLibrary,
      libraryAddedAt: inLibrary ? Math.floor(Date.now() / 1000) : null,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(manga.id, id));
}

export async function setMangaSmartDownloads(
  mangaId: number,
  enabled: boolean,
): Promise<void> {
  await db
    .update(manga)
    .set({ smartDownloads: enabled })
    .where(eq(manga.id, mangaId));
}

export async function getLibrarySourceUrls(sourceId: string): Promise<Set<string>> {
  const rows = await db
    .select({ sourceUrl: manga.sourceUrl })
    .from(manga)
    .where(and(eq(manga.sourceId, sourceId), eq(manga.inLibrary, true)));
  return new Set(rows.map((r) => r.sourceUrl));
}

export async function getLatestReadChapters(
  mangaIds: number[],
): Promise<Record<number, { chapterNumber: number | null; name: string }>> {
  if (mangaIds.length === 0) return {};

  // Get chapters with any reading progress, ordered by chapter number descending
  const rows = await db
    .select({
      mangaId: chapter.mangaId,
      chapterNumber: chapter.chapterNumber,
      name: chapter.name,
    })
    .from(chapter)
    .where(
      and(
        inArray(chapter.mangaId, mangaIds),
        or(eq(chapter.read, true), gt(chapter.lastPageRead, 0)),
      ),
    )
    .orderBy(desc(chapter.chapterNumber), desc(chapter.id));

  // Pick the highest chapter per manga
  const result: Record<number, { chapterNumber: number | null; name: string }> = {};
  for (const row of rows) {
    if (!(row.mangaId in result)) {
      result[row.mangaId] = { chapterNumber: row.chapterNumber, name: row.name };
    }
  }
  return result;
}

export async function updateMangaLastRead(
  mangaId: number,
  chapterId: number,
  pageNumber: number,
): Promise<void> {
  await db
    .update(manga)
    .set({
      lastReadChapterId: chapterId,
      lastReadPage: pageNumber,
    })
    .where(eq(manga.id, mangaId));
}

export async function getLastReadChapterForResume(
  mangaId: number,
): Promise<{ id: number; name: string; chapterNumber: number | null; lastPageRead: number } | null> {
  // Get the manga's stored last read chapter
  const mangaRow = await db
    .select({
      lastReadChapterId: manga.lastReadChapterId,
      lastReadPage: manga.lastReadPage,
    })
    .from(manga)
    .where(eq(manga.id, mangaId))
    .limit(1);

  if (!mangaRow[0]?.lastReadChapterId) return null;

  // Fetch the chapter details
  const chapterRow = await db
    .select({
      id: chapter.id,
      name: chapter.name,
      chapterNumber: chapter.chapterNumber,
    })
    .from(chapter)
    .where(eq(chapter.id, mangaRow[0].lastReadChapterId))
    .limit(1);

  if (!chapterRow[0]) return null;

  return {
    ...chapterRow[0],
    lastPageRead: mangaRow[0].lastReadPage,
  };
}

// ─── Updates (new chapters for library manga) ───────────────────────────────

export interface UpdateEntry {
  chapterId: number;
  mangaId: number;
  mangaTitle: string;
  thumbnailUrl: string | null;
  chapterName: string;
  chapterNumber: number | null;
  scanlator: string | null;
  uploadDate: number | null;
  read: boolean;
  createdAt: number;
}

export async function getLibraryUpdates(): Promise<UpdateEntry[]> {
  const rows = await db
    .select({
      chapterId: chapter.id,
      mangaId: manga.id,
      mangaTitle: manga.title,
      thumbnailUrl: manga.thumbnailUrl,
      chapterName: chapter.name,
      chapterNumber: chapter.chapterNumber,
      scanlator: chapter.scanlator,
      uploadDate: chapter.uploadDate,
      read: chapter.read,
      createdAt: chapter.createdAt,
    })
    .from(chapter)
    .innerJoin(manga, eq(chapter.mangaId, manga.id))
    .where(eq(manga.inLibrary, true))
    .orderBy(desc(chapter.uploadDate), desc(chapter.chapterNumber), desc(chapter.id));

  return rows;
}

export async function upsertChaptersFromSource(
  mangaId: number,
  chapters: SChapter[],
): Promise<Chapter[]> {
  // Snapshot existing sourceUrls
  const existing = await db
    .select({ sourceUrl: chapter.sourceUrl })
    .from(chapter)
    .where(eq(chapter.mangaId, mangaId));
  const existingUrls = new Set(existing.map((r) => r.sourceUrl));

  const BATCH_SIZE = 50;

  for (let i = 0; i < chapters.length; i += BATCH_SIZE) {
    const batch = chapters.slice(i, i + BATCH_SIZE);
    const values = batch.map((ch) => ({
      mangaId,
      sourceUrl: ch.url,
      name: ch.name,
      chapterNumber: ch.chapter_number === -1 ? null : ch.chapter_number,
      volumeNumber: ch.volume_number ?? null,
      scanlator: ch.scanlator ?? null,
      uploadDate: ch.date_upload > 0 ? Math.floor(ch.date_upload / 1000) : null,
    }));

    await db
      .insert(chapter)
      .values(values)
      .onConflictDoUpdate({
        target: [chapter.mangaId, chapter.sourceUrl],
        set: {
          name: chapter.name,
          chapterNumber: chapter.chapterNumber,
          volumeNumber: chapter.volumeNumber,
          scanlator: chapter.scanlator,
          uploadDate: chapter.uploadDate,
        },
      });
  }

  // Return newly inserted chapters
  const newUrls = chapters.map((c) => c.url).filter((url) => !existingUrls.has(url));
  if (newUrls.length === 0) return [];
  return db
    .select()
    .from(chapter)
    .where(and(eq(chapter.mangaId, mangaId), inArray(chapter.sourceUrl, newUrls)));
}

// ─── Library chapter counts ────────────────────────────────────────────────

export interface ChapterCount {
  mangaId: number;
  total: number;
  readCount: number;
}

export async function getLibraryChapterCounts(
  mangaIds: number[],
): Promise<Record<number, ChapterCount>> {
  if (mangaIds.length === 0) return {};

  const rows = await db
    .select({
      mangaId: chapter.mangaId,
      total: sql<number>`COUNT(*)`,
      readCount: sql<number>`SUM(CASE WHEN ${chapter.read} THEN 1 ELSE 0 END)`,
    })
    .from(chapter)
    .where(inArray(chapter.mangaId, mangaIds))
    .groupBy(chapter.mangaId);

  const result: Record<number, ChapterCount> = {};
  for (const row of rows) {
    result[row.mangaId] = row;
  }
  return result;
}
