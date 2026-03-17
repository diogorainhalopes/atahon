import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import PagerView from 'react-native-pager-view';
import type { FlashListRef } from '@shopify/flash-list';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { useReaderStore } from '@stores/readerStore';
import { useChapterData } from '@queries/reader';
import { usePageLoader } from '@reader/usePageLoader';
import { useChapterNavigation } from '@reader/useChapterNavigation';
import { PagedViewer } from '@reader/PagedViewer';
import { WebtoonViewer } from '@reader/WebtoonViewer';
import { ReaderOverlay } from '@reader/ReaderOverlay';
import { useKeepScreenOn } from '@reader/useKeepScreenOn';

export default function ReaderScreen() {
  const { mangaId, chapterId } = useLocalSearchParams<{
    mangaId: string;
    chapterId: string;
  }>();

  const numericChapterId = parseInt(chapterId, 10);
  const pagerRef = useRef<PagerView>(null);
  const webtoonRef = useRef<FlashListRef<any>>(null);

  const {
    readingMode,
    scaleType,
    currentPage,
    preloadCount,
    backgroundColor,
    fullscreen,
    showPageNumber,
    keepScreenOn,
    connectPages,
    isOverlayVisible,
    openChapter,
    closeChapter,
    setCurrentPage,
    setTotalPages,
    toggleOverlay,
  } = useReaderStore();

  // Keep screen on while reading
  useKeepScreenOn(keepScreenOn);

  // Fetch chapter + manga data from DB
  const { data: chapter, isLoading: chapterLoading } = useChapterData(numericChapterId);

  // Fetch pages from extension
  const { pages, totalPages, isLoading: pagesLoading, error, retryPage } = usePageLoader(
    chapter?.sourceId ?? '',
    chapter?.sourceUrl ?? '',
    currentPage,
    preloadCount,
  );

  // Chapter navigation (progress saving, adjacent chapters)
  const {
    prevChapter,
    nextChapter,
    navigateToChapter,
    handlePageChange: onNavPageChange,
  } = useChapterNavigation({
    chapterId: numericChapterId,
    mangaId: chapter?.mangaId ?? 0,
    chapterNumber: chapter?.chapterNumber ?? null,
    totalPages,
  });

  // Reset state immediately when chapterId route param changes
  useEffect(() => {
    setCurrentPage(0);
    setTotalPages(0);
  }, [numericChapterId]);

  // Open chapter in store when data arrives
  useEffect(() => {
    if (chapter) {
      openChapter(chapter.id, chapter.mangaId);
    }
  }, [chapter?.id]);

  // Sync total pages
  useEffect(() => {
    if (totalPages > 0) {
      setTotalPages(totalPages);
    }
  }, [totalPages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeChapter();
    };
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      onNavPageChange(page);
    },
    [setCurrentPage, onNavPageChange],
  );

  const handleSeekPage = useCallback(
    (page: number) => {
      if (readingMode === 'webtoon') {
        // +1 for prev transition item
        webtoonRef.current?.scrollToIndex({ index: page + 1, animated: false });
      } else {
        // +1 for prev transition page in PagerView
        pagerRef.current?.setPage(page + 1);
      }
      setCurrentPage(page);
    },
    [setCurrentPage, readingMode],
  );

  // Loading state
  if (chapterLoading || (pagesLoading && pages.length === 0)) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { backgroundColor }]}>
          <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
          <Text style={styles.loadingText}>Loading chapter...</Text>
        </View>
      </>
    );
  }

  // Error state
  if (error || !chapter) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { backgroundColor }]}>
          <Text style={styles.errorText}>
            {error?.message ?? 'Chapter not found'}
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden={fullscreen && !isOverlayVisible} />
      <View style={[styles.reader, { backgroundColor }]}>
        {readingMode === 'webtoon' ? (
          <WebtoonViewer
            ref={webtoonRef}
            pages={pages}
            currentPage={currentPage}
            initialPage={chapter.lastPageRead}
            currentChapterName={chapter.name}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
            onPageChange={handlePageChange}
            onRetryPage={retryPage}
            onCenterTap={toggleOverlay}
            onChapterNavigate={navigateToChapter}
            connectPages={connectPages}
          />
        ) : (
          <PagedViewer
            ref={pagerRef}
            pages={pages}
            currentPage={currentPage}
            initialPage={chapter.lastPageRead}
            readingMode={readingMode}
            scaleType={scaleType}
            currentChapterName={chapter.name}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
            onPageChange={handlePageChange}
            onRetryPage={retryPage}
            onCenterTap={toggleOverlay}
            onChapterNavigate={navigateToChapter}
          />
        )}

        {/* Page number indicator */}
        {showPageNumber && totalPages > 0 && !isOverlayVisible && (
          <View style={styles.pageIndicator}>
            <Text style={styles.pageIndicatorText}>
              {currentPage + 1} / {totalPages}
            </Text>
          </View>
        )}

        <ReaderOverlay
          chapterName={chapter.name}
          mangaTitle=""
          currentPage={currentPage}
          totalPages={totalPages}
          onSeekPage={handleSeekPage}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  reader: {
    flex: 1,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },
  errorText: {
    fontSize: typography.sizes.base,
    color: colors.status.error,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pageIndicatorText: {
    fontSize: typography.sizes.xs,
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
});
