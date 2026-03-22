import { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import * as Network from 'expo-network';
import ExtensionBridge from 'extension-bridge';
import type { Page } from '@/types/extensions';
import type { ReaderPage } from './types';
import { usePageList } from '@queries/reader';
import { readChapterIndex, chapterDir } from '@utils/downloadPaths';

export function usePageLoader(
  sourceId: string,
  chapterUrl: string,
  currentPage: number,
  preloadCount: number,
  mangaId?: number,
  chapterId?: number,
) {
  const [isLocallyLoaded, setIsLocallyLoaded] = useState(false);
  const [enableNetworkQuery, setEnableNetworkQuery] = useState(false);
  const [isOfflineChecking, setIsOfflineChecking] = useState(!!(mangaId && chapterId));

  const { data: rawPages, isLoading, error } = usePageList(sourceId, chapterUrl, enableNetworkQuery);

  const pagesRef = useRef<Map<number, ReaderPage>>(new Map());
  const [renderKey, setRenderKey] = useState(0);
  const resolvingRef = useRef<Set<number>>(new Set());

  // Check for offline (locally downloaded) chapter on chapter change
  useEffect(() => {
    if (!mangaId || !chapterId) {
      setEnableNetworkQuery(true);
      setIsLocallyLoaded(false);
      setIsOfflineChecking(false);
      return;
    }

    let isMounted = true;

    const checkOffline = async () => {
      try {
        // Try to read the pages.json directly (single filesystem call)
        const index = await readChapterIndex(mangaId, chapterId);
        if (!isMounted) return;

        if (index) {
          // Load from local storage
          const map = new Map<number, ReaderPage>();
          const chapDir = chapterDir(mangaId, chapterId);

          for (const page of index.pages) {
            // Use the actual filename from pages.json to preserve extension (jpg or webp)
            const localPath = `file://${chapDir}${page.filename}`;
            map.set(page.index, {
              index: page.index,
              url: page.url, // Preserve original URL for network fallback if local load fails
              imageUrl: localPath,
              state: 'ready',
            });
          }
          pagesRef.current = map;
          setIsLocallyLoaded(true);
          setEnableNetworkQuery(false);

          // Prefetch all local images
          for (const page of index.pages) {
            const localPath = `file://${chapDir}${page.filename}`;
            Image.prefetch(localPath).catch(() => {});
          }

          setRenderKey((k) => k + 1);
        } else {
          // Not downloaded locally, enable network query
          setIsLocallyLoaded(false);
          setEnableNetworkQuery(true);
        }
      } catch (e) {
        // Error reading index, fall back to network
        if (isMounted) {
          setIsLocallyLoaded(false);
          setEnableNetworkQuery(true);
        }
      } finally {
        if (isMounted) {
          setIsOfflineChecking(false);
        }
      }
    };

    checkOffline();

    return () => {
      isMounted = false;
    };
  }, [mangaId, chapterId]);

  // Check if we should show offline error
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    let isMounted = true;

    const checkOnline = async () => {
      const state = await Network.getNetworkStateAsync();
      if (isMounted) {
        setIsOnline(state.isConnected ?? false);
      }
    };

    checkOnline();
  }, []);

  // Improve error message when offline
  let errorToReturn = error as Error | null;
  if (
    !isOnline &&
    !isLocallyLoaded &&
    error &&
    (error.message.includes('Unable to resolve host') ||
      error.message.includes('network') ||
      error.message.includes('Network'))
  ) {
    errorToReturn = new Error(
      'Offline mode - Cannot fetch chapters that are not downloaded'
    );
  }

  // Clear state when chapter changes
  useEffect(() => {
    if (isLocallyLoaded) {
      // Don't clear local pages when switching chapters
      return;
    }
    pagesRef.current = new Map();
    resolvingRef.current.clear();
    setRenderKey((k) => k + 1);
  }, [chapterUrl, isLocallyLoaded]);

  // Initialize page map when raw pages arrive (skip if loaded locally)
  useEffect(() => {
    if (!rawPages || isLocallyLoaded) return;

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
  }, [rawPages, isLocallyLoaded]);

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

  const markPageError = useCallback((index: number) => {
    const page = pagesRef.current.get(index);
    if (!page) return;
    // Clear imageUrl so retry goes to network, mark as error
    pagesRef.current.set(index, {
      ...page,
      imageUrl: undefined,
      state: 'error',
      error: 'Image failed to load. Retry to fetch from network.',
    });
    resolvingRef.current.delete(index);
    setRenderKey((k) => k + 1);
  }, []);

  const retryPage = useCallback((index: number) => {
    const page = pagesRef.current.get(index);
    if (!page) return;
    pagesRef.current.set(index, { ...page, state: 'queue', error: undefined });
    resolvingRef.current.delete(index);
    setRenderKey((k) => k + 1);
    resolvePageUrl(index);
  }, [sourceId]);

  // Build pages array from map for consumers
  // If loaded locally, use the map size; otherwise use rawPages length
  const totalPages = isLocallyLoaded
    ? pagesRef.current.size
    : (rawPages?.length ?? 0);
  const pages: ReaderPage[] = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push(pagesRef.current.get(i) ?? { index: i, state: 'queue' });
  }

  return {
    pages,
    totalPages,
    isLoading,
    error: errorToReturn,
    retryPage,
    markPageError,
    isOfflineChecking,
  };
}
