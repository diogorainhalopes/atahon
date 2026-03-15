import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '@components/Screen';
import { Compass, ChevronRight, Puzzle } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import { useInstalledExtensions } from '@queries/extensions';
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
        <ChevronRight size={18} color={colors.text.muted} />
      </View>
    </TouchableOpacity>
  );
}

// ─── BrowseScreen ─────────────────────────────────────────────────────────────

interface FlatSource {
  source: SourceInfo;
  extensionName: string;
}

export default function BrowseScreen() {
  const router = useRouter();
  const { data: extensions = [], isLoading } = useInstalledExtensions();

  const sources: FlatSource[] = extensions.flatMap((ext: InstalledExtensionInfo) =>
    ext.sources.map((s) => ({ source: s, extensionName: ext.name })),
  );

  if (!isLoading && sources.length === 0) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.title}>Browse</Text>
        </View>
        <View style={styles.empty}>
          <Compass size={64} color={colors.text.muted} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No sources installed</Text>
          <Text style={styles.emptySubtitle}>
            Install extensions to browse manga from hundreds of sources
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/extensions')}
            activeOpacity={0.8}
          >
            <Puzzle size={16} color={colors.text.inverse} />
            <Text style={styles.buttonText}>Get Extensions</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Browse</Text>
      </View>
      <FlatList
        data={sources}
        keyExtractor={(item) => item.source.id}
        renderItem={({ item }) => (
          <SourceRow
            source={item.source}
            extensionName={item.extensionName}
            onPress={() => router.push({ pathname: '/browse/[sourceId]', params: { sourceId: item.source.id, name: item.source.name } })}
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
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
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
    fontWeight: typography.weights.bold,
    color: colors.accent.DEFAULT,
  },
  sourceInfo: {
    flex: 1,
    gap: 2,
  },
  sourceName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  sourceMeta: {
    fontSize: typography.sizes.sm,
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
    fontWeight: typography.weights.semibold,
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
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
