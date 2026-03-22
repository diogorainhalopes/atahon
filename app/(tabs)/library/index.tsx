import { useCallback, useMemo } from 'react';
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
import { BookOpen } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import { useLibraryManga, useLatestReadChapters } from '@queries/manga';
import { useSettingsStore } from '@stores/settingsStore';
import type { Manga } from '@db/schema';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = spacing[2];
const CARD_PADDING = spacing[3];

// ─── MangaCard (Grid mode) ────────────────────────────────────────────────────

function MangaCard({
  manga,
  chapterLabel,
  onPress,
  width,
  height,
}: {
  manga: Manga;
  chapterLabel?: string;
  onPress: () => void;
  width: number;
  height: number;
}) {
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
        {chapterLabel && (
          <View style={styles.ribbon}>
            <Text style={styles.ribbonText}>{chapterLabel}</Text>
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
  chapterLabel,
  onPress,
}: {
  manga: Manga;
  chapterLabel?: string;
  onPress: () => void;
}) {
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
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle} numberOfLines={1}>
          {manga.title}
        </Text>
        {chapterLabel && <Text style={styles.listItemChapter} numberOfLines={1}>{chapterLabel}</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ─── LibraryScreen ───────────────────────────────────────────────────────────

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: libraryManga } = useLibraryManga();
  const mangaIds = useMemo(() => (libraryManga ?? []).map((m) => m.id), [libraryManga]);
  const { data: readChapters } = useLatestReadChapters(mangaIds);

  const gridSize = useSettingsStore((s) => s.gridSize);
  const libraryDisplayMode = useSettingsStore((s) => s.libraryDisplayMode);

  const { numColumns, cardWidth, cardHeight } = useMemo(() => {
    const numColumns = gridSize === 'small' ? 4 : gridSize === 'large' ? 2 : 3;
    const cardWidth =
      (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP * (numColumns - 1)) / numColumns;
    return { numColumns, cardWidth, cardHeight: cardWidth * 1.45 };
  }, [gridSize]);

  const renderItem = useCallback(
    ({ item }: { item: Manga }) => {
      const ch = readChapters?.[item.id];
      const chapterLabel = ch
        ? ch.chapterNumber != null
          ? `Ch. ${ch.chapterNumber % 1 === 0 ? ch.chapterNumber.toFixed(0) : ch.chapterNumber}`
          : ch.name
        : undefined;

      if (libraryDisplayMode === 'list') {
        return <ListItem manga={item} chapterLabel={chapterLabel} onPress={() => router.push({ pathname: '/manga/[mangaId]', params: { mangaId: item.id } })} />;
      }

      return (
        <MangaCard
          manga={item}
          chapterLabel={chapterLabel}
          onPress={() => router.push({ pathname: '/manga/[mangaId]', params: { mangaId: item.id } })}
          width={cardWidth}
          height={cardHeight}
        />
      );
    },
    [router, readChapters, libraryDisplayMode, cardWidth, cardHeight],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
      </View>

      <FlatList
        key={`${numColumns}-${libraryDisplayMode}`}
        data={libraryManga}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        numColumns={libraryDisplayMode === 'list' ? 1 : numColumns}
        columnWrapperStyle={libraryDisplayMode === 'list' ? undefined : styles.row}
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: insets.bottom + 128 },
          (!libraryManga || libraryManga.length === 0) && styles.emptyList,
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <BookOpen size={64} color={colors.text.muted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Your library is empty</Text>
            <Text style={styles.emptySubtitle}>
              Browse extensions to find and add manga to your library
            </Text>
          </View>
        }
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
  header: {
    paddingHorizontal: CARD_PADDING,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
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
    fontWeight: typography.weights.semibold,
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
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
  },
  listItemContent: {
    flex: 1,
    gap: spacing[1],
  },
  listItemTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  listItemChapter: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});
