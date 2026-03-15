import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ExtensionBridge from 'extension-bridge';
import type { MangasPage } from '@/types/extensions';
import { db } from '@db/client';
import { manga } from '@db/schema';
import { and, eq } from 'drizzle-orm';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const sourceKeys = {
  all: ['source'] as const,
  popular: (sourceId: string) => [...sourceKeys.all, sourceId, 'popular'] as const,
  latest: (sourceId: string) => [...sourceKeys.all, sourceId, 'latest'] as const,
  search: (sourceId: string, query: string) =>
    [...sourceKeys.all, sourceId, 'search', query] as const,
};

// ─── Manga list hooks (infinite queries) ─────────────────────────────────────

export function usePopularManga(sourceId: string) {
  return useInfiniteQuery<MangasPage>({
    queryKey: sourceKeys.popular(sourceId),
    queryFn: ({ pageParam }) =>
      ExtensionBridge.getPopularManga(sourceId, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage ? allPages.length + 1 : undefined,
    staleTime: 5 * 60_000,
  });
}

export function useLatestUpdates(sourceId: string) {
  return useInfiniteQuery<MangasPage>({
    queryKey: sourceKeys.latest(sourceId),
    queryFn: ({ pageParam }) =>
      ExtensionBridge.getLatestUpdates(sourceId, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage ? allPages.length + 1 : undefined,
    staleTime: 5 * 60_000,
  });
}

export function useSearchManga(sourceId: string, query: string, enabled: boolean) {
  return useInfiniteQuery<MangasPage>({
    queryKey: sourceKeys.search(sourceId, query),
    queryFn: ({ pageParam }) =>
      ExtensionBridge.searchManga(sourceId, pageParam as number, query, { filters: [] }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage ? allPages.length + 1 : undefined,
    staleTime: 5 * 60_000,
    enabled: enabled && query.length > 0,
  });
}

// ─── Upsert manga into DB when tapping from browse ───────────────────────────

export function useUpsertBrowseManga() {
  return useMutation({
    mutationFn: async ({
      sourceId,
      sourceUrl,
      title,
      thumbnailUrl,
    }: {
      sourceId: string;
      sourceUrl: string;
      title: string;
      thumbnailUrl?: string;
    }) => {
      // Find existing record first
      const existing = await db
        .select({ id: manga.id })
        .from(manga)
        .where(and(eq(manga.sourceId, sourceId), eq(manga.sourceUrl, sourceUrl)))
        .limit(1);

      if (existing.length > 0) {
        return existing[0].id;
      }

      const rows = await db
        .insert(manga)
        .values({
          sourceId,
          sourceUrl,
          title,
          thumbnailUrl,
          status: 0,
          inLibrary: false,
          initialized: false,
        })
        .returning({ id: manga.id });

      return rows[0].id;
    },
  });
}
