import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Pressable,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Layers, X } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import {
  useCategories,
  useCategoryMangaCounts,
  useBucketPreviews,
  useMangaInCategory,
  useCreateCategory,
  useDeleteCategory,
} from '@queries/categories';
import type { Manga, Category } from '@db/schema';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = spacing[2];
const CARD_PADDING = spacing[3];
const BUCKET_COLS = 3;
const BUCKET_CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP * (BUCKET_COLS - 1)) / BUCKET_COLS;
const BUCKET_CARD_HEIGHT = BUCKET_CARD_WIDTH * 0.9;

const GRID_COLS = 4;

// ─── BucketCard ──────────────────────────────────────────────────────────────

function BucketCard({
  bucket,
  count,
  thumbnails,
  onPress,
  onLongPress,
}: {
  bucket: Category;
  count: number;
  thumbnails: string[];
  onPress: () => void;
  onLongPress: () => void;
}) {
  const thumbW = BUCKET_CARD_WIDTH / 2;
  const thumbH = (BUCKET_CARD_HEIGHT - 40) / 2; // leave room for name+count area

  return (
    <TouchableOpacity
      style={styles.bucketCard}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.bucketCardThumbnail}>
        {thumbnails.length > 0 ? (
          <>
            <View style={styles.thumbnailGrid}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ width: thumbW, height: thumbH }}>
                  {thumbnails[i] ? (
                    <Image
                      source={{ uri: thumbnails[i] }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.thumbnailEmpty} />
                  )}
                </View>
              ))}
            </View>
            <View style={styles.thumbnailOverlay} />
          </>
        ) : (
          <View style={styles.thumbnailFallback}>
            <Layers size={28} color={colors.text.muted} strokeWidth={1.5} />
          </View>
        )}
      </View>
      <View style={styles.bucketCardInfo}>
        <Text style={styles.bucketCardName} numberOfLines={1}>
          {bucket.name}
        </Text>
        <Text style={styles.bucketCardCount}>
          {count} manga
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── BucketMangaCard ─────────────────────────────────────────────────────────

