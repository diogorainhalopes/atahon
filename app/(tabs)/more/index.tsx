import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  SectionList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { X, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '@components/Screen';
import { Puzzle, Download, Settings, ChevronRight, Info } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import {
  useActiveDownloads,
  useCompletedDownloads,
  useDeleteDownload,
  useClearCompletedDownloads,
} from '@queries/downloads';
import { useDownloadStore } from '@stores/downloadStore';

const THUMB_SIZE = 40;

// ─── DownloadRow ─────────────────────────────────────────────────────────

interface DownloadRowProps {
  chapterId: number;
  mangaId: number;
  mangaTitle: string;
  chapterName: string;
  thumbnailUrl: string | null;
  progress?: number;
  isActive?: boolean;
  onDelete: () => void;
}

function DownloadRow({
  chapterId,
  mangaTitle,
  chapterName,
  thumbnailUrl,
  progress = 0,
  isActive = false,
  onDelete,
}: DownloadRowProps) {
  return (
    <View style={styles.downloadRow}>
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.thumbnail}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Text style={styles.placeholderLetter}>
            {mangaTitle.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.rowInfo}>
        <Text style={styles.mangaTitle} numberOfLines={1}>
          {mangaTitle}
        </Text>
        <Text style={styles.chapterLabel} numberOfLines={1}>
          {chapterName}
        </Text>

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

// ─── DownloadsModal ──────────────────────────────────────────────────────

type Section = {
  title: string;
  data: Array<{
    type: 'active' | 'completed';
    chapterId: number;
    mangaId: number;
    mangaTitle: string;
    chapterName: string;
    thumbnailUrl: string | null;
    progress?: number;
  }>;
};

interface DownloadsModalProps {
  visible: boolean;
  onClose: () => void;
}

function DownloadsModal({ visible, onClose }: DownloadsModalProps) {
  const insets = useSafeAreaInsets();
  const { data: activeDownloads = [] } = useActiveDownloads();
  const { data: completedDownloads = [] } = useCompletedDownloads();
  const deleteDownload = useDeleteDownload();
  const clearCompleted = useClearCompletedDownloads();
  const downloadStore = useDownloadStore();

  const sections = useMemo<Section[]>(() => {
    const secs: Section[] = [];

    if (activeDownloads && activeDownloads.length > 0) {
      secs.push({
        title: 'Downloading',
        data: activeDownloads.map((dl) => {
          const storeItem = downloadStore.queue.find((q) => q.chapterId === dl.chapterId);
          return {
            type: 'active' as const,
            chapterId: dl.chapterId,
            mangaId: dl.mangaId,
            mangaTitle: dl.mangaTitle,
            chapterName: dl.chapterName,
            thumbnailUrl: dl.thumbnailUrl,
            progress: storeItem?.progress ?? dl.progress,
          };
        }),
      });
    }

    if (completedDownloads && completedDownloads.length > 0) {
      secs.push({
        title: 'Downloaded',
        data: completedDownloads.map((dl) => ({
          type: 'completed' as const,
          chapterId: dl.chapterId,
          mangaId: dl.mangaId,
          mangaTitle: dl.mangaTitle,
          chapterName: dl.chapterName,
          thumbnailUrl: dl.thumbnailUrl,
        })),
      });
    }

    return secs;
  }, [activeDownloads, completedDownloads, downloadStore.queue]);

  const handleDelete = useCallback(
    (chapterId: number, mangaId: number) => {
      deleteDownload.mutate({ chapterId, mangaId });
    },
    [deleteDownload],
  );

  const handleClearCompleted = useCallback(() => {
    if (!completedDownloads || completedDownloads.length === 0) return;

    Alert.alert(
      'Clear Downloaded',
      `Remove ${completedDownloads.length} downloaded chapter${completedDownloads.length !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearCompleted.mutate(),
        },
      ],
    );
  }, [completedDownloads, clearCompleted]);

  const renderItem = useCallback(
    ({ item }: { item: Section['data'][0] }) => (
      <DownloadRow
        chapterId={item.chapterId}
        mangaId={item.mangaId}
        mangaTitle={item.mangaTitle}
        chapterName={item.chapterName}
        thumbnailUrl={item.thumbnailUrl}
        progress={item.progress}
        isActive={item.type === 'active'}
        onDelete={() => handleDelete(item.chapterId, item.mangaId)}
      />
    ),
    [handleDelete],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <View style={styles.modalSectionHeader}>
        <Text style={styles.modalSectionTitle}>{section.title}</Text>
      </View>
    ),
    [],
  );

  const hasDownloads = sections.length > 0;
  const hasCompleted = completedDownloads && completedDownloads.length > 0;

  if (clearCompleted.isPending) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Downloads</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Downloads</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {hasDownloads ? (
          <>
            {hasCompleted && (
              <TouchableOpacity
                onPress={handleClearCompleted}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color={colors.status.error} />
                <Text style={styles.clearButtonText}>Clear Downloaded</Text>
              </TouchableOpacity>
            )}
            <SectionList
              sections={sections}
              keyExtractor={(item) => String(item.chapterId)}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              contentContainerStyle={{ paddingBottom: insets.bottom + 64 }}
              stickySectionHeadersEnabled={false}
            />
          </>
        ) : (
          <View style={styles.empty}>
            <Download size={64} color={colors.text.muted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No downloads</Text>
            <Text style={styles.emptySubtitle}>
              Downloaded chapters will appear here
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── MenuItem ────────────────────────────────────────────────────────────

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  onPress?: () => void;
}

function MenuItem({ icon: Icon, label, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconWrapper}>
          <Icon size={20} color={colors.accent.DEFAULT} strokeWidth={2} />
        </View>
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      <ChevronRight size={18} color={colors.text.muted} />
    </TouchableOpacity>
  );
}

// ─── MoreScreen ──────────────────────────────────────────────────────────

export default function MoreScreen() {
  const router = useRouter();
  const [showDownloads, setShowDownloads] = useState(false);

  return (
    <>
      <Screen>
        <View style={styles.header}>
          <Text style={styles.title}>More</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content</Text>
            <View style={styles.sectionCard}>
              <MenuItem icon={Puzzle} label="Extensions" onPress={() => router.push('/extensions')} />
              <View style={styles.divider} />
              <MenuItem
                icon={Download}
                label="Downloads"
                onPress={() => setShowDownloads(true)}
              />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App</Text>
            <View style={styles.sectionCard}>
              <MenuItem icon={Settings} label="Settings" />
              <View style={styles.divider} />
              <MenuItem icon={Info} label="About" />
            </View>
          </View>
        </ScrollView>
      </Screen>

      <DownloadsModal visible={showDownloads} onClose={() => setShowDownloads(false)} />
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
  },
  sectionCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: 64,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  modalTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Downloads
  downloadRow: {
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
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
  },
  rowInfo: {
    flex: 1,
    gap: spacing[1],
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

  // Section header
  modalSectionHeader: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[1.5],
    backgroundColor: colors.background.DEFAULT,
  },
  modalSectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Clear button
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginVertical: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    backgroundColor: colors.status.error + '15',
  },
  clearButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.status.error,
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
