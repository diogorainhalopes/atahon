import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ExtensionBridge from 'extension-bridge';
import { getMangaById, getChaptersForManga } from '@db/queries/reader';
import {
  updateMangaDetails,
  upsertChaptersFromSource,
  toggleMangaInLibrary,
} from '@db/queries/manga';
import type { Manga } from '@db/schema';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const mangaKeys = {
  all: ['manga'] as const,
  detail: (id: number) => [...mangaKeys.all, 'detail', id] as const,
  chapters: (mangaId: number) => [...mangaKeys.all, 'chapters', mangaId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

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
    }: {
      mangaId: number;
      sourceId: string;
      mangaUrl: string;
    }) => {
      const chapters = await ExtensionBridge.getChapterList(sourceId, mangaUrl);
      await upsertChaptersFromSource(mangaId, chapters);
      return mangaId;
    },
    onSuccess: (mangaId) => {
      queryClient.invalidateQueries({ queryKey: mangaKeys.chapters(mangaId) });
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
    },
  });
}
