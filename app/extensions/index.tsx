import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { Search } from 'lucide-react-native';

import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import type { ExtensionInfo } from '@/types/extensions';
import {
  useMergedExtensions,
  useInstallExtension,
  useUninstallExtension,
  useRepos,
} from '@queries/extensions';

// ─── ExtensionRow ─────────────────────────────────────────────────────────────

interface ExtensionRowProps {
  item: ExtensionInfo;
  installing: boolean;
  onInstall: () => void;
  onUninstall: () => void;
}

function ExtensionRow({ item, installing, onInstall, onUninstall }: ExtensionRowProps) {
  const initial = item.name.charAt(0).toUpperCase();

  const actionLabel = item.hasUpdate ? 'Update' : item.installed ? 'Uninstall' : 'Install';
  const actionColor = item.hasUpdate
    ? colors.status.info
    : item.installed
      ? colors.status.error
      : colors.accent.DEFAULT;

  function handleAction() {
    if (item.installed && !item.hasUpdate) {
      onUninstall();
    } else {
      onInstall();
    }
  }

  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{initial}</Text>
      </View>

      <View style={styles.rowCenter}>
        <View style={styles.rowNameLine}>
          <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
          {item.isNsfw && (
            <View style={styles.nsfwBadge}>
              <Text style={styles.nsfwText}>18+</Text>
            </View>
          )}
        </View>
        <Text style={styles.rowMeta}>
          {item.lang.toUpperCase()} • v{item.versionName} • {item.sources.length} source{item.sources.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.actionBtn, { borderColor: actionColor }]}
        onPress={handleAction}
        disabled={installing}
        activeOpacity={0.7}
      >
        {installing ? (
          <ActivityIndicator size="small" color={actionColor} />
        ) : (
          <Text style={[styles.actionText, { color: actionColor }]}>{actionLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── ExtensionsScreen ─────────────────────────────────────────────────────────

export default function ExtensionsScreen() {
  const [search, setSearch] = useState('');
  const [installingPkg, setInstallingPkg] = useState<string | null>(null);

  const { data: repos = [] } = useRepos();
  const { data: extensions, isLoading, isError } = useMergedExtensions(repos);
  const installMutation = useInstallExtension();
  const uninstallMutation = useUninstallExtension();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return extensions;
    return extensions.filter(
      (e) => e.name.toLowerCase().includes(q) || e.lang.toLowerCase().includes(q),
    );
  }, [extensions, search]);

  const sections = useMemo(() => {
    const updates = filtered.filter((e) => e.hasUpdate);
    const installed = filtered.filter((e) => e.installed && !e.hasUpdate);
    const available = filtered.filter((e) => !e.installed);
    return [
      ...(updates.length > 0 ? [{ title: `UPDATES (${updates.length})`, data: updates }] : []),
      ...(installed.length > 0 ? [{ title: `INSTALLED (${installed.length})`, data: installed }] : []),
      ...(available.length > 0 ? [{ title: `AVAILABLE (${available.length})`, data: available }] : []),
    ];
  }, [filtered]);

  async function handleInstall(item: ExtensionInfo) {
    setInstallingPkg(item.pkgName);
    try {
      await installMutation.mutateAsync({ apkUrl: item.apkUrl, pkgName: item.pkgName });
    } finally {
      setInstallingPkg(null);
    }
  }

  async function handleUninstall(item: ExtensionInfo) {
    setInstallingPkg(item.pkgName);
    try {
      await uninstallMutation.mutateAsync(item.pkgName);
    } finally {
      setInstallingPkg(null);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Extensions' }} />
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <Search size={16} color={colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search extensions..."
            placeholderTextColor={colors.text.muted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent.DEFAULT} />
          </View>
        )}

        {isError && !isLoading && (
          <View style={styles.center}>
            <Text style={styles.errorText}>Failed to load extension index</Text>
          </View>
        )}

        {!isLoading && !isError && (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.pkgName}
            renderItem={({ item }) => (
              <ExtensionRow
                item={item}
                installing={installingPkg === item.pkgName}
                onInstall={() => handleInstall(item)}
                onUninstall={() => handleUninstall(item)}
              />
            )}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>
                  {search ? 'No extensions match your search' : 'No extensions found'}
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    margin: spacing[4],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
  listContent: {
    paddingBottom: spacing[8],
  },
  sectionHeader: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.muted,
    letterSpacing: typography.letterSpacing.wider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.accent.DEFAULT,
  },
  rowCenter: {
    flex: 1,
    gap: 2,
  },
  rowNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  rowName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    flexShrink: 1,
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
  rowMeta: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  actionBtn: {
    minWidth: 72,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.muted,
  },
  errorText: {
    fontSize: typography.sizes.base,
    color: colors.status.error,
  },
});
