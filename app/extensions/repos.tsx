import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  SectionList,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Stack } from 'expo-router';
import { Trash2, Clipboard, Send, RotateCcw } from 'lucide-react-native';
import * as ClipboardModule from 'expo-clipboard';

import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import type { ExtensionRepo } from '@db/schema';
import {
  useRepos,
  useAddRepo,
  useToggleRepo,
  useRemoveRepo,
} from '@queries/extensions';

// ─── Helpers ──────────────────────────────────────────────────────────────

function repoNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'raw.githubusercontent.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0] ?? url;
    }
    const parts = u.pathname
      .split('/')
      .filter((p) => p && p !== 'index.min.json');
    return parts[parts.length - 1] ?? u.hostname;
  } catch {
    return url;
  }
}

// ─── RepoRow ──────────────────────────────────────────────────────────────

interface RepoRowProps {
  repo: ExtensionRepo;
  onDelete?: () => void;
  disabled?: boolean;
  onReEnable?: () => void;
}

function RepoRow({ repo, onDelete, disabled = false, onReEnable }: RepoRowProps) {
  return (
    <View style={[styles.repoRow, disabled && styles.repoRowDisabled]}>
      <View style={styles.repoInfo}>
        <Text style={[styles.repoName, disabled && styles.repoNameDisabled]} numberOfLines={1}>
          {repo.name}
        </Text>
        <Text style={[styles.repoUrl, disabled && styles.repoUrlDisabled]} numberOfLines={1}>
          {repo.url}
        </Text>
      </View>
      <TouchableOpacity
        onPress={disabled ? onReEnable : onDelete}
        style={styles.actionBtn}
        activeOpacity={0.7}
      >
        {disabled ? (
          <RotateCcw size={18} color={colors.accent.DEFAULT} />
        ) : (
          <Trash2 size={18} color={colors.status.error} />
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── ReposScreen ──────────────────────────────────────────────────────────

export default function ReposScreen() {
  const [url, setUrl] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { data: repos = [], isLoading } = useRepos();
  const addMutation = useAddRepo();
  const toggleMutation = useToggleRepo();
  const removeMutation = useRemoveRepo();

  const adding = addMutation.isPending;
  const activeRepos = repos.filter((r) => r.enabled);
  const disabledRepos = repos.filter((r) => !r.enabled);

  function handleClearDisabledRepos() {
    if (disabledRepos.length === 0) return;
    setShowClearConfirm(true);
  }

  function handleConfirmClear() {
    setShowClearConfirm(false);
    for (const repo of disabledRepos) {
      removeMutation.mutate(repo.id);
    }
  }

  async function handlePasteFromClipboard() {
    try {
      const clipboardText = await ClipboardModule.getStringAsync();
      setUrl(clipboardText.trim());
    } catch {
      Alert.alert('Error', 'Failed to read from clipboard');
    }
  }

  async function handleAdd() {
    const trimUrl = url.trim();

    // Validation
    if (!trimUrl.startsWith('http')) {
      Alert.alert('Invalid URL', 'Repository URL must start with http:// or https://');
      return;
    }
    if (!trimUrl.endsWith('/index.min.json')) {
      Alert.alert(
        'Invalid URL',
        'Repository URL must end with /index.min.json',
      );
      return;
    }

    try {
      const name = repoNameFromUrl(trimUrl);
      await addMutation.mutateAsync({ url: trimUrl, name });
      setUrl('');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add repository');
    }
  }

  const sections = [
    {
      title: 'Active',
      data: activeRepos,
      renderItem: ({ item }: { item: ExtensionRepo }) => (
        <RepoRow
          repo={item}
          onDelete={() => toggleMutation.mutate({ id: item.id, enabled: false })}
        />
      ),
    },
    ...(disabledRepos.length > 0
      ? [
          {
            title: 'Disabled',
            data: disabledRepos,
            renderItem: ({ item }: { item: ExtensionRepo }) => (
              <RepoRow
                repo={item}
                onDelete={() => {}} // unused for disabled
                disabled
                onReEnable={() => toggleMutation.mutate({ id: item.id, enabled: true })}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Extension Repositories' }} />

      {/* Clear confirmation modal */}
      <Modal
        visible={showClearConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearConfirm(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowClearConfirm(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Clear Disabled Repositories</Text>
                </View>
                <View style={styles.modalBody}>
                  <Text style={styles.modalMessage}>
                    Are you sure you want to permanently delete {disabledRepos.length}{' '}
                    disabled {disabledRepos.length === 1 ? 'repository' : 'repositories'}?
                  </Text>
                  <Text style={styles.modalWarning}>This cannot be undone.</Text>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setShowClearConfirm(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalDeleteBtn, removeMutation.isPending && styles.modalDeleteBtnDisabled]}
                    onPress={handleConfirmClear}
                    disabled={removeMutation.isPending}
                    activeOpacity={0.7}
                  >
                    {removeMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalDeleteText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.container}>
        {/* Add repo card */}
        <View style={styles.addCard}>
          <Text style={styles.addTitle}>Add Repository</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/repo/index.min.json"
              placeholderTextColor={colors.text.muted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              onPress={handlePasteFromClipboard}
              style={styles.iconBtn}
              activeOpacity={0.7}
            >
              <Clipboard size={20} color={colors.accent.DEFAULT} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.addBtn, adding && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={adding}
            activeOpacity={0.7}
          >
            {adding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.addBtnContent}>
                <Send size={18} color="#fff" />
                <Text style={styles.addBtnText}>Add</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Repos list */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent.DEFAULT} />
          </View>
        ) : repos.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No repositories added</Text>
          </View>
        ) : (
          <>
            <SectionList
              sections={sections}
              keyExtractor={(item) => String(item.id)}
              renderSectionHeader={({ section: { title } }) => (
                <Text style={styles.sectionHeader}>{title}</Text>
              )}
              renderItem={({ item, section }) =>
                section.renderItem({ item })
              }
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
              contentContainerStyle={styles.listContent}
              scrollEnabled={false}
            />
            {disabledRepos.length > 0 && (
              <View style={styles.clearButtonContainer}>
                <TouchableOpacity
                  style={[styles.clearBtn, removeMutation.isPending && styles.clearBtnDisabled]}
                  onPress={handleClearDisabledRepos}
                  disabled={removeMutation.isPending}
                  activeOpacity={0.7}
                >
                  {removeMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Trash2 size={18} color="#fff" />
                      <Text style={styles.clearBtnText}>Clear All Disabled</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

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
    fontFamily: fontFamily.semibold,
    color: colors.text.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
  iconBtn: {
    padding: spacing[2],
    borderRadius: radius.md,
    backgroundColor: colors.surface.DEFAULT,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
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
  addBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  addBtnText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  sectionHeader: {
    fontSize: typography.sizes.xs,
    fontFamily: fontFamily.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
    paddingVertical: spacing[3],
  },
  sectionSeparator: {
    height: spacing[2],
  },
  repoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  repoRowDisabled: {
    opacity: 0.6,
  },
  repoInfo: {
    flex: 1,
    gap: 2,
  },
  repoName: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.medium,
    color: colors.text.primary,
  },
  repoNameDisabled: {
    color: colors.text.muted,
  },
  repoUrl: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },
  repoUrlDisabled: {
    color: colors.text.muted,
    opacity: 0.7,
  },
  actionBtn: {
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
  clearButtonContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    paddingTop: spacing[2],
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.status.error,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
  },
  clearBtnDisabled: {
    opacity: 0.6,
  },
  clearBtnText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: '#fff',
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  },
  modalContent: {
    backgroundColor: colors.background.card,
    borderRadius: radius['2xl'],
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  modalHeader: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
  },
  modalBody: {
    padding: spacing[5],
    gap: spacing[2],
  },
  modalMessage: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  modalWarning: {
    fontSize: typography.sizes.sm,
    color: colors.status.error,
    fontFamily: fontFamily.semibold,
  },
  modalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
  },
  modalCancelBtn: {
    flex: 1,
    padding: spacing[4],
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border.DEFAULT,
  },
  modalCancelText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.medium,
    color: colors.text.secondary,
  },
  modalDeleteBtn: {
    flex: 1,
    padding: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteBtnDisabled: {
    opacity: 0.6,
  },
  modalDeleteText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: colors.status.error,
  },
});