function BucketMangaCard({
  manga,
  onPress,
  width,
  height,
}: {
  manga: Manga;
  onPress: () => void;
  width: number;
  height: number;
}) {
  return (
    <TouchableOpacity style={[styles.mangaCard, { width }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.mangaCardImageBox, { width, height }]}>
        {manga.thumbnailUrl ? (
          <Image source={{ uri: manga.thumbnailUrl }} style={styles.mangaCardImage} resizeMode="cover" />
        ) : (
          <View style={styles.mangaCardPlaceholder}>
            <Text style={styles.mangaCardPlaceholderLetter}>
              {manga.title.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.mangaCardTitle} numberOfLines={2}>
        {manga.title}
      </Text>
    </TouchableOpacity>
  );
}

// ─── BucketsScreen ───────────────────────────────────────────────────────────

export default function BucketsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State
  const [expandedBucketId, setExpandedBucketId] = useState<number | null>(null);
  const [expandedBucketName, setExpandedBucketName] = useState<string>('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // Queries & Mutations
  const { data: categories = [] } = useCategories();
  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories]);
  const { data: counts = {} } = useCategoryMangaCounts(categoryIds);
  const { data: previews = {} } = useBucketPreviews(categoryIds);
  const { data: expandedManga = [] } = useMangaInCategory(expandedBucketId ?? 0, expandedBucketId !== null);

  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();

  // Grid dimensions for expanded modal
  const { cardWidth, cardHeight } = useMemo(() => {
    const w = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP * (GRID_COLS - 1)) / GRID_COLS;
    return { cardWidth: w, cardHeight: w * 1.45 };
  }, []);

  // Handle create bucket
  const handleCreateBucket = useCallback(async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty');
      return;
    }

    try {
      await createMutation.mutateAsync({ name: trimmed });
      setNameInput('');
      setNameError(null);
      setCreateModalVisible(false);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('UNIQUE constraint failed')) {
        setNameError('A bucket with that name already exists');
      } else {
        setNameError('Failed to create bucket');
      }
    }
  }, [nameInput, createMutation]);

  // Handle delete bucket
  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate({ id: deleteTarget.id });
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  const closeBucketModal = useCallback(() => {
    setExpandedBucketId(null);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Buckets',
          headerRight: () => (
            <TouchableOpacity onPress={() => setCreateModalVisible(true)} hitSlop={12}>
              <Plus size={22} color={colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
      />
    <View style={styles.container}>
      {/* Bucket List */}
      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <BucketCard
            bucket={item}
            count={counts[item.id] ?? 0}
            thumbnails={previews[item.id] ?? []}
            onPress={() => {
              setExpandedBucketId(item.id);
              setExpandedBucketName(item.name);
            }}
            onLongPress={() => setDeleteTarget(item)}
          />
        )}
        numColumns={BUCKET_COLS}
        columnWrapperStyle={styles.bucketRow}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing[4] },
          categories.length === 0 && styles.emptyGrid,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Layers size={64} color={colors.text.muted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No buckets yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to create your first bucket</Text>
          </View>
        }
      />

      {/* Bucket Manga Modal (floating dialog) */}
      {expandedBucketId !== null && (
        <Pressable style={styles.backdropFixed} onPress={closeBucketModal} />
      )}
      <Modal
        visible={expandedBucketId !== null}
        animationType="fade"
        transparent
        onRequestClose={closeBucketModal}
      >
        <Pressable style={styles.backdropCentering} onPress={closeBucketModal}>
          <Pressable style={styles.bucketModal} onPress={() => {}}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>{expandedBucketName}</Text>
              <TouchableOpacity onPress={closeBucketModal} hitSlop={8}>
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={expandedManga}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <BucketMangaCard
                  manga={item}
                  width={cardWidth}
                  height={cardHeight}
                  onPress={() => {
                    closeBucketModal();
                    router.push({
                      pathname: '/manga/[mangaId]',
                      params: { mangaId: item.id },
                    });
                  }}
                />
              )}
              numColumns={GRID_COLS}
              columnWrapperStyle={styles.mangaRow}
              contentContainerStyle={[
                styles.mangaGrid,
                expandedManga.length === 0 && styles.emptyGrid,
              ]}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Layers size={48} color={colors.text.muted} strokeWidth={1.5} />
                  <Text style={styles.emptyTitle}>No manga in this bucket</Text>
                  <Text style={styles.emptySubtitle}>Add manga from their detail page</Text>
                </View>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Pressable style={styles.backdropFixed} onPress={() => setDeleteTarget(null)} />
      )}
      <Modal
        visible={deleteTarget !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setDeleteTarget(null)}
      >
        <Pressable style={styles.backdropCentering} onPress={() => setDeleteTarget(null)}>
          <Pressable style={styles.deleteModal} onPress={() => {}}>
            <Text style={styles.deleteModalTitle}>Delete Bucket</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{deleteTarget?.name}"? This will remove the bucket but not the manga in it.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalBtn, styles.deleteModalCancelBtn]}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalBtn, styles.deleteModalConfirmBtn]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.deleteModalConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create Bucket Modal */}
      {createModalVisible && (
        <Pressable
          style={styles.backdropFixed}
          onPress={() => {
            setCreateModalVisible(false);
            setNameInput('');
            setNameError(null);
          }}
        />
      )}
      <Modal
        visible={createModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setCreateModalVisible(false);
          setNameInput('');
          setNameError(null);
        }}
      >
        <Pressable
          style={styles.backdropCentering}
          onPress={() => {
            setCreateModalVisible(false);
            setNameInput('');
            setNameError(null);
          }}
        >
          <Pressable style={styles.createModal} onPress={() => {}}>
            <Text style={styles.createModalTitle}>Create Bucket</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Bucket name"
              placeholderTextColor={colors.text.muted}
              value={nameInput}
              onChangeText={(text) => {
                setNameInput(text);
                if (nameError) setNameError(null);
              }}
              autoFocus
            />
            {nameError && <Text style={styles.errorText}>{nameError}</Text>}
            <View style={styles.createModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalBtn, styles.deleteModalCancelBtn]}
                onPress={() => {
                  setCreateModalVisible(false);
                  setNameInput('');
                  setNameError(null);
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalBtn, styles.createConfirmBtn]}
                onPress={handleCreateBucket}
              >
                <Text style={styles.deleteModalConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },

  // Bucket List
  listContent: {
    padding: CARD_PADDING,
  },
  bucketRow: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  bucketCard: {
    width: BUCKET_CARD_WIDTH,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface.DEFAULT,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  bucketCardThumbnail: {
    height: BUCKET_CARD_HEIGHT - 40,
    overflow: 'hidden',
  },
  thumbnailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailEmpty: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.elevated,
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  thumbnailFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
  },
  bucketCardInfo: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1.5],
  },
  bucketCardName: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.semibold,
    color: colors.text.primary,
  },
  bucketCardCount: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 1,
  },

  // Manga Grid (inside modal)
  mangaGrid: {
    padding: CARD_PADDING,
  },
  mangaRow: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  mangaCard: {},
  mangaCardImageBox: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface.DEFAULT,
  },
  mangaCardImage: {
    width: '100%',
    height: '100%',
  },
  mangaCardPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.elevated,
  },
  mangaCardPlaceholderLetter: {
    fontSize: typography.sizes['3xl'],
    fontFamily: fontFamily.bold,
    color: colors.text.muted,
  },
  mangaCardTitle: {
    marginTop: spacing[1],
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: typography.sizes.xs * 1.4,
  },

  // Empty State
  emptyGrid: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.semibold,
    color: colors.text.secondary,
    marginTop: spacing[2],
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },

  // Shared modal backdrop styles
  backdropFixed: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 999,
  },
  backdropCentering: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  },

  // Shared dialog header
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  dialogTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
  },

  // Bucket Manga Modal
  bucketModal: {
    backgroundColor: colors.background.card,
    borderRadius: radius['2xl'],
    maxHeight: '85%',
    width: '100%',
    overflow: 'hidden',
  },

  // Delete Confirmation Modal
  deleteModal: {
    backgroundColor: colors.background.card,
    borderRadius: radius['2xl'],
    padding: spacing[5],
    width: '100%',
    maxWidth: 320,
  },
  deleteModalTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.semibold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  deleteModalText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.sizes.sm * 1.5,
    marginBottom: spacing[5],
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  deleteModalBtn: {
    flex: 1,
    paddingVertical: spacing[2.5],
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  deleteModalCancelBtn: {
    backgroundColor: colors.surface.DEFAULT,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  deleteModalCancelText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: colors.text.primary,
  },
  deleteModalConfirmBtn: {
    backgroundColor: colors.status.error,
  },
  deleteModalConfirmText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: '#ffffff',
  },

  // Create Bucket Modal
  createModal: {
    backgroundColor: colors.background.card,
    borderRadius: radius['2xl'],
    padding: spacing[5],
    width: '100%',
    maxWidth: 320,
  },
  createModalTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.semibold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  createModalButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  createConfirmBtn: {
    backgroundColor: colors.accent.DEFAULT,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.status.error,
    marginBottom: spacing[4],
  },
});
