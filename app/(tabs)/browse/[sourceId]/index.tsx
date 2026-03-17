import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import type { SManga } from '@/types/extensions';
import { Logger } from '@utils/logger';
import {
  usePopularManga,
  useLatestUpdates,
  useSearchManga,
  useUpsertBrowseManga,
} from '@queries/sources';
import { useLibrarySourceUrls } from '@queries/manga';

const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = spacing[2];
const CARD_PADDING = spacing[3];
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

type Tab = 'popular' | 'latest' | 'search';

// ─── MangaCard ────────────────────────────────────────────────────────────────

interface MangaCardProps {
  manga: SManga;
  inLibrary?: boolean;
  onPress: () => void;
}

function MangaCard({ manga, inLibrary, onPress }: MangaCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardImageBox}>
        {manga.thumbnail_url ? (
          <Image
            source={{ uri: manga.thumbnail_url }}
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
        {inLibrary && (
          <View style={styles.ribbon}>
            <Text style={styles.ribbonText}>IN LIBRARY</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{manga.title}</Text>
    </TouchableOpacity>
  );
}

// ─── SourceBrowseScreen ───────────────────────────────────────────────────────

export default function SourceBrowseScreen() {
  const { sourceId, name } = useLocalSearchParams<{ sourceId: string; name: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);

  const { data: libraryUrls } = useLibrarySourceUrls(sourceId);
  const upsert = useUpsertBrowseManga();
  const popularQuery = usePopularManga(sourceId);
  const latestQuery = useLatestUpdates(sourceId);
  const searchResult = useSearchManga(sourceId, searchQuery, tab === 'search');

  const activeQuery =
    tab === 'search' ? searchResult : tab === 'latest' ? latestQuery : popularQuery;

  const mangas = useMemo(
    () => activeQuery.data?.pages.flatMap((p) => p.mangas) ?? [],
    [activeQuery.data],
  );

  async function handleMangaPress(m: SManga) {
    try {
      const id = await upsert.mutateAsync({
        sourceId,
        sourceUrl: m.url,
        title: m.title,
        thumbnailUrl: m.thumbnail_url,
      });
      router.push({ pathname: '/manga/[mangaId]', params: { mangaId: id } });
    } catch (e) {
      Logger.error('Browse', 'upsert failed', e);
    }
  }

  function handleLoadMore() {
    if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
      activeQuery.fetchNextPage();
    }
  }

  function openSearch() {
    setTab('search');
    setSearchActive(true);
  }

  function closeSearch() {
    setSearchQuery('');
    setSearchActive(false);
    setTab('popular');
  }

  const renderItem = useCallback(
    ({ item }: { item: SManga }) => (
      <MangaCard
        manga={item}
        inLibrary={libraryUrls?.has(item.url)}
        onPress={() => handleMangaPress(item)}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceId, libraryUrls],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>

        {searchActive ? (
          <View style={styles.searchBar}>
            <Search size={16} color={colors.text.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search manga..."
              placeholderTextColor={colors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
        ) : (
          <Text style={styles.title} numberOfLines={1}>{name ?? 'Browse'}</Text>
        )}

        <TouchableOpacity
          onPress={searchActive ? closeSearch : openSearch}
          style={styles.searchBtn}
          activeOpacity={0.7}
        >
          {searchActive
            ? <X size={22} color={colors.text.primary} />
            : <Search size={22} color={colors.text.primary} />}
        </TouchableOpacity>
      </View>

      {/* ── Tab switcher ─────────────────────────────────────────────── */}
      {!searchActive && (
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'popular' && styles.tabActive]}
            onPress={() => setTab('popular')}
          >
            <Text style={[styles.tabText, tab === 'popular' && styles.tabTextActive]}>
              Popular
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'latest' && styles.tabActive]}
            onPress={() => setTab('latest')}
          >
            <Text style={[styles.tabText, tab === 'latest' && styles.tabTextActive]}>
              Latest
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Loading ──────────────────────────────────────────────────── */}
      {activeQuery.isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
        </View>
      )}

      {/* ── Error ────────────────────────────────────────────────────── */}
      {activeQuery.isError && !activeQuery.isLoading && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load manga</Text>
          <Text style={styles.errorDetail} numberOfLines={4}>
            {(activeQuery.error as Error)?.message}
          </Text>
          <TouchableOpacity onPress={() => activeQuery.refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Grid ─────────────────────────────────────────────────────── */}
      {!activeQuery.isLoading && !activeQuery.isError && (
        <FlatList
          data={mangas}
          keyExtractor={(item) => item.url}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: insets.bottom + 128 }, // 64 tab bar height + 8 gap
          ]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            activeQuery.isFetchingNextPage ? (
              <View style={styles.loadMoreFooter}>
                <ActivityIndicator color={colors.accent.DEFAULT} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {tab === 'search' && searchQuery ? 'No results found' : 'No manga found'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: spacing[1],
  },
  backBtn: {
    padding: spacing[2],
  },
  title: {
    flex: 1,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  searchBtn: {
    padding: spacing[2],
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent.DEFAULT,
  },
  tabText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.muted,
  },
  tabTextActive: {
    color: colors.accent.DEFAULT,
  },
  grid: {
    padding: CARD_PADDING,
  },
  row: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
  },
  cardImageBox: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
  },
  ribbon: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.accent.DEFAULT,
    borderRadius: radius.sm,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  ribbonText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },
  cardTitle: {
    marginTop: spacing[1],
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: typography.sizes.xs * 1.4,
  },
  loadMoreFooter: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[10],
    gap: spacing[3],
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.muted,
  },
  errorText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.status.error,
  },
  errorDetail: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },
  retryBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.accent.DEFAULT,
    borderRadius: radius.md,
  },
  retryText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: '#fff',
  },
});
