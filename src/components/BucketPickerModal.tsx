import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import { useCategories, useCategoryIdsForManga, useToggleMangaInCategory } from '@queries/categories';

interface BucketPickerModalProps {
  visible: boolean;
  onClose: () => void;
  mangaId: number;
}

export function BucketPickerModal({ visible, onClose, mangaId }: BucketPickerModalProps) {
  const [localSelected, setLocalSelected] = useState<Set<number>>(new Set());

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: currentIds = [], isLoading: currentIdsLoading } = useCategoryIdsForManga(mangaId);
  const toggleMutation = useToggleMangaInCategory();

  const isLoading = categoriesLoading || currentIdsLoading;

  // Re-sync when modal opens or when currentIds arrives
  useEffect(() => {
    if (visible && currentIds) {
      setLocalSelected(new Set(currentIds));
    }
  }, [visible, currentIds]);

  const handleToggle = (categoryId: number) => {
    const isSelected = localSelected.has(categoryId);
    const newSelected = new Set(localSelected);
    if (isSelected) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setLocalSelected(newSelected);

    // Fire mutation immediately (optimistic)
    toggleMutation.mutate({
      mangaId,
      categoryId,
      add: !isSelected,
    });
  };

  if (!visible) return null;

  return (
    <>
      <Pressable style={styles.backdropFixed} onPress={onClose} />
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <Pressable style={styles.backdropCentering} onPress={onClose}>
          <Pressable style={styles.modal} onPress={() => {}}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add to Bucket</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent.DEFAULT} />
              </View>
            ) : categories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No buckets created yet</Text>
                <Text style={styles.emptySubtext}>Create your first bucket from the Library</Text>
              </View>
            ) : (
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {categories.map((bucket) => {
                  const isSelected = localSelected.has(bucket.id);
                  return (
                    <TouchableOpacity
                      key={bucket.id}
                      style={[styles.bucketItem, isSelected && styles.bucketItemSelected]}
                      onPress={() => handleToggle(bucket.id)}
                      activeOpacity={0.6}
                    >
                      <View style={styles.bucketItemContent}>
                        <Text style={[styles.bucketItemName, isSelected && styles.bucketItemNameActive]}>
                          {bucket.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkmarkContainer}>
                          <Check size={20} color={colors.accent.DEFAULT} strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdropFixed: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 999,
  },
  backdropCentering: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  modal: {
    backgroundColor: colors.background.card,
    borderRadius: radius['2xl'],
    maxHeight: '80%',
    minHeight: 300,
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.semibold,
    color: colors.text.primary,
  },

  // Content
  content: {
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[2],
    minHeight: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[4],
  },
  emptyText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    textAlign: 'center',
  },

  // Bucket Item
  bucketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginHorizontal: spacing[2],
    marginVertical: spacing[1],
    borderRadius: radius.lg,
    backgroundColor: colors.surface.DEFAULT,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  bucketItemSelected: {
    backgroundColor: colors.accent.muted,
    borderColor: colors.accent.DEFAULT,
  },
  bucketItemContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  bucketItemName: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontFamily: fontFamily.medium,
  },
  bucketItemNameActive: {
    fontFamily: fontFamily.semibold,
    color: colors.accent.DEFAULT,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
    backgroundColor: colors.background.card,
  },
  doneButton: {
    backgroundColor: colors.accent.DEFAULT,
    borderRadius: radius.lg,
    paddingVertical: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: '#ffffff',
  },
});
