import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ExtensionBridge from 'extension-bridge';
import {
  getMangaById,
  getChaptersForManga,
  markChaptersRead,
  markChaptersUnread,
  bulkUpsertHistory,
  deleteHistoryForChapters,
} from '@db/queries/reader';
import {
  getLibraryManga,
  getLibrarySourceUrls,
  getLatestReadChapters,
  getLastReadChapterForResume,
  getLibraryUpdates,
  updateMangaDetails,
  upsertChaptersFromSource,
  toggleMangaInLibrary,
  setMangaSmartDownloads,
  getLibraryChapterCounts,
  updateMangaLastRead,
  type UpdateEntry,
  type ChapterCount,
} from '@db/queries/manga';
import type { Manga } from '@db/schema';
import { bulkEnqueueChapters } from '@db/queries/downloads';
import { useDownloadStore } from '@stores/downloadStore';
import { startWorker } from '@utils/downloadWorker';
import { historyKeys } from '@queries/history';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const mangaKeys = {
  all: ['manga'] as const,
  library: () => [...mangaKeys.all, 'library'] as const,
  updates: () => [...mangaKeys.all, 'updates'] as const,
  detail: (id: number) => [...mangaKeys.all, 'detail', id] as const,
  chapters: (mangaId: number) => [...mangaKeys.all, 'chapters', mangaId] as const,
  chapterCounts: () => [...mangaKeys.library(), 'chapterCounts'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useLibraryManga() {
  return useQuery<Manga[]>({
    queryKey: mangaKeys.library(),
    queryFn: getLibraryManga,
  });
}

export function useMangaDetail(mangaId: number) {
  return useQuery<Manga | undefined>({
    queryKey: mangaKeys.detail(mangaId),
    queryFn: () => getMangaById(mangaId),
    staleTime: Infinity,
  });
}

export function useMangaChapters(mangaId: number) {
  return useQuery({
    queryKey: mangaKeys.chapters(mangaId),
    queryFn: () => getChaptersForManga(mangaId),
    staleTime: Infinity,
  });
}

export function useLibrarySourceUrls(sourceId: string) {
  return useQuery<Set<string>>({
    queryKey: [...mangaKeys.library(), 'sourceUrls', sourceId],
    queryFn: () => getLibrarySourceUrls(sourceId),
  });
}

export function useLatestReadChapters(mangaIds: number[]) {
  return useQuery({
    queryKey: [...mangaKeys.library(), 'latestRead', ...mangaIds],
    queryFn: () => getLatestReadChapters(mangaIds),
    enabled: mangaIds.length > 0,
    staleTime: 0, // always refetch on tab switch so ribbons reflect latest reading
  });
}

export function useLibraryChapterCounts(mangaIds: number[]) {
  return useQuery<Record<number, ChapterCount>>({
    queryKey: mangaKeys.chapterCounts(),
    queryFn: () => getLibraryChapterCounts(mangaIds),
    enabled: mangaIds.length > 0,
    staleTime: 0,
  });
}

export function useLastReadChapter(mangaId: number) {
  return useQuery({
    queryKey: [...mangaKeys.detail(mangaId), 'lastRead'],
    queryFn: () => getLastReadChapterForResume(mangaId),
    staleTime: 0,
  });
}

export function useLibraryUpdates() {
  return useQuery<UpdateEntry[]>({
    queryKey: mangaKeys.updates(),
    queryFn: getLibraryUpdates,
    staleTime: 0,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useFetchMangaDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mangaId,
      sourceId,
      mangaUrl,
    }: {
      mangaId: number;
      sourceId: string;
      mangaUrl: string;
    }) => {
      const details = await ExtensionBridge.getMangaDetails(sourceId, mangaUrl);
      await updateMangaDetails(mangaId, {
        title: details.title,
        author: details.author,
        artist: details.artist,
        description: details.description,
        status: details.status,
        thumbnailUrl: details.thumbnail_url,
        genre: details.genre,
      });
      return mangaId;
    },
    onSuccess: (mangaId) => {
      queryClient.invalidateQueries({ queryKey: mangaKeys.detail(mangaId) });
    },
  });
}

