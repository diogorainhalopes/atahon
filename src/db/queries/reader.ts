import { and, asc, desc, eq, gt, lt, isNull } from 'drizzle-orm';
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
  currentChapterNumber: number | null,
  currentId: number,
): Promise<{ prev: Chapter | null; next: Chapter | null }> {
  let prev: Chapter | null = null;
  let next: Chapter | null = null;

  if (currentChapterNumber != null) {
    // Next = higher chapter number
    const nextRows = await db
      .select()
      .from(chapter)
      .where(and(eq(chapter.mangaId, mangaId), gt(chapter.chapterNumber, currentChapterNumber)))
      .orderBy(asc(chapter.chapterNumber))
      .limit(1);
    next = nextRows[0] ?? null;

    // Prev = lower chapter number
    const prevRows = await db
      .select()
      .from(chapter)
      .where(and(eq(chapter.mangaId, mangaId), lt(chapter.chapterNumber, currentChapterNumber)))
      .orderBy(desc(chapter.chapterNumber))
      .limit(1);
    prev = prevRows[0] ?? null;
  } else {
    // Fall back to ID ordering when chapterNumber is null
    const nextRows = await db
      .select()
      .from(chapter)
      .where(and(eq(chapter.mangaId, mangaId), gt(chapter.id, currentId)))
      .orderBy(asc(chapter.id))
      .limit(1);
    next = nextRows[0] ?? null;

    const prevRows = await db
      .select()
      .from(chapter)
      .where(and(eq(chapter.mangaId, mangaId), lt(chapter.id, currentId)))
      .orderBy(desc(chapter.id))
      .limit(1);
    prev = prevRows[0] ?? null;
  }

  return { prev, next };
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
