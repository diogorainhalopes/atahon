import { asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@db/client';
import {
  chapter,
  manga,
  history,
  type Chapter,
  type Manga,
} from '@db/schema';

export async function getChapterById(id: number): Promise<Chapter | undefined> {
  const rows = await db.select().from(chapter).where(eq(chapter.id, id)).limit(1);
  return rows[0];
}

export async function getMangaById(id: number): Promise<Manga | undefined> {
  const rows = await db.select().from(manga).where(eq(manga.id, id)).limit(1);
  return rows[0];
}

export async function getChaptersForManga(mangaId: number): Promise<Chapter[]> {
  return db
    .select()
    .from(chapter)
    .where(eq(chapter.mangaId, mangaId))
    .orderBy(desc(chapter.chapterNumber), desc(chapter.id));
}

export async function getAdjacentChapters(
  mangaId: number,
  _currentChapterNumber: number | null,
  currentId: number,
): Promise<{ prev: Chapter | null; next: Chapter | null }> {
  // Fetch all chapters in reading order (ascending: Ch1, Ch2, Ch3, ...)
  // chapterNumber ascending, fallback to descending ID (extensions insert newest-first)
  const all = await db
    .select()
    .from(chapter)
    .where(eq(chapter.mangaId, mangaId))
    .orderBy(asc(chapter.chapterNumber), desc(chapter.id));

  const idx = all.findIndex((c) => c.id === currentId);
  if (idx === -1) return { prev: null, next: null };

  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  };
}

export async function saveReadingProgress(
  chapterId: number,
  lastPageRead: number,
): Promise<void> {
  await db
    .update(chapter)
    .set({ lastPageRead })
    .where(eq(chapter.id, chapterId));
}

export async function markChapterRead(chapterId: number): Promise<void> {
  await db
    .update(chapter)
    .set({ read: true })
    .where(eq(chapter.id, chapterId));
}

export async function markChaptersRead(chapterIds: number[]): Promise<void> {
  if (chapterIds.length === 0) return;
  await db
    .update(chapter)
    .set({ read: true })
    .where(inArray(chapter.id, chapterIds));
}

export async function markChaptersUnread(chapterIds: number[]): Promise<void> {
  if (chapterIds.length === 0) return;
  await db
    .update(chapter)
    .set({ read: false, lastPageRead: 0 })
    .where(inArray(chapter.id, chapterIds));
}

export async function bulkUpsertHistory(chapterIds: number[], mangaId: number): Promise<void> {
  if (chapterIds.length === 0) return;
  const now = Math.floor(Date.now() / 1000);

  const existing = await db
    .select({ id: history.id, chapterId: history.chapterId })
    .from(history)
    .where(inArray(history.chapterId, chapterIds));

  const existingChapterIds = new Set(existing.map((e) => e.chapterId));
  const toInsert = chapterIds.filter((id) => !existingChapterIds.has(id));
  const toUpdateIds = existing.map((e) => e.id);

  if (toUpdateIds.length > 0) {
    await db.update(history).set({ readAt: now }).where(inArray(history.id, toUpdateIds));
  }
  if (toInsert.length > 0) {
    await db
      .insert(history)
      .values(toInsert.map((chapterId) => ({ chapterId, mangaId, readAt: now })));
  }
}

export async function deleteHistoryForChapters(chapterIds: number[]): Promise<void> {
  if (chapterIds.length === 0) return;
  await db.delete(history).where(inArray(history.chapterId, chapterIds));
}

// ─── History queries ─────────────────────────────────────────────────────────

export interface HistoryEntry {
  historyId: number;
  readAt: number;
  mangaId: number;
  mangaTitle: string;
  thumbnailUrl: string | null;
  chapterId: number;
  chapterName: string;
  chapterNumber: number | null;
}

export async function getReadingHistory(): Promise<HistoryEntry[]> {
  const rows = await db
    .select({
      historyId: history.id,
      readAt: history.readAt,
      mangaId: manga.id,
      mangaTitle: manga.title,
      thumbnailUrl: manga.thumbnailUrl,
      chapterId: chapter.id,
      chapterName: chapter.name,
      chapterNumber: chapter.chapterNumber,
    })
    .from(history)
    .innerJoin(chapter, eq(history.chapterId, chapter.id))
    .innerJoin(manga, eq(history.mangaId, manga.id))
    .orderBy(desc(history.readAt), desc(chapter.chapterNumber), desc(chapter.id));

  return rows;
}

export async function deleteHistoryEntry(historyId: number): Promise<void> {
  await db.delete(history).where(eq(history.id, historyId));
}

export async function clearAllHistory(): Promise<void> {
  await db.delete(history);
}

export async function upsertHistory(
  chapterId: number,
  mangaId: number,
): Promise<void> {
  // Check for existing history entry for this chapter
  const existing = await db
    .select({ id: history.id })
    .from(history)
    .where(eq(history.chapterId, chapterId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(history)
      .set({ readAt: Math.floor(Date.now() / 1000) })
      .where(eq(history.id, existing[0].id));
  } else {
    await db.insert(history).values({ chapterId, mangaId });
  }
}
