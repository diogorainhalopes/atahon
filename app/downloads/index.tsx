import { useCallback, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Trash2, X, ChevronDown, ChevronRight } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  LinearTransition,
} from 'react-native-reanimated';

import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import {
  useActiveDownloads,
  useCompletedDownloads,
  useDeleteDownload,
  useClearCompletedDownloads,
  useDeleteMangaDownloads,
} from '@queries/downloads';
import { useDownloadStore } from '@stores/downloadStore';
import { useChapterDownloadInfo } from '@hooks/useChapterDownloadInfo';

const THUMB_SIZE = 40;

// ─── Types ───────────────────────────────────────────────────────────

type ChapterItem = {
  type: 'active' | 'completed';
  chapterId: number;
  mangaId: number;
  chapterName: string;
  progress?: number;
};

type MangaSection = {
  mangaId: number;
  mangaTitle: string;
  thumbnailUrl: string | null;
  totalCount: number;
  allChapterIds: number[];
  data: ChapterItem[];
};

// ─── DownloadRow ─────────────────────────────────────────────────────

interface DownloadRowProps {
  chapterId: number;
  mangaId: number;
  chapterName: string;
  progress?: number;
  isActive?: boolean;
  onDelete: () => void;
  isLastItem?: boolean;
}

function DownloadRow({
  chapterId,
  mangaId,
  chapterName,
  progress = 0,
  isActive = false,
  onDelete,
  isLastItem = false,
}: DownloadRowProps) {
  const { info: downloadInfo } = useChapterDownloadInfo(mangaId, chapterId);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + sizes[i];
  };

  const compressionLabel = downloadInfo
    ? downloadInfo.isCompressed
      ? `${downloadInfo.quality || 'Unknown'} Quality`
      : 'Original Quality'
    : null;

  const sizeLabel = downloadInfo ? formatSize(downloadInfo.sizeBytes) : null;

  return (
    <View style={[styles.downloadRow, isLastItem && styles.downloadRowLast]}>
      <View style={styles.rowInfo}>
        <Text style={styles.chapterLabel} numberOfLines={1}>
          {chapterName}
        </Text>

        {compressionLabel && sizeLabel && (
          <Text style={styles.compressionLabel} numberOfLines={1}>
            ({compressionLabel} - {sizeLabel})
          </Text>
        )}

        {isActive && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(progress * 100, 5)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        hitSlop={8}
        activeOpacity={0.7}
      >
        {isActive ? (
          <X size={16} color={colors.text.muted} />
        ) : (
          <Trash2 size={16} color={colors.text.muted} />
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── AnimatedDownloadRow ─────────────────────────────────────────────

function AnimatedDownloadRow(props: DownloadRowProps) {
  const { onDelete, ...rest } = props;
  const measuredHeight = useRef(0);
  const animHeight = useSharedValue(-1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => {
    if (animHeight.value === -1) {
      return { opacity: opacity.value };
    }
    return {
      opacity: opacity.value,
      height: animHeight.value,
      overflow: 'hidden',
    };
  });

  function handleLayout(e: LayoutChangeEvent) {
    if (measuredHeight.current === 0) {
      measuredHeight.current = e.nativeEvent.layout.height;
    }
  }

  function triggerDelete() {
    const h = measuredHeight.current;
    opacity.value = withTiming(0, { duration: 180 });
    if (h > 0) {
      animHeight.value = h;
      animHeight.value = withTiming(0, { duration: 220 }, (done) => {
        if (done) runOnJS(onDelete)();
      });
    } else {
      opacity.value = withTiming(0, { duration: 180 }, (done) => {
        if (done) runOnJS(onDelete)();
      });
    }
  }

  return (
    <Animated.View
      style={animStyle}
      layout={LinearTransition.duration(220)}
      onLayout={handleLayout}
    >
      <DownloadRow {...rest} onDelete={triggerDelete} />
    </Animated.View>
  );
}

// ─── MangaSectionHeader ──────────────────────────────────────────────

interface MangaSectionHeaderProps {
  mangaTitle: string;
  thumbnailUrl: string | null;
  chapterCount: number;
  isCollapsed: boolean;
  hasItems: boolean;
  onToggle: () => void;
  onDeleteAll: () => void;
  isDeleting: boolean;
}

function MangaSectionHeader({
  mangaTitle,
  thumbnailUrl,
  chapterCount,
  isCollapsed,
  hasItems,
  onToggle,
  onDeleteAll,
  isDeleting,
}: MangaSectionHeaderProps) {
  const headerStyle = !hasItems ? [styles.sectionHeader, styles.sectionHeaderRounded] : styles.sectionHeader;
  return (
    <TouchableOpacity style={headerStyle} onPress={onToggle} activeOpacity={0.7}>
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.sectionThumbnail}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.sectionThumbnail, styles.sectionThumbnailPlaceholder]}>
          <Text style={styles.sectionPlaceholderLetter}>
            {mangaTitle.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.sectionInfo}>
        <Text style={styles.sectionTitle} numberOfLines={2}>
          {mangaTitle}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {chapterCount} chapter{chapterCount !== 1 ? 's' : ''}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.sectionDeleteBtn}
        onPress={onDeleteAll}
        disabled={isDeleting}
        hitSlop={8}
        activeOpacity={0.7}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color={colors.status.error} />
        ) : (
          <Trash2 size={18} color={colors.status.error} />
        )}
      </TouchableOpacity>

      {isCollapsed ? (
        <ChevronRight size={18} color={colors.text.muted} />
      ) : (
        <ChevronDown size={18} color={colors.text.muted} />
      )}
    </TouchableOpacity>
  );
}

