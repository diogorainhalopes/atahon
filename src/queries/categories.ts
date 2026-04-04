import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllCategories,
  createCategory,
  deleteCategory,
  getMangaCountsForCategories,
  getMangaInCategory,
  getCategoryIdsForManga,
  getBucketPreviewThumbnails,
  addMangaToCategory,
  removeMangaFromCategory,
} from '@db/queries/categories';
import type { Category, Manga } from '@db/schema';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  counts: () => [...categoryKeys.all, 'counts'] as const,
  previews: () => [...categoryKeys.all, 'previews'] as const,
  mangaInBucket: (id: number) => [...categoryKeys.all, 'bucket', id, 'manga'] as const,
  mangaBuckets: (mangaId: number) => [...categoryKeys.all, 'mangaBuckets', mangaId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: categoryKeys.lists(),
    queryFn: getAllCategories,
    staleTime: Infinity,
  });
}

export function useCategoryMangaCounts(categoryIds: number[]) {
  return useQuery<Record<number, number>>({
    queryKey: categoryKeys.counts(),
    queryFn: () => getMangaCountsForCategories(categoryIds),
    enabled: categoryIds.length > 0,
    staleTime: Infinity,
  });
}

export function useMangaInCategory(categoryId: number, enabled = true) {
  return useQuery<Manga[]>({
    queryKey: categoryKeys.mangaInBucket(categoryId),
    queryFn: () => getMangaInCategory(categoryId),
    enabled,
    staleTime: Infinity,
  });
}

export function useBucketPreviews(categoryIds: number[]) {
  return useQuery<Record<number, string[]>>({
    queryKey: [...categoryKeys.previews(), categoryIds],
    queryFn: () => getBucketPreviewThumbnails(categoryIds),
    enabled: categoryIds.length > 0,
    staleTime: Infinity,
  });
}

export function useCategoryIdsForManga(mangaId: number) {
  return useQuery<number[]>({
    queryKey: categoryKeys.mangaBuckets(mangaId),
    queryFn: () => getCategoryIdsForManga(mangaId),
    staleTime: Infinity,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      return createCategory(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.counts() });
    },
    onError: (error: unknown) => {
      // Error will be handled by caller
      console.error('Create category error:', error);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      await deleteCategory(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useToggleMangaInCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mangaId,
      categoryId,
      add,
    }: {
      mangaId: number;
      categoryId: number;
      add: boolean;
    }) => {
      if (add) {
        await addMangaToCategory(mangaId, categoryId);
      } else {
        await removeMangaFromCategory(mangaId, categoryId);
      }
      return { mangaId, categoryId };
    },
    onSuccess: ({ mangaId, categoryId }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.mangaBuckets(mangaId) });
      queryClient.invalidateQueries({ queryKey: categoryKeys.mangaInBucket(categoryId) });
      queryClient.invalidateQueries({ queryKey: categoryKeys.counts() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.previews() });
    },
  });
}
