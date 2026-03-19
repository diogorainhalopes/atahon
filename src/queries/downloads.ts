import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  enqueueChapter,
  bulkEnqueueChapters,
  deleteDownloadEntry,
  getActiveDownloads,
  getCompletedDownloads,
  deleteAllCompletedDownloads,
  type ActiveDownload,
} from '@db/queries/downloads';
import { deleteChapterFiles } from '@utils/downloadPaths';
import { useDownloadStore } from '@stores/downloadStore';
import { startWorker } from '@utils/downloadWorker';
import { mangaKeys } from './manga';

export const downloadKeys = {
  all: ['downloads'] as const,
  active: () => [...downloadKeys.all, 'active'] as const,
  completed: () => [...downloadKeys.all, 'completed'] as const,
};

/**
 * Get all active (non-completed) downloads.
 * Includes queued, downloading, paused, and error states.
 */
export function useActiveDownloads() {
  return useQuery<ActiveDownload[]>({
    queryKey: downloadKeys.active(),
    queryFn: getActiveDownloads,
    staleTime: 0,
  });
}

/**
 * Get all completed downloads (chapters with downloadStatus = 3).
 */
export function useCompletedDownloads() {
  return useQuery({
    queryKey: downloadKeys.completed(),
    queryFn: getCompletedDownloads,
    staleTime: 0,
  });
}

/**
 * Enqueue a single chapter for download.
 */
export function useEnqueueDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chapterId,
      mangaId,
      mangaTitle,
      chapterName,
      sourceId,
      chapterUrl,
      priority = 0,
    }: {
      chapterId: number;
      mangaId: number;
      mangaTitle: string;
      chapterName: string;
      sourceId: string;
      chapterUrl: string;
      priority?: number;
    }) => {
      console.log(`[Downloads] 📥 useEnqueueDownload called for chapter ${chapterId}`);

      // Enqueue in DB
      await enqueueChapter({ chapterId, mangaId, priority });
      console.log(`[Downloads] 📝 Chapter ${chapterId} enqueued in DB`);

      // Also enqueue in Zustand store (the worker reads from the store)
      useDownloadStore.getState().enqueue({
        id: chapterId, // use chapterId as the unique ID
        chapterId,
        mangaId,
        mangaTitle,
        chapterName,
        sourceId,
        chapterUrl,
      });
      console.log(`[Downloads] 📝 Chapter ${chapterId} enqueued in Zustand store`);
      console.log(`[Downloads] Queue size: ${useDownloadStore.getState().queue.length}`);

      return { chapterId, mangaId };
    },
    onSuccess: ({ chapterId, mangaId }) => {
      console.log(`[Downloads] ✅ Enqueue success for chapter ${chapterId}, starting worker...`);

      // Invalidate downloads queries
      queryClient.invalidateQueries({ queryKey: downloadKeys.active() });

      // Invalidate the manga chapters query so the UI updates download status
      queryClient.invalidateQueries({ queryKey: mangaKeys.chapters(mangaId) });

      // Wake up the download worker
      startWorker();
    },
    onError: (error) => {
      console.error(`[Downloads] ❌ Enqueue error:`, error);
    },
  });
}

/**
 * Enqueue multiple chapters for download (bulk download).
 */
export function useBulkEnqueueDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      chapters: Array<{
        chapterId: number;
        mangaId: number;
        mangaTitle: string;
        chapterName: string;
        sourceId: string;
        chapterUrl: string;
      }>,
    ) => {
      const mangaIds = new Set<number>();

      // Enqueue all in DB
      await bulkEnqueueChapters(
        chapters.map((ch) => ({
          chapterId: ch.chapterId,
          mangaId: ch.mangaId,
        })),
      );

      // Enqueue all in Zustand store
      for (const ch of chapters) {
        useDownloadStore.getState().enqueue({
          id: ch.chapterId,
          chapterId: ch.chapterId,
          mangaId: ch.mangaId,
          mangaTitle: ch.mangaTitle,
          chapterName: ch.chapterName,
          sourceId: ch.sourceId,
          chapterUrl: ch.chapterUrl,
        });
        mangaIds.add(ch.mangaId);
      }

      return Array.from(mangaIds);
    },
    onSuccess: (mangaIds) => {
      // Invalidate downloads queries
      queryClient.invalidateQueries({ queryKey: downloadKeys.active() });

      // Invalidate the manga chapters queries for all affected manga
      for (const mangaId of mangaIds) {
        queryClient.invalidateQueries({ queryKey: mangaKeys.chapters(mangaId) });
      }

      // Wake up the download worker
      startWorker();
    },
  });
}

/**
 * Delete a downloaded chapter (remove files and database entries).
 */
export function useDeleteDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chapterId, mangaId }: { chapterId: number; mangaId: number }) => {
      // Delete files
      await deleteChapterFiles(mangaId, chapterId);

      // Delete from database
      await deleteDownloadEntry(chapterId);

      // Remove from Zustand store if present
      useDownloadStore.getState().remove(chapterId);

      return { chapterId, mangaId };
    },
    onSuccess: ({ chapterId, mangaId }) => {
      // Invalidate downloads queries
      queryClient.invalidateQueries({ queryKey: downloadKeys.active() });
      queryClient.invalidateQueries({ queryKey: downloadKeys.completed() });

      // Invalidate the manga chapters query so the UI updates download status
      queryClient.invalidateQueries({ queryKey: mangaKeys.chapters(mangaId) });
    },
  });
}

/**
 * Clear all completed downloads (delete files and database entries).
 */
export function useClearCompletedDownloads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get completed downloads first
      const completed = await getCompletedDownloads();

      // Delete all files
      for (const item of completed) {
        await deleteChapterFiles(item.mangaId, item.chapterId);
      }

      // Delete from database
      await deleteAllCompletedDownloads();

      return Array.from(new Set(completed.map((c) => c.mangaId)));
    },
    onSuccess: (mangaIds) => {
      // Invalidate downloads queries
      queryClient.invalidateQueries({ queryKey: downloadKeys.active() });
      queryClient.invalidateQueries({ queryKey: downloadKeys.completed() });

      // Invalidate the manga chapters queries for all affected manga
      for (const mangaId of mangaIds) {
        queryClient.invalidateQueries({ queryKey: mangaKeys.chapters(mangaId) });
      }
    },
  });
}

/**
 * Delete all downloaded chapters for a specific manga.
 */
export function useDeleteMangaDownloads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mangaId, chapterIds }: { mangaId: number; chapterIds: number[] }) => {
      for (const chapterId of chapterIds) {
        await deleteChapterFiles(mangaId, chapterId);
        await deleteDownloadEntry(chapterId);
        useDownloadStore.getState().remove(chapterId);
      }
      return { mangaId };
    },
    onSuccess: ({ mangaId }) => {
      queryClient.invalidateQueries({ queryKey: downloadKeys.active() });
      queryClient.invalidateQueries({ queryKey: downloadKeys.completed() });
      queryClient.invalidateQueries({ queryKey: mangaKeys.chapters(mangaId) });
    },
  });
}