export function useFetchChapterList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mangaId,
      sourceId,
      mangaUrl,
      mangaTitle,
      smartDownloads = false,
    }: {
      mangaId: number;
      sourceId: string;
      mangaUrl: string;
      mangaTitle?: string;
      smartDownloads?: boolean;
    }) => {
      const chapters = await ExtensionBridge.getChapterList(sourceId, mangaUrl);
      const newChapters = await upsertChaptersFromSource(mangaId, chapters);
      return { mangaId, mangaTitle, sourceId, smartDownloads, newChapters };
    },
    onSuccess: async ({ mangaId, mangaTitle, sourceId, smartDownloads, newChapters }) => {
      queryClient.invalidateQueries({ queryKey: mangaKeys.chapters(mangaId) });

      if (smartDownloads && newChapters.length > 0 && mangaTitle) {
        await bulkEnqueueChapters(
          newChapters.map((ch) => ({ chapterId: ch.id, mangaId })),
        );
        for (const ch of newChapters) {
          useDownloadStore.getState().enqueue({
            id: ch.id,
            chapterId: ch.id,
            mangaId,
            mangaTitle,
            chapterName: ch.name,
            sourceId,
            chapterUrl: ch.sourceUrl,
          });
        }
        startWorker();
        queryClient.invalidateQueries({ queryKey: mangaKeys.chapters(mangaId) });
      }
    },
  });
}

export function useToggleLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mangaId,
      inLibrary,
    }: {
      mangaId: number;
      inLibrary: boolean;
    }) => {
      await toggleMangaInLibrary(mangaId, inLibrary);
      return mangaId;
    },
    onSuccess: (mangaId) => {
      queryClient.invalidateQueries({ queryKey: mangaKeys.detail(mangaId) });
      queryClient.invalidateQueries({ queryKey: mangaKeys.library() });
    },
  });
}

export function useToggleSmartDownloads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mangaId,
      enabled,
    }: {
      mangaId: number;
      enabled: boolean;
    }) => {
      await setMangaSmartDownloads(mangaId, enabled);
      return { mangaId };
    },
    onSuccess: ({ mangaId }) => {
      queryClient.invalidateQueries({ queryKey: mangaKeys.detail(mangaId) });
    },
  });
}

export function useBulkMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chapterIds,
      read,
      mangaId,
    }: {
      chapterIds: number[];
      read: boolean;
      mangaId: number;
    }) => {
      if (read) {
        await markChaptersRead(chapterIds);
        await bulkUpsertHistory(chapterIds, mangaId);
      } else {
        await markChaptersUnread(chapterIds);
        await deleteHistoryForChapters(chapterIds);
      }
      return mangaId;
    },
    onSuccess: (mangaId) => {
      // Chapter list in manga detail
      queryClient.invalidateQueries({ queryKey: mangaKeys.chapters(mangaId) });
      // Manga detail page data
      queryClient.invalidateQueries({ queryKey: mangaKeys.detail(mangaId) });
      // Updates tab
      queryClient.invalidateQueries({ queryKey: mangaKeys.updates() });
      // Continue Reading FAB (useLastReadChapter key)
      queryClient.invalidateQueries({ queryKey: [...mangaKeys.detail(mangaId), 'lastRead'] });
      // Library ribbons — specifically invalidate latestRead queries
      queryClient.invalidateQueries({ queryKey: [...mangaKeys.library(), 'latestRead'], exact: false });
      // Library chapter counts (for progress bars)
      queryClient.invalidateQueries({ queryKey: mangaKeys.chapterCounts() });
      // History tab
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}

export function useUpdateLastRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mangaId,
      chapterId,
      pageNumber,
    }: {
      mangaId: number;
      chapterId: number;
      pageNumber: number;
    }) => {
      await updateMangaLastRead(mangaId, chapterId, pageNumber);
      return mangaId;
    },
    onSuccess: (mangaId) => {
      // Invalidate the continue reading query
      queryClient.invalidateQueries({ queryKey: [...mangaKeys.detail(mangaId), 'lastRead'] });
    },
  });
}