// ─── DownloadsScreen ─────────────────────────────────────────────────

export default function DownloadsScreen() {
  const { data: activeDownloads = [] } = useActiveDownloads();
  const { data: completedDownloads = [] } = useCompletedDownloads();
  const deleteDownload = useDeleteDownload();
  const deleteMangaDownloads = useDeleteMangaDownloads();
  const clearCompleted = useClearCompletedDownloads();
  const downloadStore = useDownloadStore();

  const [collapsedMangaIds, setCollapsedMangaIds] = useState<Set<number>>(new Set());
  const [deletingMangaId, setDeletingMangaId] = useState<number | null>(null);

  function toggleCollapse(mangaId: number) {
    setCollapsedMangaIds((prev) => {
      const next = new Set(prev);
      next.has(mangaId) ? next.delete(mangaId) : next.add(mangaId);
      return next;
    });
  }

  async function handleDeleteManga(mangaId: number, chapterIds: number[]) {
    setDeletingMangaId(mangaId);
    try {
      await deleteMangaDownloads.mutateAsync({ mangaId, chapterIds });
    } finally {
      setDeletingMangaId(null);
    }
  }

  // Group downloads by manga
  const sections = useMemo<MangaSection[]>(() => {
    const mangaMap = new Map<number, MangaSection>();

    // Add active downloads
    activeDownloads?.forEach((dl) => {
      if (!mangaMap.has(dl.mangaId)) {
        mangaMap.set(dl.mangaId, {
          mangaId: dl.mangaId,
          mangaTitle: dl.mangaTitle,
          thumbnailUrl: dl.thumbnailUrl,
          totalCount: 0,
          allChapterIds: [],
          data: [],
        });
      }
      const storeItem = downloadStore.queue.find(
        (q) => q.chapterId === dl.chapterId
      );
      const section = mangaMap.get(dl.mangaId)!;
      section.allChapterIds.push(dl.chapterId);
      section.data.push({
        type: 'active' as const,
        chapterId: dl.chapterId,
        mangaId: dl.mangaId,
        chapterName: dl.chapterName,
        progress: storeItem?.progress ?? dl.progress,
      });
    });

    // Add completed downloads
    completedDownloads?.forEach((dl) => {
      if (!mangaMap.has(dl.mangaId)) {
        mangaMap.set(dl.mangaId, {
          mangaId: dl.mangaId,
          mangaTitle: dl.mangaTitle,
          thumbnailUrl: dl.thumbnailUrl,
          totalCount: 0,
          allChapterIds: [],
          data: [],
        });
      }
      const section = mangaMap.get(dl.mangaId)!;
      section.allChapterIds.push(dl.chapterId);
      section.data.push({
        type: 'completed' as const,
        chapterId: dl.chapterId,
        mangaId: dl.mangaId,
        chapterName: dl.chapterName,
      });
    });

    // Calculate totalCount and apply collapse filter
    return Array.from(mangaMap.values()).map((section) => ({
      ...section,
      totalCount: section.data.length,
      data: collapsedMangaIds.has(section.mangaId) ? [] : section.data,
    }));
  }, [activeDownloads, completedDownloads, downloadStore.queue, collapsedMangaIds]);

  const handleDelete = useCallback(
    (chapterId: number, mangaId: number) => {
      deleteDownload.mutate({ chapterId, mangaId });
    },
    [deleteDownload]
  );

  const handleClearCompleted = useCallback(() => {
    if (!completedDownloads || completedDownloads.length === 0) return;
    clearCompleted.mutate();
  }, [completedDownloads, clearCompleted]);

  const renderItem = useCallback(
    ({ item, index, section }: { item: ChapterItem; index: number; section: MangaSection }) => {
      const isLastItem = index === section.data.length - 1;
      return (
        <AnimatedDownloadRow
          chapterId={item.chapterId}
          mangaId={item.mangaId}
          chapterName={item.chapterName}
          progress={item.progress}
          isActive={item.type === 'active'}
          onDelete={() => handleDelete(item.chapterId, item.mangaId)}
          isLastItem={isLastItem}
        />
      );
    },
    [handleDelete]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: MangaSection }) => (
      <Animated.View layout={LinearTransition.duration(220)}>
        <MangaSectionHeader
          mangaTitle={section.mangaTitle}
          thumbnailUrl={section.thumbnailUrl}
          chapterCount={section.totalCount}
          isCollapsed={collapsedMangaIds.has(section.mangaId)}
          hasItems={section.data.length > 0}
          onToggle={() => toggleCollapse(section.mangaId)}
          onDeleteAll={() => handleDeleteManga(section.mangaId, section.allChapterIds)}
          isDeleting={deletingMangaId === section.mangaId}
        />
      </Animated.View>
    ),
    [collapsedMangaIds, deletingMangaId, toggleCollapse, handleDeleteManga]
  );

  const hasDownloads = sections.length > 0;
  const hasCompleted = completedDownloads && completedDownloads.length > 0;

  // Clear button header right
  const clearButtonElement = (
    <TouchableOpacity
      onPress={handleClearCompleted}
      disabled={!hasCompleted || clearCompleted.isPending}
      hitSlop={12}
    >
      <Trash2
        size={20}
        color={
          hasCompleted && !clearCompleted.isPending
            ? colors.status.error
            : colors.text.muted
        }
      />
    </TouchableOpacity>
  );

  if (clearCompleted.isPending) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Downloads',
            headerRight: () => clearButtonElement,
          }}
        />
        <View style={styles.container}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Downloads',
          headerRight: () => clearButtonElement,
        }}
      />
      <View style={styles.container}>
        {hasDownloads ? (
          <SectionList
            sections={sections}
            keyExtractor={(item) => String(item.chapterId)}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
          />
        ) : (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No downloads</Text>
          </View>
        )}
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  listContent: {
    paddingBottom: spacing[8],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.muted,
  },

  // Section header (manga group)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    overflow: 'hidden',
  },
  sectionHeaderRounded: {
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    marginBottom: spacing[3],
  },
  sectionDeleteBtn: {
    marginRight: spacing[2],
  },
  sectionThumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE * 1.45,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.DEFAULT,
  },
  sectionThumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.elevated,
  },
  sectionPlaceholderLetter: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.accent.DEFAULT,
  },
  sectionInfo: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    flexShrink: 1,
    lineHeight: typography.lineHeights.snug,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.snug,
  },

  // Download row
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    backgroundColor: colors.background.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderBottomWidth: 1,
    marginHorizontal: spacing[4],
    overflow: 'hidden',
  },
  downloadRowLast: {
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  chapterLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
  compressionLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginTop: spacing[1],
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingTop: spacing[1],
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border.subtle,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.DEFAULT,
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.sizes.xs,
    color: colors.accent.DEFAULT,
    fontWeight: typography.weights.medium,
    minWidth: 35,
    textAlign: 'right',
  },
  deleteBtn: {
    padding: spacing[2],
  },
});
