import { and, desc, eq, not, lte } from 'drizzle-orm';
import { db } from '@db/client';
import { downloadQueue, chapter, manga } from '@db/schema';

export interface ActiveDownload {
  id: number;
  chapterId: number;
  mangaId: number;
  mangaTitle: string;
  thumbnailUrl: string | null;
  chapterName: string;
  chapterNumber: number | null;
  status: number; // 0=queued, 1=downloading, 2=paused, 3=error
  progress: number; // 0.0–1.0
  error: string | null;
  addedAt: number;
}

/**
 * Add a chapter to the download queue.
 * Idempotent: won't insert if the chapter is already in the queue.
 */
export async function enqueueChapter({
  chapterId,
  mangaId,
  priority = 0,
}: {
  chapterId: number;
  mangaId: number;
  priority?: number;
}): Promise<void> {
  // Check if already in queue
  const existing = await db
    .select()
    .from(downloadQueue)
    .where(eq(downloadQueue.chapterId, chapterId))
    .limit(1);

  if (existing.length > 0) {
    console.log(`[Downloads DB] Chapter ${chapterId} already in queue`);
    return;
  }

  // Set chapter download status to queued (1)
  await db
    .update(chapter)
    .set({ downloadStatus: 1 })
    .where(eq(chapter.id, chapterId));

  // Insert into download queue
  await db
    .insert(downloadQueue)
    .values({
      chapterId,
      mangaId,
      priority,
      status: 0, // queued
      progress: 0,
    });

  console.log(`[Downloads DB] Chapter ${chapterId} inserted into queue`);
}

/**
 * Bulk enqueue multiple chapters.
 */
export async function bulkEnqueueChapters(
  chapters: Array<{ chapterId: number; mangaId: number }>,
): Promise<void> {
  if (chapters.length === 0) return;

  // Filter out chapters already in queue
  const existing = await db
    .select({ chapterId: downloadQueue.chapterId })
    .from(downloadQueue);

  const existingIds = new Set(existing.map((e) => e.chapterId));
  const toInsert = chapters.filter((ch) => !existingIds.has(ch.chapterId));

  if (toInsert.length === 0) {
    console.log(`[Downloads DB] All ${chapters.length} chapters already in queue`);
    return;
  }

  console.log(`[Downloads DB] Bulk enqueueing ${toInsert.length}/${chapters.length} chapters`);

  // Update chapter download status for all chapters to insert
  for (const ch of toInsert) {
    await db
      .update(chapter)
      .set({ downloadStatus: 1 })
      .where(eq(chapter.id, ch.chapterId));
  }

  // Batch insert into download queue
  const values = toInsert.map((ch) => ({
    chapterId: ch.chapterId,
    mangaId: ch.mangaId,
    priority: 0,
    status: 0, // queued
    progress: 0,
  }));

  const BATCH_SIZE = 50;
  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE);
    await db.insert(downloadQueue).values(batch);
  }

  console.log(`[Downloads DB] Bulk inserted ${toInsert.length} chapters`);
}

/**
 * Update download progress and status.
 */
export async function updateDownloadProgress(
  chapterId: number,
  progress: number,
  status: number,
): Promise<void> {
  // Update download queue
  await db
    .update(downloadQueue)
    .set({ progress, status })
    .where(eq(downloadQueue.chapterId, chapterId));

  // Update chapter download status
  // Map: 0=queued→1, 1=downloading→2, 2=paused→2, 3=error→4
  let chapterStatus = 0;
  if (status === 0) chapterStatus = 1; // queued
  else if (status === 1) chapterStatus = 2; // downloading
  else if (status === 2) chapterStatus = 2; // paused
  else if (status === 3) chapterStatus = 4; // error

  if (chapterStatus > 0) {
    await db
      .update(chapter)
      .set({ downloadStatus: chapterStatus })
      .where(eq(chapter.id, chapterId));
  }
}

/**
 * Mark a chapter download as complete.
 * Removes from download queue and sets chapter.downloadStatus = 3 (done).
 */
