import { useCallback, useMemo } from 'react';
import {
  Image,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import PageHeader from '@components/PageHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import { useLibraryUpdates } from '@queries/manga';
import type { UpdateEntry } from '@db/queries/manga';

// ─── Date helpers ────────────────────────────────────────────────────────────

function startOfDay(ts: number): number {
  const d = new Date(ts * 1000);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

function formatDateLabel(dayTs: number): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
  const diff = today - dayTs;

  if (diff === 0) return 'Today';
  if (diff === 86400) return 'Yesterday';
  if (diff < 604800) {
    return new Date(dayTs * 1000).toLocaleDateString(undefined, { weekday: 'long' });
  }
  return new Date(dayTs * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: now.getFullYear() !== new Date(dayTs * 1000).getFullYear() ? 'numeric' : undefined,
  });
}

function formatChapter(entry: UpdateEntry): string {
  if (entry.chapterNumber != null) {
    const n = entry.chapterNumber % 1 === 0
      ? entry.chapterNumber.toFixed(0)
      : String(entry.chapterNumber);
    return `Ch. ${n}`;
  }
  return entry.chapterName;
}

// ─── UpdateRow ───────────────────────────────────────────────────────────────

function UpdateRow({
  entry,
  onPress,
}: {
  entry: UpdateEntry;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, entry.read && styles.rowRead]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {entry.thumbnailUrl ? (
        <Image
          source={{ uri: entry.thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Text style={styles.placeholderLetter}>
            {entry.mangaTitle.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.rowInfo}>
        <Text
          style={[styles.mangaTitle, entry.read && styles.textRead]}
          numberOfLines={1}
        >
          {entry.mangaTitle}
        </Text>
        <Text
          style={[styles.chapterLabel, entry.read && styles.textRead]}
          numberOfLines={1}
        >
          {formatChapter(entry)}
          {entry.scanlator ? ` · ${entry.scanlator}` : ''}
        </Text>
      </View>

      {!entry.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

// ─── UpdatesScreen ───────────────────────────────────────────────────────────

type Section = { title: string; data: UpdateEntry[] };

export default function UpdatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: updates } = useLibraryUpdates();

  const sections = useMemo<Section[]>(() => {
    if (!updates || updates.length === 0) return [];
    const groups: Record<number, UpdateEntry[]> = {};
    const order: number[] = [];
    for (const entry of updates) {
      // Group by uploadDate if available, otherwise createdAt
      const ts = entry.uploadDate ?? entry.createdAt;
      const day = startOfDay(ts);
      if (!groups[day]) {
        groups[day] = [];
        order.push(day);
      }
      groups[day].push(entry);
    }
    return order.map((day) => ({
      title: formatDateLabel(day),
      data: groups[day],
    }));
  }, [updates]);

  const handlePress = useCallback(
    (entry: UpdateEntry) => {
      router.push({
        pathname: '/manga/[mangaId]/reader/[chapterId]',
        params: { mangaId: entry.mangaId, chapterId: entry.chapterId },
      });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: UpdateEntry }) => (
      <UpdateRow entry={item} onPress={() => handlePress(item)} />
    ),
    [handlePress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    ),
    [],
  );

  const hasUpdates = sections.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <PageHeader title="Updates" />

      {hasUpdates ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.chapterId)}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingBottom: insets.bottom + 128 }}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <View style={styles.empty}>
          <Bell size={64} color={colors.text.muted} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No updates yet</Text>
          <Text style={styles.emptySubtitle}>
            New chapters from your library will appear here
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const THUMB_SIZE = 48;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  // Section headers
  sectionHeader: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[1.5],
    backgroundColor: colors.background.DEFAULT,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    gap: spacing[3],
  },
  rowRead: {
    opacity: 0.5,
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE * 1.45,
    borderRadius: radius.sm,
    backgroundColor: colors.surface.DEFAULT,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.elevated,
  },
  placeholderLetter: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.bold,
    color: colors.text.muted,
  },
  rowInfo: {
    flex: 1,
    gap: spacing[0.5],
  },
  mangaTitle: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.medium,
    color: colors.text.primary,
  },
  chapterLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  textRead: {
    color: colors.text.muted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.DEFAULT,
  },

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
