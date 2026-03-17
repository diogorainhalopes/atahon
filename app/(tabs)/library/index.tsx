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
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import { useLibraryManga, useLatestReadChapters } from '@queries/manga';
import type { Manga } from '@db/schema';

const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = spacing[2];
const CARD_PADDING = spacing[3];
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

// ─── MangaCard ───────────────────────────────────────────────────────────────

function MangaCard({ manga, chapterLabel, onPress }: { manga: Manga; chapterLabel?: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardImageBox}>
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
      <Text style={styles.cardTitle} numberOfLines={2}>{manga.title}</Text>
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

  const renderItem = useCallback(
    ({ item }: { item: Manga }) => {
      const ch = readChapters?.[item.id];
      const chapterLabel = ch
        ? ch.chapterNumber != null
          ? `Ch. ${ch.chapterNumber % 1 === 0 ? ch.chapterNumber.toFixed(0) : ch.chapterNumber}`
          : ch.name
        : undefined;
      return (
        <MangaCard
          manga={item}
          chapterLabel={chapterLabel}
          onPress={() => router.push({ pathname: '/manga/[mangaId]', params: { mangaId: item.id } })}
        />
      );
    },
    [router, readChapters],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
      </View>

      <FlatList
        data={libraryManga}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
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
});
