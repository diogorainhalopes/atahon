import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import { useInstalledExtensions, useUninstallExtension } from '@queries/extensions';
import { useSourceStore } from '@stores/sourceStore';
import type { SourceInfo } from '@/types/extensions';

// ─── SourceRow ─────────────────────────────────────────────────────────────────

interface SourceRowProps {
  source: SourceInfo;
  enabled: boolean;
  onToggle: (val: boolean) => void;
}

function SourceRow({ source, enabled, onToggle }: SourceRowProps) {
  return (
    <View style={styles.sourceRow}>
      <View style={styles.sourceInfo}>
        <View style={styles.sourceNameLine}>
          <Text style={styles.sourceName} numberOfLines={1}>{source.name}</Text>
          {source.isNsfw && (
            <View style={styles.nsfwBadge}>
              <Text style={styles.nsfwText}>18+</Text>
            </View>
          )}
        </View>
        <Text style={styles.sourceMeta}>{source.lang.toUpperCase()}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: colors.surface.DEFAULT, true: colors.accent.muted }}
        thumbColor={enabled ? colors.accent.DEFAULT : colors.text.muted}
      />
    </View>
  );
}

// ─── ExtensionDetailsScreen ──────────────────────────────────────────────────

export default function ExtensionDetailsScreen() {
  const { pkgName } = useLocalSearchParams<{ pkgName: string }>();
  const router = useRouter();

  const { data: extensions = [] } = useInstalledExtensions();
  const uninstallMutation = useUninstallExtension();

  const enabledSourceIds = useSourceStore((s) => s.enabledSourceIds);
  const { enableSource, disableSource, enableAll, disableAll } = useSourceStore();

  const extension = extensions.find((e) => e.pkgName === pkgName);

  if (!extension) {
    return (
      <>
        <Stack.Screen options={{ title: 'Extension' }} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>Extension not found</Text>
        </View>
      </>
    );
  }

  const sourceIds = extension.sources.map((s) => s.id);
  const enabledCount = sourceIds.filter((id) => enabledSourceIds.includes(id)).length;
  const allEnabled = enabledCount === extension.sources.length;
  const noneEnabled = enabledCount === 0;

  function handleUninstall() {
    Alert.alert(
      'Uninstall Extension',
      `Remove "${extension!.name}"?\n\nAll sources from this extension will be disabled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: async () => {
            disableAll(sourceIds);
            await uninstallMutation.mutateAsync(pkgName);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: extension.name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>
              {extension.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{extension.name}</Text>
            <Text style={styles.headerMeta}>
              v{extension.versionName} • {extension.lang.toUpperCase()} • {enabledCount}/{extension.sources.length} sources enabled
            </Text>
          </View>
        </View>

        {/* ── Bulk actions ────────────────────────────────────────── */}
        <View style={styles.bulkRow}>
          <TouchableOpacity
            style={[styles.bulkBtn, allEnabled && styles.bulkBtnDisabled]}
            onPress={() => enableAll(sourceIds)}
            disabled={allEnabled}
            activeOpacity={0.7}
          >
            <Text style={[styles.bulkBtnText, allEnabled && styles.bulkBtnTextDisabled]}>
              Enable All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bulkBtn, noneEnabled && styles.bulkBtnDisabled]}
            onPress={() => disableAll(sourceIds)}
            disabled={noneEnabled}
            activeOpacity={0.7}
          >
            <Text style={[styles.bulkBtnText, noneEnabled && styles.bulkBtnTextDisabled]}>
              Disable All
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Source list ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SOURCES</Text>
          <View style={styles.card}>
            {extension.sources.map((source, i) => (
              <View key={source.id}>
                {i > 0 && <View style={styles.separator} />}
                <SourceRow
                  source={source}
                  enabled={enabledSourceIds.includes(source.id)}
                  onToggle={(val) =>
                    val ? enableSource(source.id) : disableSource(source.id)
                  }
                />
              </View>
            ))}
          </View>
        </View>

        {/* ── Uninstall ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.uninstallBtn}
          onPress={handleUninstall}
          activeOpacity={0.7}
        >
          <Text style={styles.uninstallText}>Uninstall Extension</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.DEFAULT,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.muted,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.accent.DEFAULT,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  headerName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerMeta: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },

  // Bulk actions
  bulkRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  bulkBtn: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent.DEFAULT,
    alignItems: 'center',
  },
  bulkBtnDisabled: {
    borderColor: colors.border.DEFAULT,
  },
  bulkBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.accent.DEFAULT,
  },
  bulkBtnTextDisabled: {
    color: colors.text.muted,
  },

  // Section
  section: {
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.muted,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },

  // Source row
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  sourceInfo: {
    flex: 1,
    gap: 2,
  },
  sourceNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  sourceName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    flexShrink: 1,
  },
  sourceMeta: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },
  nsfwBadge: {
    backgroundColor: colors.status.error,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  nsfwText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: spacing[4],
  },

  // Uninstall
  uninstallBtn: {
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.status.error,
    alignItems: 'center',
  },
  uninstallText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.status.error,
  },
});