export async function markDownloadComplete(chapterId: number): Promise<void> {
  // Delete from download queue
  await db.delete(downloadQueue).where(eq(downloadQueue.chapterId, chapterId));

  // Update chapter: mark as done, set downloaded time
  await db
    .update(chapter)
    .set({
      downloadStatus: 3, // done
      downloadedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(chapter.id, chapterId));
}

/**
 * Mark a chapter download as error.
 */
export async function markDownloadError(chapterId: number, error: string): Promise<void> {
  // Update download queue
  await db
    .update(downloadQueue)
    .set({ status: 3, error }) // 3 = error
    .where(eq(downloadQueue.chapterId, chapterId));

  // Update chapter: mark as error
  await db
    .update(chapter)
    .set({ downloadStatus: 4 }) // 4 = error
    .where(eq(chapter.id, chapterId));
}

/**
 * Get all active (non-completed) downloads, joined with chapter and manga info.
 */
export async function getActiveDownloads(): Promise<ActiveDownload[]> {
  const rows = await db
    .select({
      id: downloadQueue.id,
      chapterId: downloadQueue.chapterId,
      mangaId: downloadQueue.mangaId,
      mangaTitle: manga.title,
      thumbnailUrl: manga.thumbnailUrl,
      chapterName: chapter.name,
      chapterNumber: chapter.chapterNumber,
      status: downloadQueue.status,
      progress: downloadQueue.progress,
      error: downloadQueue.error,
      addedAt: downloadQueue.addedAt,
    })
    .from(downloadQueue)
    .innerJoin(chapter, eq(downloadQueue.chapterId, chapter.id))
    .innerJoin(manga, eq(downloadQueue.mangaId, manga.id))
    .where(not(eq(downloadQueue.status, 3))) // Exclude errors; they stay in queue
    .orderBy(desc(downloadQueue.priority), desc(downloadQueue.addedAt));

  return rows;
}

/**
 * Get download status for a single chapter.
 */
export async function getChapterDownloadStatus(chapterId: number): Promise<number> {
  const result = await db
    .select({ status: chapter.downloadStatus })
    .from(chapter)
    .where(eq(chapter.id, chapterId));

  return result[0]?.status ?? 0; // default to 'none'
}

/**
 * Delete a chapter from the download queue and reset its status.
 */
export async function deleteDownloadEntry(chapterId: number): Promise<void> {
  // Remove from download queue
  await db.delete(downloadQueue).where(eq(downloadQueue.chapterId, chapterId));

  // Reset chapter download status to 'none' (0)
  await db
    .update(chapter)
    .set({ downloadStatus: 0 })
    .where(eq(chapter.id, chapterId));
}

/**
 * Get all completed (downloadStatus = 3) chapters, grouped by manga.
 */
export async function getCompletedDownloads(): Promise<
  Array<{
    chapterId: number;
    mangaId: number;
    mangaTitle: string;
    thumbnailUrl: string | null;
    chapterName: string;
    chapterNumber: number | null;
    downloadedAt: number | null;
  }>
> {
  const rows = await db
    .select({
      chapterId: chapter.id,
      mangaId: manga.id,
      mangaTitle: manga.title,
      thumbnailUrl: manga.thumbnailUrl,
      chapterName: chapter.name,
      chapterNumber: chapter.chapterNumber,
      downloadedAt: chapter.downloadedAt,
    })
    .from(chapter)
    .innerJoin(manga, eq(chapter.mangaId, manga.id))
    .where(eq(chapter.downloadStatus, 3)) // done
    .orderBy(desc(chapter.downloadedAt), desc(chapter.chapterNumber));

  return rows;
}

/**
 * Delete all completed downloads from both download_queue and reset chapter status.
 * Caller is responsible for also deleting the actual files via deleteChapterFiles().
 */
export async function deleteAllCompletedDownloads(): Promise<void> {
  // Get all chapters with downloadStatus = 3
  const completed = await db
    .select({ chapterId: chapter.id })
    .from(chapter)
    .where(eq(chapter.downloadStatus, 3));

  if (completed.length === 0) return;

  const chapterIds = completed.map((c) => c.chapterId);

  // Delete from download queue
  // (most completed downloads are not in the queue, but clean up any stragglers)
  for (const chapterId of chapterIds) {
    await db.delete(downloadQueue).where(eq(downloadQueue.chapterId, chapterId));
  }

  // Reset chapter status
  await db
    .update(chapter)
    .set({ downloadStatus: 0, downloadedAt: null })
    .where(eq(chapter.downloadStatus, 3));
}

/**
 * Restore download queue from DB on app startup.
 * Returns all non-error entries to be re-seeded into Zustand.
 */
export async function restoreQueueOnStartup(): Promise<
  Array<{
    chapterId: number;
    mangaId: number;
    mangaTitle: string;
    chapterName: string;
    sourceId: string;
    chapterUrl: string;
  }>
> {
  const rows = await db
    .select({
      chapterId: downloadQueue.chapterId,
      mangaId: downloadQueue.mangaId,
      mangaTitle: manga.title,
      chapterName: chapter.name,
      sourceId: manga.sourceId,
      chapterUrl: chapter.sourceUrl,
    })
    .from(downloadQueue)
    .innerJoin(chapter, eq(downloadQueue.chapterId, chapter.id))
    .innerJoin(manga, eq(downloadQueue.mangaId, manga.id))
    .where(not(eq(downloadQueue.status, 3))) // Skip error state
    .orderBy(desc(downloadQueue.priority), desc(downloadQueue.addedAt));

  return rows;
}
