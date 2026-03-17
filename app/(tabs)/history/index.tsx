import { useCallback, useMemo } from 'react';
import {
  Alert,
  Image,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import {
  useReadingHistory,
  useDeleteHistoryEntry,
  useClearAllHistory,
} from '@queries/history';
import type { HistoryEntry } from '@db/queries/reader';

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

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatChapter(entry: HistoryEntry): string {
  if (entry.chapterNumber != null) {
    const n = entry.chapterNumber % 1 === 0
      ? entry.chapterNumber.toFixed(0)
      : String(entry.chapterNumber);
    return `Ch. ${n}`;
  }
  return entry.chapterName;
}

// ─── HistoryRow ──────────────────────────────────────────────────────────────

function HistoryRow({
  entry,
  onPress,
  onDelete,
}: {
  entry: HistoryEntry;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
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
        <Text style={styles.mangaTitle} numberOfLines={1}>{entry.mangaTitle}</Text>
        <Text style={styles.chapterLabel} numberOfLines={1}>
          {formatChapter(entry)} · {formatTime(entry.readAt)}
        </Text>
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
        <Trash2 size={16} color={colors.text.muted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── HistoryScreen ───────────────────────────────────────────────────────────

type Section = { title: string; data: HistoryEntry[] };

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: historyData } = useReadingHistory();
  const deleteMutation = useDeleteHistoryEntry();
  const clearMutation = useClearAllHistory();

  const sections = useMemo<Section[]>(() => {
    if (!historyData || historyData.length === 0) return [];
    const groups: Record<number, HistoryEntry[]> = {};
    const order: number[] = [];
    for (const entry of historyData) {
      const day = startOfDay(entry.readAt);
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
  }, [historyData]);

  const handlePress = useCallback(
    (entry: HistoryEntry) => {
      router.push({
        pathname: '/manga/[mangaId]/reader/[chapterId]',
        params: { mangaId: entry.mangaId, chapterId: entry.chapterId },
      });
    },
    [router],
  );

  const handleDelete = useCallback(
    (entry: HistoryEntry) => {
      deleteMutation.mutate(entry.historyId);
    },
    [deleteMutation],
  );

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear History',
      'Remove all reading history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearMutation.mutate(),
        },
      ],
    );
  }, [clearMutation]);

  const renderItem = useCallback(
    ({ item }: { item: HistoryEntry }) => (
      <HistoryRow
        entry={item}
        onPress={() => handlePress(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [handlePress, handleDelete],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    ),
    [],
  );

  const hasHistory = sections.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        {hasHistory && (
          <TouchableOpacity onPress={handleClearAll} hitSlop={8}>
            <Trash2 size={20} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      {hasHistory ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.historyId)}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingBottom: insets.bottom + 128 }}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <View style={styles.empty}>
          <Clock size={64} color={colors.text.muted} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No reading history</Text>
          <Text style={styles.emptySubtitle}>
            Chapters you've read will appear here
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
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
    fontWeight: typography.weights.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    gap: spacing[3],
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
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  mangaTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  chapterLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  deleteBtn: {
    padding: spacing[2],
  },

  // Empty
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
