import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  Check,
  DownloadSimple,
  FolderOpen,
  Sliders,
  Stack,
  Trash,
  X,
} from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import { useTheme } from '@theme/ThemeProvider';
import { typeScale } from '@theme/typeScale';
import PageHeader from '@components/PageHeader';
import LibraryFilterSheet, { type MangaReadingStatus } from '@components/LibraryFilterSheet';
import { BucketPickerModal } from '@components/BucketPickerModal';
import { useLibraryManga, useLibraryChapterCounts, mangaKeys } from '@queries/manga';
import { useSettingsStore } from '@stores/settingsStore';
import { markAllChaptersRead, deleteManga } from '@db/queries/manga';
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
  onLongPress,
  width,
  height,
  selected,
  selectionMode,
}: {
  manga: Manga;
  chapterCounts?: { total: number; readCount: number };
  onPress: () => void;
  onLongPress: () => void;
  width: number;
  height: number;
  selected: boolean;
  selectionMode: boolean;
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
    <TouchableOpacity
      style={[styles.card, { width }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.cardImageBox,
          { width, height },
          selected && styles.cardImageBoxSelected,
        ]}
      >
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
        {selectionMode && (
          <View style={[styles.selectionOverlay, selected && styles.selectionOverlaySelected]}>
            {selected && (
              <View style={styles.checkmark}>
                <Check size={16} color="#ffffff" strokeWidth={3} />
              </View>
            )}
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
  onLongPress,
  selected,
  selectionMode,
}: {
  manga: Manga;
  chapterCounts?: { total: number; readCount: number };
  onPress: () => void;
  onLongPress: () => void;
  selected: boolean;
  selectionMode: boolean;
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
    <TouchableOpacity
      style={[styles.listItem, selected && styles.listItemSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
    >
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
        {selectionMode && selected && (
          <View style={styles.listItemCheckmark}>
            <Check size={14} color="#ffffff" strokeWidth={3} />
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
  const t = useTheme();
  const queryClient = useQueryClient();

  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<MangaReadingStatus>>(new Set());

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bucketPickerMangaId, setBucketPickerMangaId] = useState<number | null>(null);

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

  // ─── Selection helpers ──────────────────────────────────────────────────────

  const toggleSelected = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  // Back handler: exit selection mode on hardware back
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectionMode) {
        exitSelectionMode();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [selectionMode, exitSelectionMode]);

  // ─── Bulk actions ───────────────────────────────────────────────────────────

  const handleMarkRead = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => markAllChaptersRead(id)));
    queryClient.invalidateQueries({ queryKey: mangaKeys.library() });
    queryClient.invalidateQueries({ queryKey: mangaKeys.chapterCounts() });
    exitSelectionMode();
  }, [selectedIds, queryClient, exitSelectionMode]);

  const handleRemove = useCallback(() => {
    const count = selectedIds.size;
    Alert.alert(
      'Remove from library',
      `Remove ${count} manga from your library? This will also delete all chapters and history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const ids = Array.from(selectedIds);
            await Promise.all(ids.map((id) => deleteManga(id)));
            queryClient.invalidateQueries({ queryKey: mangaKeys.library() });
            exitSelectionMode();
          },
        },
      ],
    );
  }, [selectedIds, queryClient, exitSelectionMode]);

  const handleMoveToCategory = useCallback(() => {
    // Open BucketPickerModal for first selected manga (batch would need a multi-manga modal)
    const ids = Array.from(selectedIds);
    if (ids.length === 1) {
      setBucketPickerMangaId(ids[0]);
    } else {
      // For multiple, open for each one sequentially — just open modal for first
      setBucketPickerMangaId(ids[0]);
    }
  }, [selectedIds]);

  const handleDownload = useCallback(() => {
    // Trigger download for all selected manga — navigation to manga detail or queue via store
    // For now, exit selection mode; actual download queueing requires chapter data per manga
    exitSelectionMode();
  }, [exitSelectionMode]);

  // ─── Grid layout ───────────────────────────────────────────────────────────

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
      const isSelected = selectedIds.has(item.id);

      const handlePress = () => {
        if (selectionMode) {
          toggleSelected(item.id);
        } else {
          router.push({ pathname: '/manga/[mangaId]', params: { mangaId: item.id } });
        }
      };

      const handleLongPress = () => {
        if (!selectionMode) {
          setSelectionMode(true);
          setSelectedIds(new Set([item.id]));
        }
      };

      if (libraryDisplayMode === 'list') {
        return (
          <ListItem
            manga={item}
            chapterCounts={progressData}
            onPress={handlePress}
            onLongPress={handleLongPress}
            selected={isSelected}
            selectionMode={selectionMode}
          />
        );
      }

      return (
        <MangaCard
          manga={item}
          chapterCounts={progressData}
          onPress={handlePress}
          onLongPress={handleLongPress}
          width={cardWidth}
          height={cardHeight}
          selected={isSelected}
          selectionMode={selectionMode}
        />
      );
    },
    [router, chapterCounts, libraryDisplayMode, cardWidth, cardHeight, selectedIds, selectionMode, toggleSelected],
  );

  // ─── Header content ─────────────────────────────────────────────────────────

  const headerRight = selectionMode ? (
    <View style={styles.headerActions}>
      <TouchableOpacity
        onPress={() => setSelectedIds(new Set((libraryManga ?? []).map((m) => m.id)))}
        hitSlop={8}
        accessibilityLabel="Select all"
      >
        <Text style={styles.headerActionText}>All</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setSelectedIds(new Set())}
        hitSlop={8}
        accessibilityLabel="Clear selection"
      >
        <Text style={styles.headerActionText}>Clear</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={exitSelectionMode} hitSlop={8} accessibilityLabel="Cancel selection">
        <X size={24} color={t.inkPrimary} />
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.headerActions}>
      <TouchableOpacity onPress={() => router.push('/buckets')} hitSlop={8}>
        <Stack size={24} color={t.inkPrimary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setFilterSheetVisible(true)}>
        <View>
          <Sliders size={24} color={t.inkPrimary} />
          {activeFilters.size > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: t.accent }]} />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  const headerTitle = selectionMode
    ? `${selectedIds.size} selected`
    : 'Library';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.background }]}>
      <PageHeader title={headerTitle} right={headerRight} />

      {filteredManga.length > 0 ? (
        <FlatList
          key={`${numColumns}-${libraryDisplayMode}`}
          data={filteredManga}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={libraryDisplayMode === 'list' ? 1 : numColumns}
          columnWrapperStyle={libraryDisplayMode === 'list' ? undefined : styles.row}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: insets.bottom + (selectionMode ? 160 : 128) },
          ]}
        />
      ) : (
        <View style={styles.empty}>
          <BookOpen size={64} color={t.inkTertiary} />
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
      )}

      {/* Bottom action bar (shown during selection mode) */}
      {selectionMode && (
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + spacing[2] }]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDownload}
            accessibilityLabel="Download selected"
          >
            <DownloadSimple size={24} color={colors.text.secondary} />
            <Text style={styles.actionButtonLabel}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMarkRead}
            accessibilityLabel="Mark selected as read"
          >
            <Check size={24} color={colors.text.secondary} />
            <Text style={styles.actionButtonLabel}>Mark read</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMoveToCategory}
            disabled={selectedIds.size === 0}
            accessibilityLabel="Move to category"
          >
            <FolderOpen size={24} color={selectedIds.size === 0 ? colors.text.muted : colors.text.secondary} />
            <Text style={[styles.actionButtonLabel, selectedIds.size === 0 && styles.actionButtonLabelDisabled]}>
              Category
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRemove}
            accessibilityLabel="Remove selected from library"
          >
            <Trash size={24} color={colors.status.error} />
            <Text style={[styles.actionButtonLabel, { color: colors.status.error }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}

      <LibraryFilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        activeFilters={activeFilters}
        onToggle={handleToggleFilter}
        onClear={handleClearFilters}
      />

      {bucketPickerMangaId !== null && (
        <BucketPickerModal
          visible={bucketPickerMangaId !== null}
          onClose={() => {
            setBucketPickerMangaId(null);
            exitSelectionMode();
          }}
          mangaId={bucketPickerMangaId}
        />
      )}
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
  cardImageBoxSelected: {
    borderWidth: 2,
    borderColor: colors.accent.DEFAULT,
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
    fontFamily: fontFamily.regular,
    color: colors.text.secondary,
    lineHeight: typography.sizes.xs * 1.4,
  },

  // Selection overlay on cards
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 2,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: spacing[1],
  },
  selectionOverlaySelected: {
    backgroundColor: colors.accent.muted,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...typeScale.h2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.regular,
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
  listItemSelected: {
    backgroundColor: colors.accent.muted,
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
  listItemCheckmark: {
    position: 'absolute',
    bottom: spacing[1],
    right: spacing[1],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
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
    fontFamily: fontFamily.regular,
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
  headerActionText: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.semibold,
    color: colors.accent.DEFAULT,
  },

  // Bottom action bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.surface.DEFAULT,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
    paddingTop: spacing[3],
    paddingHorizontal: spacing[2],
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
  },
  actionButtonLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: fontFamily.regular,
    color: colors.text.secondary,
  },
  actionButtonLabelDisabled: {
    color: colors.text.muted,
  },
});
