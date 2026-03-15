import { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Trash2 } from 'lucide-react-native';

import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import type { ExtensionRepo } from '@db/schema';
import {
  useRepos,
  useAddRepo,
  useRemoveRepo,
  useToggleRepo,
} from '@queries/extensions';

// ─── RepoRow ──────────────────────────────────────────────────────────────────

interface RepoRowProps {
  repo: ExtensionRepo;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}

function RepoRow({ repo, onToggle, onDelete }: RepoRowProps) {
  function handleDelete() {
    Alert.alert(
      'Remove Repository',
      `Remove "${repo.name}"?\n\nExtensions from this repo will still be installed but won't receive updates.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: onDelete },
      ],
    );
  }

  return (
    <View style={styles.repoRow}>
      <View style={styles.repoInfo}>
        <Text style={styles.repoName} numberOfLines={1}>{repo.name}</Text>
        <Text style={styles.repoUrl} numberOfLines={1}>{repo.url}</Text>
      </View>
      <Switch
        value={repo.enabled}
        onValueChange={onToggle}
        trackColor={{ false: colors.surface.DEFAULT, true: colors.accent.muted }}
        thumbColor={repo.enabled ? colors.accent.DEFAULT : colors.text.muted}
      />
      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.7}>
        <Trash2 size={18} color={colors.status.error} />
      </TouchableOpacity>
    </View>
  );
}

// ─── ReposScreen ──────────────────────────────────────────────────────────────

export default function ReposScreen() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  const { data: repos = [], isLoading } = useRepos();
  const addMutation = useAddRepo();
  const removeMutation = useRemoveRepo();
  const toggleMutation = useToggleRepo();

  const adding = addMutation.isPending;

  async function handleAdd() {
    const trimUrl = url.trim();
    const trimName = name.trim();
    if (!trimUrl.startsWith('http')) {
      Alert.alert('Invalid URL', 'Repository URL must start with http:// or https://');
      return;
    }
    if (!trimName) {
      Alert.alert('Name required', 'Please enter a name for this repository.');
      return;
    }
    try {
      await addMutation.mutateAsync({ url: trimUrl, name: trimName });
      setUrl('');
      setName('');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add repository');
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Extension Repositories' }} />
      <View style={styles.container}>
        {/* Add repo card */}
        <View style={styles.addCard}>
          <Text style={styles.addTitle}>Add Repository</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/repo"
            placeholderTextColor={colors.text.muted}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TextInput
            style={styles.input}
            placeholder="Repository name"
            placeholderTextColor={colors.text.muted}
            value={name}
            onChangeText={setName}
          />
          <TouchableOpacity
            style={[styles.addBtn, adding && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={adding}
            activeOpacity={0.7}
          >
            {adding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addBtnText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Repo list */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent.DEFAULT} />
          </View>
        ) : (
          <FlatList
            data={repos}
            keyExtractor={(r) => String(r.id)}
            renderItem={({ item }) => (
              <RepoRow
                repo={item}
                onToggle={(enabled) =>
                  toggleMutation.mutate({ id: item.id, enabled })
                }
                onDelete={() => removeMutation.mutate(item.id)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>No repositories added</Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
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
  addCard: {
    margin: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.background.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing[3],
  },
  addTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  input: {
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
  addBtn: {
    backgroundColor: colors.accent.DEFAULT,
    borderRadius: radius.md,
    paddingVertical: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  addBtnDisabled: {
    opacity: 0.6,
  },
  addBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  repoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  repoInfo: {
    flex: 1,
    gap: 2,
  },
  repoName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  repoUrl: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },
  deleteBtn: {
    padding: spacing[1],
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.muted,
  },
});
