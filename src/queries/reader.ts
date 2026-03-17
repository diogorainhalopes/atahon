import { useQuery } from '@tanstack/react-query';
import ExtensionBridge from 'extension-bridge';
import type { Page } from '@/types/extensions';
import type { ReaderChapter } from '@reader/types';
import {
  getChapterById,
  getMangaById,
  getAdjacentChapters,
} from '@db/queries/reader';

export const readerKeys = {
  all: ['reader'] as const,
  chapter: (id: number) => [...readerKeys.all, 'chapter', id] as const,
  pages: (chapterUrl: string) => [...readerKeys.all, 'pages', chapterUrl] as const,
  adjacent: (mangaId: number, chapterId: number) =>
    [...readerKeys.all, 'adjacent', mangaId, chapterId] as const,
};

export function useChapterData(chapterId: number) {
  return useQuery<ReaderChapter | null>({
    queryKey: readerKeys.chapter(chapterId),
    queryFn: async () => {
      const ch = await getChapterById(chapterId);
      if (!ch) return null;

      const m = await getMangaById(ch.mangaId);
      if (!m) return null;

      return {
        id: ch.id,
        mangaId: ch.mangaId,
        sourceId: m.sourceId,
        sourceUrl: ch.sourceUrl,
        name: ch.name,
        chapterNumber: ch.chapterNumber,
        lastPageRead: ch.lastPageRead,
        read: ch.read,
      };
    },
    staleTime: Infinity,
  });
}

export function usePageList(
  sourceId: string,
  chapterUrl: string,
  enabled: boolean,
) {
  return useQuery<Page[]>({
    queryKey: readerKeys.pages(chapterUrl),
    queryFn: () => ExtensionBridge.getPageList(sourceId, chapterUrl),
    enabled,
    staleTime: 30 * 60_000, // pages don't change often
  });
}

export function useAdjacentChapters(
  mangaId: number,
  chapterNumber: number | null,
  chapterId: number,
) {
  return useQuery({
    queryKey: readerKeys.adjacent(mangaId, chapterId),
    queryFn: () => getAdjacentChapters(mangaId, chapterNumber, chapterId),
    enabled: mangaId > 0,
    staleTime: Infinity,
  });
}
