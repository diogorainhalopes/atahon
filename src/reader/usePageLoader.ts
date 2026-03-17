import { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import ExtensionBridge from 'extension-bridge';
import type { Page } from '@/types/extensions';
import type { ReaderPage } from './types';
import { usePageList } from '@queries/reader';

export function usePageLoader(
  sourceId: string,
  chapterUrl: string,
  currentPage: number,
  preloadCount: number,
) {
  const { data: rawPages, isLoading, error } = usePageList(sourceId, chapterUrl, !!sourceId);

  const pagesRef = useRef<Map<number, ReaderPage>>(new Map());
  const [renderKey, setRenderKey] = useState(0);
  const resolvingRef = useRef<Set<number>>(new Set());

  // Clear state when chapter changes
  useEffect(() => {
    pagesRef.current = new Map();
    resolvingRef.current.clear();
    setRenderKey((k) => k + 1);
  }, [chapterUrl]);

  // Initialize page map when raw pages arrive
  useEffect(() => {
    if (!rawPages) return;

    const map = new Map<number, ReaderPage>();
    for (const p of rawPages) {
      const existing = pagesRef.current.get(p.index);
      if (existing && existing.state === 'ready') {
        map.set(p.index, existing);
      } else {
        map.set(p.index, {
          index: p.index,
          url: p.url,
          imageUrl: p.imageUrl,
          state: p.imageUrl ? 'ready' : 'queue',
        });
      }
    }
    pagesRef.current = map;
    resolvingRef.current.clear();
    setRenderKey((k) => k + 1);

    // Prefetch pages that already have imageUrl
    for (const p of rawPages) {
      if (p.imageUrl) {
        Image.prefetch(p.imageUrl).catch(() => {});
      }
    }
  }, [rawPages]);

  // Resolve URLs and prefetch when currentPage changes
  useEffect(() => {
    if (!rawPages || rawPages.length === 0) return;

    const start = Math.max(0, currentPage);
    const end = Math.min(rawPages.length - 1, currentPage + preloadCount);

    // Also resolve 1 page behind for back-swiping
    const behindStart = Math.max(0, currentPage - 1);

    const toResolve: number[] = [];
    for (let i = behindStart; i <= end; i++) {
      const page = pagesRef.current.get(i);
      if (page && page.state === 'queue' && !resolvingRef.current.has(i)) {
        toResolve.push(i);
      }
    }

    if (toResolve.length === 0) return;

    // Resolve current page first, then the rest
    const sorted = toResolve.sort((a, b) => {
      if (a === currentPage) return -1;
      if (b === currentPage) return 1;
      return a - b;
    });

    for (const idx of sorted) {
      resolvePageUrl(idx);
    }
  }, [currentPage, rawPages, preloadCount]);

  async function resolvePageUrl(index: number) {
    const page = pagesRef.current.get(index);
    if (!page || page.state === 'ready' || resolvingRef.current.has(index)) return;

    resolvingRef.current.add(index);

    // Update state to loading
    pagesRef.current.set(index, { ...page, state: 'loading' });
    setRenderKey((k) => k + 1);

    try {
      let imageUrl = page.imageUrl;

      if (!imageUrl && page.url) {
        imageUrl = await ExtensionBridge.getImageUrl(sourceId, index, page.url);
      }

      if (!imageUrl) {
        throw new Error('No image URL available');
      }

      // Prefetch into expo-image cache
      await Image.prefetch(imageUrl);

      pagesRef.current.set(index, {
        ...page,
        imageUrl,
        state: 'ready',
      });
    } catch (e) {
      pagesRef.current.set(index, {
        ...page,
        state: 'error',
        error: e instanceof Error ? e.message : 'Failed to load page',
      });
    } finally {
      resolvingRef.current.delete(index);
      setRenderKey((k) => k + 1);
    }
  }

  const retryPage = useCallback((index: number) => {
    const page = pagesRef.current.get(index);
    if (!page) return;
    pagesRef.current.set(index, { ...page, state: 'queue', error: undefined });
    resolvingRef.current.delete(index);
    setRenderKey((k) => k + 1);
    resolvePageUrl(index);
  }, [sourceId]);

  // Build pages array from map for consumers
  const totalPages = rawPages?.length ?? 0;
  const pages: ReaderPage[] = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push(pagesRef.current.get(i) ?? { index: i, state: 'queue' });
  }

  return {
    pages,
    totalPages,
    isLoading,
    error: error as Error | null,
    retryPage,
  };
}
