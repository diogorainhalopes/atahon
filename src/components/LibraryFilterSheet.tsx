import { Modal, Pressable, ScrollView, StyleSheet, Text, Switch, View } from 'react-native';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';

export type MangaReadingStatus = 'completed' | 'caught_up' | 'reading' | 'not_started';

interface LibraryFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  activeFilters: Set<MangaReadingStatus>;
  onToggle: (status: MangaReadingStatus) => void;
  onClear: () => void;
}

export default function LibraryFilterSheet({
  visible,
  onClose,
  activeFilters,
  onToggle,
  onClear,
}: LibraryFilterSheetProps) {
  const statuses: Array<{ label: string; value: MangaReadingStatus }> = [
    { label: 'Completed', value: 'completed' },
    { label: 'Caught Up', value: 'caught_up' },
    { label: 'Reading', value: 'reading' },
    { label: 'Not Started', value: 'not_started' },
  ];

  const hasActiveFilters = activeFilters.size > 0;

  return (
    <>
      {visible && <Pressable style={styles.backdropFixed} onPress={onClose} />}
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <Pressable style={styles.sheetContainer} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Filter by Status</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Status Toggles */}
              {statuses.map((status) => (
                <View key={status.value} style={styles.toggleRow}>
                  <Text style={styles.settingLabel}>{status.label}</Text>
                  <Switch
                    value={activeFilters.has(status.value)}
                    onValueChange={() => onToggle(status.value)}
                    trackColor={{
                      false: colors.surface.DEFAULT,
                      true: colors.accent.muted,
                    }}
                    thumbColor={
                      activeFilters.has(status.value)
                        ? colors.accent.DEFAULT
                        : colors.text.muted
                    }
                  />
                </View>
              ))}

              {/* Divider */}
              <View style={styles.divider} />

              {/* Clear All */}
              <Pressable
                style={[styles.clearButton, !hasActiveFilters && styles.clearButtonDisabled]}
                onPress={onClear}
                disabled={!hasActiveFilters}
              >
                <Text
                  style={[
                    styles.clearButtonText,
                    !hasActiveFilters && styles.clearButtonTextDisabled,
                  ]}
                >
                  Clear All
                </Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdropFixed: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.elevated,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[8],
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.DEFAULT,
    alignSelf: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  sheetTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  settingLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.medium,
    color: colors.text.secondary,
  },
  divider: {
    marginVertical: spacing[4],
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  clearButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.md,
    backgroundColor: colors.surface.DEFAULT,
    alignItems: 'center',
  },
  clearButtonDisabled: {
    opacity: 0.5,
  },
  clearButtonText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: colors.accent.DEFAULT,
  },
  clearButtonTextDisabled: {
    color: colors.text.muted,
  },
});
