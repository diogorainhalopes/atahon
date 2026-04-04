import { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, SlidersHorizontal, Layers } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import PageHeader from '@components/PageHeader';
import LibraryFilterSheet, { type MangaReadingStatus } from '@components/LibraryFilterSheet';
import { useLibraryManga, useLibraryChapterCounts } from '@queries/manga';
import { useSettingsStore } from '@stores/settingsStore';
import type { Manga } from '@db/schema';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = spacing[2];
const CARD_PADDING = spacing[3];

// ─── Helper: Derive reading status ─────────────────────────────────────────────

function deriveMangaReadingStatus(
  manga: Manga,
  counts?: { total: number; readCount: number }
): MangaReadingStatus {
  if (manga.status === 2) return 'completed';
  if (!counts || counts.readCount === 0) return 'not_started';
  if (counts.readCount >= counts.total) return 'caught_up';
  return 'reading';
}

// ─── MangaCard (Grid mode) ────────────────────────────────────────────────────

function MangaCard({
  manga,
  chapterCounts,
  onPress,
  width,
  height,
}: {
  manga: Manga;
  chapterCounts?: { total: number; readCount: number };
  onPress: () => void;
  width: number;
  height: number;
}) {
  const progressPercentage = chapterCounts ? (chapterCounts.readCount / chapterCounts.total) * 100 : 0;
  const progressColor =
    !chapterCounts || chapterCounts.readCount === 0
      ? undefined
      : chapterCounts.readCount >= chapterCounts.total
        ? manga.status === 2
          ? colors.status.success // green — completed manga, all read
          : colors.status.info // blue — caught up on ongoing
        : colors.status.warning; // yellow — in progress

  return (
    <TouchableOpacity style={[styles.card, { width }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.cardImageBox, { width, height }]}>
        {manga.thumbnailUrl ? (
          <Image
            source={{ uri: manga.thumbnailUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cardPlaceholder}>
            <Text style={styles.cardPlaceholderLetter}>
              {manga.title.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {progressColor && (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {manga.title}
      </Text>
    </TouchableOpacity>
  );
}

// ─── ListItem (List mode) ─────────────────────────────────────────────────────

function ListItem({
  manga,
  chapterCounts,
  onPress,
}: {
  manga: Manga;
  chapterCounts?: { total: number; readCount: number };
  onPress: () => void;
}) {
  const progressPercentage = chapterCounts ? (chapterCounts.readCount / chapterCounts.total) * 100 : 0;
  const progressColor =
    !chapterCounts || chapterCounts.readCount === 0
      ? undefined
      : chapterCounts.readCount >= chapterCounts.total
        ? manga.status === 2
          ? colors.status.success // green — completed manga, all read
          : colors.status.info // blue — caught up on ongoing
        : colors.status.warning; // yellow — in progress

  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.listItemImage}>
        {manga.thumbnailUrl ? (
          <ExpoImage source={{ uri: manga.thumbnailUrl }} style={styles.listItemImageContent} contentFit="cover" />
        ) : (
          <View style={styles.listItemPlaceholder}>
            <Text style={styles.listItemPlaceholderLetter}>{manga.title.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        {progressColor && (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
        )}
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle} numberOfLines={1}>
          {manga.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── LibraryScreen ───────────────────────────────────────────────────────────

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<MangaReadingStatus>>(new Set());
  const { data: libraryManga } = useLibraryManga();
  const mangaIds = useMemo(() => (libraryManga ?? []).map((m) => m.id), [libraryManga]);
  const { data: chapterCounts } = useLibraryChapterCounts(mangaIds);

  const gridSize = useSettingsStore((s) => s.gridSize);
  const libraryDisplayMode = useSettingsStore((s) => s.libraryDisplayMode);

  const filteredManga = useMemo(() => {
    if (activeFilters.size === 0) return libraryManga ?? [];
    return (libraryManga ?? []).filter((manga) => {
      const counts = chapterCounts?.[manga.id];
      const status = deriveMangaReadingStatus(manga, counts);
      return activeFilters.has(status);
    });
  }, [libraryManga, chapterCounts, activeFilters]);

  const handleToggleFilter = useCallback((status: MangaReadingStatus) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  }, []);

  const handleClearFilters = useCallback(() => setActiveFilters(new Set()), []);

  const { numColumns, cardWidth, cardHeight } = useMemo(() => {
    const numColumns = gridSize === 'small' ? 4 : gridSize === 'large' ? 2 : 3;
    const cardWidth =
      (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP * (numColumns - 1)) / numColumns;
    return { numColumns, cardWidth, cardHeight: cardWidth * 1.45 };
  }, [gridSize]);

  const renderItem = useCallback(
    ({ item }: { item: Manga }) => {
      const counts = chapterCounts?.[item.id];
      const progressData = counts ? { total: counts.total, readCount: counts.readCount } : undefined;

      if (libraryDisplayMode === 'list') {
        return <ListItem manga={item} chapterCounts={progressData} onPress={() => router.push({ pathname: '/manga/[mangaId]', params: { mangaId: item.id } })} />;
      }

      return (
        <MangaCard
          manga={item}
          chapterCounts={progressData}
          onPress={() => router.push({ pathname: '/manga/[mangaId]', params: { mangaId: item.id } })}
          width={cardWidth}
          height={cardHeight}
        />
      );
    },
    [router, chapterCounts, libraryDisplayMode, cardWidth, cardHeight, activeFilters],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <PageHeader
        title="Library"
        right={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/buckets')} hitSlop={8}>
              <Layers size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFilterSheetVisible(true)}>
              <View>
                <SlidersHorizontal size={24} color={colors.text.primary} />
                {activeFilters.size > 0 && (
                  <View
                    style={[
                      styles.filterBadge,
                      { backgroundColor: colors.accent.DEFAULT },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>
        }
      />

      <FlatList
        key={`${numColumns}-${libraryDisplayMode}`}
        data={filteredManga}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        numColumns={libraryDisplayMode === 'list' ? 1 : numColumns}
        columnWrapperStyle={libraryDisplayMode === 'list' ? undefined : styles.row}
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: insets.bottom + 128 },
          filteredManga.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <BookOpen size={64} color={colors.text.muted} strokeWidth={1.5} />
            {libraryManga?.length === 0 ? (
              <>
                <Text style={styles.emptyTitle}>Your library is empty</Text>
                <Text style={styles.emptySubtitle}>
                  Browse extensions to find and add manga to your library
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>No manga found</Text>
                <Text style={styles.emptySubtitle}>
                  Try adjusting your filters
                </Text>
              </>
            )}
          </View>
        }
      />

      <LibraryFilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        activeFilters={activeFilters}
        onToggle={handleToggleFilter}
        onClear={handleClearFilters}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  grid: {
    padding: CARD_PADDING,
  },
  row: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    // width set dynamically via style prop
  },
  cardImageBox: {
    // width and height set dynamically via style prop
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface.DEFAULT,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.elevated,
  },
  cardPlaceholderLetter: {
    fontSize: typography.sizes['3xl'],
    fontFamily: fontFamily.bold,
    color: colors.text.muted,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 1,
  },
  progressFill: {
    height: 3,
  },
  cardTitle: {
    marginTop: spacing[1],
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: typography.sizes.xs * 1.4,
  },
  emptyList: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    textAlign: 'center',
  },

  // List mode styles
  listItem: {
    flexDirection: 'row',
    paddingHorizontal: CARD_PADDING,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: spacing[3],
    alignItems: 'center',
  },
  listItemImage: {
    width: 48,
    height: 64,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface.DEFAULT,
  },
  listItemImageContent: {
    width: '100%',
    height: '100%',
  },
  listItemPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.elevated,
  },
  listItemPlaceholderLetter: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.bold,
    color: colors.text.muted,
  },
  listItemContent: {
    flex: 1,
    gap: spacing[1],
  },
  listItemTitle: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: colors.text.primary,
  },
  listItemChapter: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },

  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[5],
  },
});
