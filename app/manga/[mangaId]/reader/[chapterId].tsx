import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import PagerView from 'react-native-pager-view';
import type { FlashListRef } from '@shopify/flash-list';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { useReaderStore } from '@stores/readerStore';
import { useChapterData } from '@queries/reader';
import { useMangaDetail } from '@queries/manga';
import { usePageLoader } from '@reader/usePageLoader';
import { useChapterNavigation } from '@reader/useChapterNavigation';
import { PagedViewer } from '@reader/PagedViewer';
import { WebtoonViewer } from '@reader/WebtoonViewer';
import { ReaderOverlay } from '@reader/ReaderOverlay';
import { useKeepScreenOn } from '@reader/useKeepScreenOn';

export default function ReaderScreen() {
  const router = useRouter();
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

  // Fetch pages from extension (or local storage if downloaded)
  // Parse mangaId from route params as fallback if chapter data not yet loaded
  const numericMangaId = parseInt(mangaId, 10);
  const { data: manga } = useMangaDetail(chapter?.mangaId ?? numericMangaId);
  const { pages, totalPages, isLoading: pagesLoading, error, retryPage, markPageError, isOfflineChecking } = usePageLoader(
    chapter?.sourceId ?? '',
    chapter?.sourceUrl ?? '',
    currentPage,
    preloadCount,
    chapter?.mangaId ?? numericMangaId,
    numericChapterId,
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
    smartDownloads: manga?.smartDownloads ?? false,
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
        webtoonRef.current?.scrollToIndex({ index: page + 1, animated: true });
      } else {
        // +1 for prev transition page in PagerView
        pagerRef.current?.setPage(page + 1);
      }
      setCurrentPage(page);
    },
    [setCurrentPage, readingMode],
  );

  const handleLongPress = useCallback(() => {
    toggleOverlay();
  }, [toggleOverlay]);

  // Loading state
  if (chapterLoading || isOfflineChecking || (pagesLoading && pages.length === 0)) {
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={colors.text.primary} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
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
            onImageError={markPageError}
            onCenterTap={toggleOverlay}
            onLongPress={handleLongPress}
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
            onImageError={markPageError}
            onCenterTap={toggleOverlay}
            onLongPress={handleLongPress}
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
          pages={pages}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  backButtonText: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontFamily: fontFamily.medium,
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
