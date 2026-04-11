import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import type { Chapter } from '@db/schema';
import type { ReaderPage, TapZone } from './types';
import type { ReadingMode, ScaleType } from '@stores/readerStore';
import { PageImage } from './PageImage';
import { ChapterTransitionPage } from './ChapterTransitionPage';

interface PagedViewerProps {
  pages: ReaderPage[];
  currentPage: number;
  initialPage: number;
  readingMode: ReadingMode;
  scaleType: ScaleType;
  currentChapterName: string;
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
  onPageChange: (page: number) => void;
  onRetryPage: (index: number) => void;
  onImageError: (index: number) => void;
  onCenterTap?: () => void;
  onLongPress?: () => void;
  onChapterNavigate: (chapterId: number) => void;
}

export const PagedViewer = forwardRef<PagerView, PagedViewerProps>(function PagedViewer(
  {
    pages,
    currentPage,
    initialPage,
    readingMode,
    scaleType,
    currentChapterName,
    prevChapter,
    nextChapter,
    onPageChange,
    onRetryPage,
    onImageError,
    onCenterTap,
    onLongPress,
    onChapterNavigate,
  },
  ref,
) {
  const pagerRef = useRef<PagerView>(null);
  useImperativeHandle(ref, () => pagerRef.current!);

  // Transition pages add offset: [prevTransition, ...pages, nextTransition]
  const OFFSET = 1; // prev transition page at index 0
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const pagerIndex = e.nativeEvent.position;
      const pageIndex = pagerIndex - OFFSET;

      // Ignore transition page selections
      if (pageIndex >= 0 && pageIndex < pages.length) {
        onPageChange(pageIndex);
      }
    },
    [onPageChange, pages.length],
  );

  const handleTapZone = useCallback(
    (zone: TapZone) => {
      if (zone === 'center') {
        onCenterTap?.();
        return;
      }

      const page = currentPageRef.current;
      const isRtl = readingMode === 'rtl';
      const goNext = (zone === 'right' && !isRtl) || (zone === 'left' && isRtl);
      const goPrev = (zone === 'left' && !isRtl) || (zone === 'right' && isRtl);

      if (goNext && page < pages.length - 1) {
        pagerRef.current?.setPage(page + OFFSET + 1);
      } else if (goPrev && page > 0) {
        pagerRef.current?.setPage(page + OFFSET - 1);
      }
    },
    [readingMode, pages.length, onCenterTap],
  );

  const orientation = readingMode === 'vertical' ? 'vertical' : 'horizontal';
  const layoutDirection = readingMode === 'rtl' ? 'rtl' : 'ltr';

  return (
    <PagerView
      ref={pagerRef}
      style={styles.pager}
      initialPage={initialPage + OFFSET}
      orientation={orientation}
      layoutDirection={layoutDirection}
      offscreenPageLimit={3}
      onPageSelected={handlePageSelected}
      overdrag
    >
      {/* Previous chapter transition */}
      <View key="transition-prev" style={styles.page}>
        <ChapterTransitionPage
          direction="prev"
          currentChapterName={currentChapterName}
          targetChapter={prevChapter}
          onNavigate={() => prevChapter && onChapterNavigate(prevChapter.id)}
        />
      </View>

      {/* Content pages */}
      {pages.map((page) => (
        <View key={page.index} style={styles.page}>
          <PageImage
            page={page}
            scaleType={scaleType}
            onRetry={onRetryPage}
            onTapZone={handleTapZone}
            onImageError={onImageError}
            onLongPress={onLongPress}
          />
        </View>
      ))}

      {/* Next chapter transition */}
      <View key="transition-next" style={styles.page}>
        <ChapterTransitionPage
          direction="next"
          currentChapterName={currentChapterName}
          targetChapter={nextChapter}
          onNavigate={() => nextChapter && onChapterNavigate(nextChapter.id)}
        />
      </View>
    </PagerView>
  );
});

const styles = StyleSheet.create({
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
