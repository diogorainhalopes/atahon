import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { FlashList, type FlashListRef, type ViewToken } from '@shopify/flash-list';
import type { Chapter } from '@db/schema';
import type { ReaderPage } from './types';
import { ContinuousPageImage } from './ContinuousPageImage';
import { ChapterTransitionPage } from './ChapterTransitionPage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type ListItem =
  | { type: 'transition'; direction: 'prev' | 'next'; key: string }
  | { type: 'page'; page: ReaderPage; key: string };

interface WebtoonViewerProps {
  pages: ReaderPage[];
  currentPage: number;
  initialPage: number;
  currentChapterName: string;
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
  onPageChange: (page: number) => void;
  onRetryPage: (index: number) => void;
  onCenterTap?: () => void;
  onChapterNavigate: (chapterId: number) => void;
}

export const WebtoonViewer = forwardRef<FlashListRef<any>, WebtoonViewerProps>(function WebtoonViewer(
  {
    pages,
    initialPage,
    currentChapterName,
    prevChapter,
    nextChapter,
    onPageChange,
    onRetryPage,
    onCenterTap,
    onChapterNavigate,
  },
  ref,
) {
  const listRef = useRef<FlashListRef<ListItem>>(null);
  useImperativeHandle(ref, () => listRef.current!);

  // Build data array with transition pages
  const data: ListItem[] = [
    { type: 'transition', direction: 'prev', key: 'transition-prev' },
    ...pages.map((page) => ({
      type: 'page' as const,
      page,
      key: `page-${page.index}`,
    })),
    { type: 'transition', direction: 'next', key: 'transition-next' },
  ];

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'transition') {
        return (
          <View style={styles.transitionContainer}>
            <ChapterTransitionPage
              direction={item.direction}
              currentChapterName={currentChapterName}
              targetChapter={item.direction === 'prev' ? prevChapter : nextChapter}
              onNavigate={() => {
                const target = item.direction === 'prev' ? prevChapter : nextChapter;
                if (target) onChapterNavigate(target.id);
              }}
            />
          </View>
        );
      }

      return (
        <ContinuousPageImage
          page={item.page}
          onRetry={onRetryPage}
          onTap={onCenterTap}
        />
      );
    },
    [currentChapterName, prevChapter, nextChapter, onRetryPage, onCenterTap, onChapterNavigate],
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<ListItem>[] }) => {
      const firstPage = viewableItems.find((v) => v.item.type === 'page');
      if (firstPage && firstPage.item.type === 'page') {
        onPageChange(firstPage.item.page.index);
      }
    },
    [onPageChange],
  );

  return (
    <FlashList
      ref={listRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.key}
      initialScrollIndex={initialPage + 1}
      viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      onViewableItemsChanged={onViewableItemsChanged}
      showsVerticalScrollIndicator={false}
      getItemType={(item) => item.type}
    />
  );
});

const styles = StyleSheet.create({
  transitionContainer: {
    height: SCREEN_HEIGHT,
  },
});
