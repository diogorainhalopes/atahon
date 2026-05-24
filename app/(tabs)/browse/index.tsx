import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '@components/Screen';
import PageHeader from '@components/PageHeader';
import { Compass, CaretRight, PuzzlePiece, ToggleRight } from 'phosphor-react-native';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import { typeScale } from '@theme/typeScale';
import { useInstalledExtensions } from '@queries/extensions';
import { useSourceStore } from '@stores/sourceStore';
import type { InstalledExtensionInfo } from 'extension-bridge';
import type { SourceInfo } from '@/types/extensions';

// ─── SourceRow ────────────────────────────────────────────────────────────────

interface SourceRowProps {
  source: SourceInfo;
  extensionName: string;
  onPress: () => void;
}

function SourceRow({ source, extensionName, onPress }: SourceRowProps) {
  return (
    <TouchableOpacity style={styles.sourceRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.sourceIcon}>
        <Text style={styles.sourceIconText}>{source.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.sourceInfo}>
        <Text style={styles.sourceName} numberOfLines={1}>{source.name}</Text>
        <Text style={styles.sourceMeta}>{extensionName} • {source.lang.toUpperCase()}</Text>
      </View>
      <View style={styles.sourceRight}>
        {source.supportsLatest && (
          <View style={styles.latestBadge}>
            <Text style={styles.latestText}>LATEST</Text>
          </View>
        )}
        <CaretRight size={18} color={colors.text.muted} />
      </View>
    </TouchableOpacity>
  );
}

// ─── BrowseScreen ─────────────────────────────────────────────────────────────

interface FlatSource {
  source: SourceInfo;
  extensionName: string;
  pkgName: string;
}

export default function BrowseScreen() {
  const router = useRouter();
  const { data: extensions = [], isLoading } = useInstalledExtensions();
  const enabledSourceIds = useSourceStore((s) => s.enabledSourceIds);

  const allSources: FlatSource[] = extensions.flatMap((ext: InstalledExtensionInfo) =>
    ext.sources.map((s) => ({ source: s, extensionName: ext.name, pkgName: ext.pkgName })),
  );

  const enabledSources = allSources.filter((s) => enabledSourceIds.includes(s.source.id));

  // No extensions installed at all
  if (!isLoading && allSources.length === 0) {
    return (
      <Screen padded={false}>
        <PageHeader title="Browse" />
        <View style={styles.empty}>
          <Compass size={64} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No sources installed</Text>
          <Text style={styles.emptySubtitle}>
            Install extensions to browse manga from hundreds of sources
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/extensions')}
            activeOpacity={0.8}
          >
            <PuzzlePiece size={16} color={colors.text.inverse} />
            <Text style={styles.buttonText}>Get Extensions</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  // Extensions installed but no sources enabled
  if (!isLoading && enabledSources.length === 0) {
    return (
      <Screen padded={false}>
        <PageHeader title="Browse" />
        <View style={styles.empty}>
          <ToggleRight size={64} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No sources enabled</Text>
          <Text style={styles.emptySubtitle}>
            Enable sources in your installed extensions to start browsing
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/extensions')}
            activeOpacity={0.8}
          >
            <PuzzlePiece size={16} color={colors.text.inverse} />
            <Text style={styles.buttonText}>Manage Extensions</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <PageHeader title="Browse" />
      <FlatList
        data={enabledSources}
        keyExtractor={(item) => item.source.id}
        renderItem={({ item }) => (
          <SourceRow
            source={item.source}
            extensionName={item.extensionName}
            onPress={() => router.push({
              pathname: '/browse/[sourceId]',
              params: {
                sourceId: item.source.id,
                name: item.source.name,
                pkgName: item.pkgName,
                isConfigurable: item.source.isConfigurable ? '1' : '0',
                baseUrl: item.source.baseUrl ?? '',
              },
            })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: spacing[2],
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  sourceIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.DEFAULT,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceIconText: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.bold,
    color: colors.accent.DEFAULT,
  },
  sourceInfo: {
    flex: 1,
    gap: 2,
  },
  sourceName: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.medium,
    color: colors.text.primary,
  },
  sourceMeta: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.regular,
    color: colors.text.muted,
  },
  sourceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  latestBadge: {
    backgroundColor: colors.accent.muted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  latestText: {
    fontSize: typography.sizes.xs,
    fontFamily: fontFamily.semibold,
    color: colors.accent.DEFAULT,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: 76,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: spacing[8],
  },
  emptyTitle: {
    ...typeScale.h2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.regular,
    color: colors.text.muted,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent.DEFAULT,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.lg,
    marginTop: 8,
  },
  buttonText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: colors.text.inverse,
  },
});
