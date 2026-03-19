import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import {
  ArrowLeft,
  ArrowDownUp,
  BookmarkPlus,
  BookmarkCheck,
  RefreshCw,
  Download,
  Clock,
  Loader,
  CheckCircle,
  AlertCircle,
  HardDrive,
} from 'lucide-react-native';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import type { Chapter } from '@db/schema';
import {
  useMangaDetail,
  useMangaChapters,
  useFetchMangaDetails,
  useFetchChapterList,
  useToggleLibrary,
} from '@queries/manga';
import { useEnqueueDownload, useBulkEnqueueDownload } from '@queries/downloads';
import { useDownloadStore } from '@stores/downloadStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 280;
const COVER_WIDTH = 120;
const COVER_ASPECT = 1.42;

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: 'Unknown', color: colors.text.muted },
  1: { label: 'Ongoing', color: colors.status.info },
  2: { label: 'Completed', color: colors.status.success },
  3: { label: 'Licensed', color: colors.status.warning },
  4: { label: 'Pub. Finished', color: colors.status.success },
  5: { label: 'Cancelled', color: colors.status.error },
  6: { label: 'On Hiatus', color: colors.status.warning },
};

function formatDate(timestamp: number | null): string {
  if (!timestamp || timestamp <= 0) return '';
  // DB stores seconds, convert to ms
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── ChapterRow ────────────────────────────────────────────────────────────────

interface ChapterRowProps {
  chapter: Chapter;
  mangaId: string;
  mangaTitle: string;
  sourceId: string;
  onPress: () => void;
  onDownload: () => void;
}

function ChapterRow({ chapter, onPress, onDownload, mangaTitle, sourceId }: ChapterRowProps) {
  const chapterLabel =
    chapter.chapterNumber != null && chapter.chapterNumber > 0
      ? `Chapter ${chapter.chapterNumber}`
      : null;
  const displayName = chapterLabel
    ? chapterLabel !== chapter.name
      ? `${chapterLabel} — ${chapter.name}`
      : chapterLabel
    : chapter.name;

  // Get live download progress from store
  const downloadItem = useDownloadStore((s) =>
    s.queue.find((item) => item.chapterId === chapter.id),
  );

  const getDownloadIcon = () => {
    const status = chapter.downloadStatus;
    const progress = downloadItem?.progress ?? 0;

    if (status === 3) {
      // Done
      return <HardDrive size={18} color={colors.status.success} />;
    } else if (status === 4) {
      // Error
      return <AlertCircle size={18} color={colors.status.error} />;
    } else if (status === 2 || downloadItem?.status === 'downloading') {
      // Downloading - show progress
      return (
        <View style={styles.downloadProgressContainer}>
          <Loader size={16} color={colors.accent.DEFAULT} />
          <Text style={styles.downloadProgress}>{Math.round(progress * 100)}%</Text>
        </View>
      );
    } else if (status === 1 || downloadItem?.status === 'queued') {
      // Queued
      return <Clock size={18} color={colors.text.muted} />;
    }
    // None (0)
    return <Download size={18} color={colors.text.muted} />;
  };

  return (
    <TouchableOpacity style={styles.chapterRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.chapterInfo}>
        <Text
          style={[styles.chapterName, chapter.read && styles.chapterRead]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <View style={styles.chapterMeta}>
          {chapter.uploadDate ? (
            <Text style={styles.chapterDate}>{formatDate(chapter.uploadDate)}</Text>
          ) : null}
          {chapter.scanlator ? (
            <Text style={styles.chapterScanlator} numberOfLines={1}>
              {chapter.uploadDate ? ' • ' : ''}
              {chapter.scanlator}
            </Text>
          ) : null}
        </View>
      </View>
      {chapter.bookmark && <View style={styles.bookmarkDot} />}
      <TouchableOpacity
        onPress={onDownload}
        hitSlop={8}
        activeOpacity={0.7}
        style={styles.downloadButton}
      >
        {getDownloadIcon()}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── MangaDetailScreen ─────────────────────────────────────────────────────────

export default function MangaDetailScreen() {
  const { mangaId } = useLocalSearchParams<{ mangaId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const numericId = parseInt(mangaId, 10);

  // Data
  const { data: manga, isLoading: mangaLoading } = useMangaDetail(numericId);
  const { data: chapters } = useMangaChapters(numericId);

  // Mutations
  const fetchDetails = useFetchMangaDetails();
  const fetchChapters = useFetchChapterList();
  const toggleLibrary = useToggleLibrary();
  const enqueueDownload = useEnqueueDownload();
  const bulkEnqueueDownload = useBulkEnqueueDownload();

  // UI state
  const [sortAsc, setSortAsc] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const hasTriggeredFetch = useRef(false);

  // Fetch from source on first visit
  useEffect(() => {
    if (!manga || manga.initialized || hasTriggeredFetch.current) return;
    hasTriggeredFetch.current = true;

    const params = {
      mangaId: manga.id,
      sourceId: manga.sourceId,
      mangaUrl: manga.sourceUrl,
    };
    fetchDetails.mutate(params);
    fetchChapters.mutate(params);
  }, [manga?.id, manga?.initialized]);

  // Sorted chapters
  const sortedChapters = useMemo(() => {
    if (!chapters) return [];
    return sortAsc ? [...chapters].reverse() : chapters;
  }, [chapters, sortAsc]);

  // Refresh handler
  const isRefreshing = fetchDetails.isPending || fetchChapters.isPending;

  const handleRefresh = useCallback(() => {
    if (!manga || isRefreshing) return;
    const params = {
      mangaId: manga.id,
      sourceId: manga.sourceId,
      mangaUrl: manga.sourceUrl,
    };
    fetchDetails.mutate(params);
    fetchChapters.mutate(params);
  }, [manga, isRefreshing]);

  // Download handlers
  const handleDownloadChapter = useCallback(
    (chapter: Chapter) => {
      if (!manga) return;
      enqueueDownload.mutate({
        chapterId: chapter.id,
        mangaId: manga.id,
        mangaTitle: manga.title,
        chapterName: chapter.name,
        sourceId: manga.sourceId,
        chapterUrl: chapter.sourceUrl,
      });
    },
    [manga, enqueueDownload],
  );

  const handleDownloadAll = useCallback(() => {
    if (!manga || !chapters) return;
    const toDownload = chapters
      .filter((ch) => ch.downloadStatus === 0) // Not yet queued/downloaded
      .map((ch) => ({
        chapterId: ch.id,
        mangaId: manga.id,
        mangaTitle: manga.title,
        chapterName: ch.name,
        sourceId: manga.sourceId,
        chapterUrl: ch.sourceUrl,
      }));
    if (toDownload.length > 0) {
      bulkEnqueueDownload.mutate(toDownload);
    }
  }, [manga, chapters, bulkEnqueueDownload]);

  const handleDownloadNew = useCallback(() => {
    if (!manga || !chapters) return;
    const toDownload = chapters
      .filter((ch) => ch.downloadStatus === 0)
      .map((ch) => ({
        chapterId: ch.id,
        mangaId: manga.id,
        mangaTitle: manga.title,
        chapterName: ch.name,
        sourceId: manga.sourceId,
        chapterUrl: ch.sourceUrl,
      }));
    if (toDownload.length > 0) {
      bulkEnqueueDownload.mutate(toDownload);
    }
  }, [manga, chapters, bulkEnqueueDownload]);

  // Parse genres
  const genres = useMemo(() => {
    if (!manga?.genre) return [];
    try {
      return JSON.parse(manga.genre) as string[];
    } catch {
      return [];
    }
  }, [manga?.genre]);

  const status = STATUS_MAP[manga?.status ?? 0] ?? STATUS_MAP[0];

  // ─── Header component ──────────────────────────────────────────────

  const renderHeader = useCallback(() => {
    if (!manga) return null;

    return (
      <View>
        {/* Cover area */}
        <View style={styles.coverArea}>
          {/* Blurred background */}
          {manga.thumbnailUrl && (
            <Image
              source={{ uri: manga.thumbnailUrl }}
              style={StyleSheet.absoluteFill}
              blurRadius={20}
              contentFit="cover"
            />
          )}
          <LinearGradient
            colors={['transparent', colors.background.DEFAULT] as const}
            locations={[0.3, 1] as const}
            style={StyleSheet.absoluteFill}
          />

          {/* Foreground cover */}
          <View style={styles.coverForeground}>
            {manga.thumbnailUrl ? (
              <Image
                source={{ uri: manga.thumbnailUrl }}
                style={styles.coverImage}
                contentFit="cover"
                transition={{ duration: 200 }}
              />
            ) : (
              <View style={[styles.coverImage, styles.coverPlaceholder]}>
                <Text style={styles.coverPlaceholderText}>
                  {manga.title.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Info section */}
        <View style={styles.infoSection}>
          <Text style={styles.title} selectable>
            {manga.title}
          </Text>

          {/* Author / Artist */}
          {(manga.author || manga.artist) && (
            <Text style={styles.authorArtist} numberOfLines={1}>
              {manga.author}
              {manga.author && manga.artist && manga.author !== manga.artist
                ? ` • ${manga.artist}`
                : !manga.author && manga.artist
                  ? manga.artist
                  : ''}
            </Text>
          )}

          {/* Status badge */}
          {manga.status > 0 && (
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          )}

          {/* Description */}
          {manga.description ? (
            <Pressable onPress={() => setDescExpanded((v) => !v)}>
              <Text
                style={styles.description}
                numberOfLines={descExpanded ? undefined : 3}
              >
                {manga.description}
              </Text>
              {!descExpanded && (
                <Text style={styles.expandHint}>...more</Text>
              )}
            </Pressable>
          ) : null}

          {/* Genres */}
          {genres.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.genreRow}
            >
              {genres.map((g) => (
                <View key={g} style={styles.genreChip}>
                  <Text style={styles.genreText}>{g}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Action row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.libraryBtn,
                manga.inLibrary && styles.libraryBtnActive,
              ]}
              onPress={() =>
                toggleLibrary.mutate({
                  mangaId: manga.id,
                  inLibrary: !manga.inLibrary,
                })
              }
              activeOpacity={0.7}
            >
              {manga.inLibrary ? (
                <BookmarkCheck size={18} color={colors.accent.DEFAULT} />
              ) : (
                <BookmarkPlus size={18} color={colors.text.secondary} />
              )}
              <Text
                style={[
                  styles.libraryBtnText,
                  manga.inLibrary && styles.libraryBtnTextActive,
                ]}
              >
                {manga.inLibrary ? 'In Library' : 'Add to Library'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chapter list header */}
        <View style={styles.chapterHeader}>
          <Text style={styles.chapterCount}>
            {chapters?.length ?? 0} Chapters
          </Text>
          <View style={styles.chapterActions}>
            {chapters && chapters.length > 0 && chapters.some((ch) => ch.downloadStatus === 0) && (
              <>
                <TouchableOpacity
                  onPress={handleDownloadAll}
                  activeOpacity={0.7}
                  hitSlop={8}
                  disabled={bulkEnqueueDownload.isPending}
                >
                  <Download
                    size={18}
                    color={bulkEnqueueDownload.isPending ? colors.text.muted : colors.text.secondary}
                  />
                </TouchableOpacity>
              </>
            )}
            {manga.initialized && (
              <TouchableOpacity
                onPress={handleRefresh}
                disabled={isRefreshing}
                activeOpacity={0.7}
                hitSlop={8}
              >
                <RefreshCw
                  size={isRefreshing ? 18 : 18}
                  color={isRefreshing ? colors.text.muted : colors.text.secondary}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setSortAsc((v) => !v)}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <ArrowDownUp size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading indicator for chapter fetch */}
        {fetchChapters.isPending && (!chapters || chapters.length === 0) && (
          <View style={styles.chapterLoading}>
            <ActivityIndicator size="small" color={colors.accent.DEFAULT} />
            <Text style={styles.chapterLoadingText}>Loading chapters...</Text>
          </View>
        )}
      </View>
    );
  }, [
    manga,
    chapters?.length,
    chapters,
    descExpanded,
    genres,
    sortAsc,
    status,
    isRefreshing,
    handleRefresh,
    handleDownloadAll,
    handleDownloadNew,
    fetchChapters.isPending,
    bulkEnqueueDownload.isPending,
  ]);

  // ─── Render ─────────────────────────────────────────────────────────

  const renderChapter = useCallback(
    ({ item }: { item: Chapter }) => (
      <ChapterRow
        chapter={item}
        mangaId={mangaId}
        mangaTitle={manga?.title ?? ''}
        sourceId={manga?.sourceId ?? ''}
        onPress={() =>
          router.push({
            pathname: '/manga/[mangaId]/reader/[chapterId]',
            params: { mangaId, chapterId: item.id },
          })
        }
        onDownload={() => handleDownloadChapter(item)}
      />
    ),
    [mangaId, manga?.title, manga?.sourceId, router, handleDownloadChapter],
  );

  // Loading state
  if (mangaLoading || !manga) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <FlashList
          data={sortedChapters}
          renderItem={renderChapter}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={renderHeader}
          getItemType={() => 'chapter'}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing[4] }}
          showsVerticalScrollIndicator={false}
        />

        {/* Back button (absolute, above everything) */}
        <Pressable
          style={[styles.backBtn, { top: insets.top + spacing[2] }]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <View style={styles.backBtnBg}>
            <ArrowLeft size={20} color={colors.text.primary} />
          </View>
        </Pressable>
      </View>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.DEFAULT,
  },

  // Back button
  backBtn: {
    position: 'absolute',
    left: spacing[4],
    zIndex: 10,
  },
  backBtnBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cover area
  coverArea: {
    height: COVER_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  coverForeground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing[4],
  },
  coverImage: {
    width: COVER_WIDTH,
    height: COVER_WIDTH * COVER_ASPECT,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  coverPlaceholder: {
    backgroundColor: colors.surface.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
  },

  // Info section
  infoSection: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    paddingBottom: spacing[4],
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.lineHeights.snug,
  },
  authorArtist: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.relaxed,
  },
  expandHint: {
    fontSize: typography.sizes.sm,
    color: colors.accent.DEFAULT,
    fontWeight: typography.weights.medium,
    marginTop: 2,
  },

  // Genres
  genreRow: {
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  genreChip: {
    backgroundColor: colors.accent.muted,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  genreText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.accent.DEFAULT,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingTop: spacing[2],
  },
  libraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  libraryBtnActive: {
    borderColor: colors.accent.DEFAULT,
    backgroundColor: colors.accent.muted,
  },
  libraryBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  libraryBtnTextActive: {
    color: colors.accent.DEFAULT,
  },

  // Chapter header
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  chapterCount: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  chapterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },

  // Chapter loading
  chapterLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
  },
  chapterLoadingText: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },

  // Chapter row
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: spacing[3],
  },
  chapterInfo: {
    flex: 1,
    gap: 2,
  },
  chapterName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  chapterRead: {
    color: colors.text.muted,
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterDate: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  chapterScanlator: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    flexShrink: 1,
  },
  bookmarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.DEFAULT,
  },
  downloadButton: {
    padding: spacing[1],
  },
  downloadProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[0.5],
  },
  downloadProgress: {
    fontSize: typography.sizes.xs,
    color: colors.accent.DEFAULT,
    fontWeight: typography.weights.medium,
  },
});
