import { Modal, Pressable, ScrollView, StyleSheet, Text, Switch, View } from 'react-native';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import { useReaderStore, type ReadingMode, type ScaleType } from '@stores/readerStore';

interface ReaderSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

// ─── SegmentedControl ──────────────────────────────────────────────────────────

interface SegmentedControlProps<T extends string> {
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (value: T) => void;
}

function SegmentedControl<T extends string>({
  options,
  selected,
  onSelect,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <Pressable
            key={opt.value}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── ColorSwatch ───────────────────────────────────────────────────────────────

interface ColorSwatchProps {
  color: string;
  selected: boolean;
  onPress: () => void;
}

function ColorSwatch({ color, selected, onPress }: ColorSwatchProps) {
  return (
    <Pressable
      style={[
        styles.swatch,
        { backgroundColor: color },
        selected && styles.swatchSelected,
        color === '#FFFFFF' && styles.swatchLight,
      ]}
      onPress={onPress}
    />
  );
}

// ─── SettingRow ────────────────────────────────────────────────────────────────

interface SettingRowProps {
  label: string;
  children: React.ReactNode;
}

function SettingRow({ label, children }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

const READING_MODES: { label: string; value: ReadingMode }[] = [
  { label: 'LTR', value: 'ltr' },
  { label: 'RTL', value: 'rtl' },
  { label: 'Vertical', value: 'vertical' },
  { label: 'Long Strip', value: 'webtoon' },
];

const SCALE_TYPES: { label: string; value: ScaleType }[] = [
  { label: 'Fit Width', value: 'fit-width' },
  { label: 'Fit Height', value: 'fit-height' },
  { label: 'Fit Page', value: 'fit-page' },
  { label: 'Original', value: 'original' },
];

const BG_COLORS = ['#000000', '#1A1A1A', '#333333', '#FFFFFF'];

export function ReaderSettingsSheet({ visible, onClose }: ReaderSettingsSheetProps) {
  const {
    readingMode,
    scaleType,
    backgroundColor,
    keepScreenOn,
    showPageNumber,
    connectPages,
    scrubberBlur,
    setReadingMode,
    setScaleType,
    setBackgroundColor,
    setKeepScreenOn,
    setConnectPages,
  } = useReaderStore();

  return (
    <>
      {visible && <Pressable style={styles.backdropFixed} onPress={onClose} />}
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <Pressable style={styles.sheetContainer} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Reader Settings</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <SettingRow label="Reading Mode">
              <SegmentedControl
                options={READING_MODES}
                selected={readingMode}
                onSelect={setReadingMode}
              />
            </SettingRow>

            <SettingRow label="Scale Type">
              <SegmentedControl
                options={SCALE_TYPES}
                selected={scaleType}
                onSelect={setScaleType}
              />
            </SettingRow>

            <SettingRow label="Background Color">
              <View style={styles.swatchRow}>
                {BG_COLORS.map((c) => (
                  <ColorSwatch
                    key={c}
                    color={c}
                    selected={backgroundColor === c}
                    onPress={() => setBackgroundColor(c)}
                  />
                ))}
              </View>
            </SettingRow>

            <View style={styles.toggleRow}>
              <Text style={styles.settingLabel}>Keep Screen On</Text>
              <Switch
                value={keepScreenOn}
                onValueChange={setKeepScreenOn}
                trackColor={{ false: colors.surface.DEFAULT, true: colors.accent.muted }}
                thumbColor={keepScreenOn ? colors.accent.DEFAULT : colors.text.muted}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.settingLabel}>Show Page Number</Text>
              <Switch
                value={showPageNumber}
                onValueChange={(v) => { useReaderStore.setState({ showPageNumber: v }); }}
                trackColor={{ false: colors.surface.DEFAULT, true: colors.accent.muted }}
                thumbColor={showPageNumber ? colors.accent.DEFAULT : colors.text.muted}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.settingLabel}>Blur Page Preview</Text>
              <Switch
                value={scrubberBlur}
                onValueChange={(v) => { useReaderStore.setState({ scrubberBlur: v }); }}
                trackColor={{ false: colors.surface.DEFAULT, true: colors.accent.muted }}
                thumbColor={scrubberBlur ? colors.accent.DEFAULT : colors.text.muted}
              />
            </View>

            {readingMode === 'webtoon' && (
              <View style={styles.toggleRow}>
                <Text style={styles.settingLabel}>Connect Pages</Text>
                <Switch
                  value={connectPages}
                  onValueChange={setConnectPages}
                  trackColor={{ false: colors.surface.DEFAULT, true: colors.accent.muted }}
                  thumbColor={connectPages ? colors.accent.DEFAULT : colors.text.muted}
                />
              </View>
            )}
          </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
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

  // Setting rows
  settingRow: {
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  settingLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.medium,
    color: colors.text.secondary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },

  // Segmented control
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: radius.md,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing[1.5],
    alignItems: 'center',
    borderRadius: radius.md - 2,
  },
  segmentActive: {
    backgroundColor: colors.accent.DEFAULT,
  },
  segmentText: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.medium,
    color: colors.text.muted,
  },
  segmentTextActive: {
    color: '#fff',
  },

  // Color swatches
  swatchRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: colors.accent.DEFAULT,
  },
  swatchLight: {
    borderColor: colors.border.DEFAULT,
  },
});
