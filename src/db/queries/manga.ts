import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@db/client';
import { manga, chapter, history, type Manga } from '@db/schema';
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

  const rows = await db
    .select({
      mangaId: history.mangaId,
      chapterNumber: chapter.chapterNumber,
      name: chapter.name,
      readAt: history.readAt,
    })
    .from(history)
    .innerJoin(chapter, eq(history.chapterId, chapter.id))
    .where(inArray(history.mangaId, mangaIds))
    .orderBy(desc(history.readAt));

  const result: Record<number, { chapterNumber: number | null; name: string }> = {};
  for (const row of rows) {
    if (!(row.mangaId in result)) {
      result[row.mangaId] = { chapterNumber: row.chapterNumber, name: row.name };
    }
  }
  return result;
}

export async function upsertChaptersFromSource(
  mangaId: number,
  chapters: SChapter[],
): Promise<void> {
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
}
