import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Stack } from 'expo-router';
import { Minus, Plus } from 'lucide-react-native';
import { useSettingsStore } from '@stores/settingsStore';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';

// ─── SegmentChooser ──────────────────────────────────────────────────────

interface SegmentChooserProps<T extends string> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  labels?: string[];
}

function SegmentChooser<T extends string>({
  options,
  value,
  onChange,
  labels,
}: SegmentChooserProps<T>) {
  return (
    <View style={styles.segmentContainer}>
      {options.map((option, idx) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.segmentButton,
            value === option && styles.segmentButtonActive,
          ]}
          onPress={() => onChange(option)}
        >
          <Text
            style={[
              styles.segmentButtonText,
              value === option && styles.segmentButtonTextActive,
            ]}
          >
            {labels?.[idx] || option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

function Stepper({ value, onChange, min, max }: StepperProps) {
  const handleMinus = () => {
    if (value > min) onChange(value - 1);
  };

  const handlePlus = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <View style={styles.stepperContainer}>
      <TouchableOpacity
        style={styles.stepperButton}
        onPress={handleMinus}
        disabled={value === min}
      >
        <Minus size={18} color={colors.accent.DEFAULT} />
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{value}</Text>
      <TouchableOpacity
        style={styles.stepperButton}
        onPress={handlePlus}
        disabled={value === max}
      >
        <Plus size={18} color={colors.accent.DEFAULT} />
      </TouchableOpacity>
    </View>
  );
}

// ─── SettingRow ──────────────────────────────────────────────────────────

interface SettingRowProps {
  label: string;
  children: React.ReactNode;
}

function SettingRow({ label, children }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View>{children}</View>
    </View>
  );
}

// ─── SettingsScreen ──────────────────────────────────────────────────────

export default function SettingsScreen() {
  const {
    theme,
    setTheme,
    libraryDisplayMode,
    setLibraryDisplayMode,
    gridSize,
    setGridSize,
    downloadOnWifiOnly,
    setDownloadOnWifiOnly,
    concurrentDownloads,
    setConcurrentDownloads,
    compressDownloads,
    setCompressDownloads,
    downloadQuality,
    setDownloadQuality,
    anonymousMode,
    setAnonymousMode,
  } = useSettingsStore();

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Appearance ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.sectionCard}>
            <SettingRow label="Theme (WIP)">
              <SegmentChooser
                options={['dark', 'amoled'] as const}
                value={theme}
                onChange={setTheme}
                labels={['Dark', 'AMOLED']}
              />
            </SettingRow>
            <View style={styles.divider} />
            <SettingRow label="Display">
              <SegmentChooser
                options={['grid', 'list'] as const}
                value={libraryDisplayMode}
                onChange={setLibraryDisplayMode}
                labels={['Grid', 'List']}
              />
            </SettingRow>
            <View style={styles.divider} />
            <SettingRow label="Grid Size">
              <SegmentChooser
                options={['small', 'medium', 'large'] as const}
                value={gridSize}
                onChange={setGridSize}
                labels={['S', 'M', 'L']}
              />
            </SettingRow>
          </View>
        </View>

        {/* ─── Privacy ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.sectionCard}>
            <SettingRow label="Anonymous Mode">
              <Switch
                value={anonymousMode}
                onValueChange={setAnonymousMode}
                trackColor={{ false: colors.border.DEFAULT, true: colors.accent.muted }}
                thumbColor={anonymousMode ? colors.accent.DEFAULT : colors.text.muted}
              />
            </SettingRow>
            <View style={styles.divider} />
            <View style={styles.settingHint}>
              <Text style={styles.settingHintText}>
                When enabled, reading history and chapter progress will not be saved.
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Downloads ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloads</Text>
          <View style={styles.sectionCard}>
            <SettingRow label="Wi-Fi Only">
              <Switch
                value={downloadOnWifiOnly}
                onValueChange={setDownloadOnWifiOnly}
                trackColor={{ false: colors.border.DEFAULT, true: colors.accent.muted }}
                thumbColor={downloadOnWifiOnly ? colors.accent.DEFAULT : colors.text.muted}
              />
            </SettingRow>
            <View style={styles.divider} />
            <SettingRow label="Concurrent Downloads">
              <Stepper
                value={concurrentDownloads}
                onChange={setConcurrentDownloads}
                min={1}
                max={10}
              />
            </SettingRow>
            <View style={styles.divider} />
            <SettingRow label="Compress Downloads">
              <Switch
                value={compressDownloads}
                onValueChange={setCompressDownloads}
                trackColor={{ false: colors.border.DEFAULT, true: colors.accent.muted }}
                thumbColor={compressDownloads ? colors.accent.DEFAULT : colors.text.muted}
              />
            </SettingRow>
            {compressDownloads && (
              <>
                <View style={styles.divider} />
                <SettingRow label="Image Quality">
                  <SegmentChooser
                    options={['65', '80', '90'] as const}
                    value={String(downloadQuality) as '65' | '80' | '90'}
                    onChange={(v) => setDownloadQuality(Number(v))}
                    labels={['Low', 'Medium', 'High']}
                  />
                </SettingRow>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  content: {
    padding: spacing[4],
    gap: spacing[5],
    paddingBottom: spacing[6],
  },
  section: {
    gap: spacing[2],
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  settingLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  settingHint: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  settingHintText: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },

  // Segment Chooser
  segmentContainer: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  segmentButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    backgroundColor: colors.border.subtle,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  segmentButtonActive: {
    backgroundColor: colors.accent.DEFAULT,
    borderColor: colors.accent.DEFAULT,
  },
  segmentButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.muted,
  },
  segmentButtonTextActive: {
    color: colors.background.DEFAULT,
    fontWeight: typography.weights.semibold,
  },

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.border.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    minWidth: 28,
    textAlign: 'center',
  },
});
