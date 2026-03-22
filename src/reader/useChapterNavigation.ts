import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAdjacentChapters, readerKeys } from '@queries/reader';
import { mangaKeys } from '@queries/manga';
import { useSettingsStore } from '@stores/settingsStore';
import {
  saveReadingProgress,
  markChapterRead,
  upsertHistory,
} from '@db/queries/reader';
import { deleteDownloadEntry } from '@db/queries/downloads';
import { deleteChapterFiles } from '@utils/downloadPaths';

const DEBOUNCE_MS = 2000;

interface UseChapterNavigationParams {
  chapterId: number;
  mangaId: number;
  chapterNumber: number | null;
  totalPages: number;
  smartDownloads?: boolean;
}

export function useChapterNavigation({
  chapterId,
  mangaId,
  chapterNumber,
  totalPages,
  smartDownloads = false,
}: UseChapterNavigationParams) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const anonymousMode = useSettingsStore((s) => s.anonymousMode);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSavedPage = useRef(-1);
  const pendingPage = useRef(-1);

  const { data: adjacent, isLoading } = useAdjacentChapters(
    mangaId,
    chapterNumber,
    chapterId,
  );

  // Record history on mount (guard against mangaId=0 before chapter data loads)
  useEffect(() => {
    if (mangaId > 0 && !anonymousMode) {
      upsertHistory(chapterId, mangaId).catch(() => {});
    }
  }, [chapterId, mangaId, anonymousMode]);

  // Flush pending progress on unmount
  useEffect(() => {
    return () => {
      clearTimeout(debounceTimer.current);
      if (!anonymousMode && pendingPage.current >= 0 && pendingPage.current !== lastSavedPage.current) {
        saveReadingProgress(chapterId, pendingPage.current).catch(() => {});
      }
    };
    // chapterId is stable per mount (from route params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anonymousMode]);

  const saveProgress = useCallback(
    (pageIndex: number) => {
      pendingPage.current = pageIndex;
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        if (!anonymousMode && pageIndex !== lastSavedPage.current) {
          lastSavedPage.current = pageIndex;
          saveReadingProgress(chapterId, pageIndex).catch(() => {});
        }
      }, DEBOUNCE_MS);
    },
    [chapterId, anonymousMode],
  );

  const markRead = useCallback(() => {
    markChapterRead(chapterId).catch(() => {});
  }, [chapterId]);

  // Auto mark-read when reaching last page
  const handlePageChange = useCallback(
    (pageIndex: number) => {
      saveProgress(pageIndex);

      if (totalPages > 0 && pageIndex >= totalPages - 1) {
        if (!anonymousMode) {
          markRead();
        }
        if (smartDownloads) {
          deleteChapterFiles(mangaId, chapterId).catch(() => {});
          deleteDownloadEntry(chapterId).catch(() => {});
          queryClient.invalidateQueries({ queryKey: mangaKeys.chapters(mangaId) });
        }
      }

      // Prefetch next chapter's page list when nearing the end
      if (totalPages > 0 && pageIndex >= totalPages - 3 && adjacent?.next) {
        const nextChapter = adjacent.next;
        queryClient.prefetchQuery({
          queryKey: readerKeys.chapter(nextChapter.id),
        });
      }
    },
    [saveProgress, markRead, totalPages, adjacent, queryClient, smartDownloads, mangaId, chapterId, anonymousMode],
  );

  const navigateToChapter = useCallback(
    (targetChapterId: number) => {
      // Flush any pending progress save
      clearTimeout(debounceTimer.current);
      if (lastSavedPage.current >= 0) {
        saveReadingProgress(chapterId, lastSavedPage.current).catch(() => {});
      }

      router.replace(`/manga/${mangaId}/reader/${targetChapterId}`);
    },
    [router, mangaId, chapterId],
  );

  return {
    prevChapter: adjacent?.prev ?? null,
    nextChapter: adjacent?.next ?? null,
    navigateToChapter,
    handlePageChange,
    isLoading,
  };
}
