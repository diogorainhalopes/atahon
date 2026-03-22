import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Puzzle, Download, Settings, ChevronRight, Info } from 'lucide-react-native';
import Screen from '@components/Screen';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';
import { AboutModal } from '@components/AboutModal';

// ─── MenuItem ────────────────────────────────────────────────────────────

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  onPress?: () => void;
}

function MenuItem({ icon: Icon, label, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconWrapper}>
          <Icon size={20} color={colors.accent.DEFAULT} strokeWidth={2} />
        </View>
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      <ChevronRight size={18} color={colors.text.muted} />
    </TouchableOpacity>
  );
}

// ─── MoreScreen ──────────────────────────────────────────────────────────

export default function MoreScreen() {
  const router = useRouter();

  return (
    <>
      <Screen>
        <View style={styles.header}>
          <Text style={styles.title}>More</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content</Text>
            <View style={styles.sectionCard}>
              <MenuItem icon={Puzzle} label="Extensions" onPress={() => router.push('/extensions')} />
              <View style={styles.divider} />
              <MenuItem
                icon={Download}
                label="Downloads"
                onPress={() => router.push('/downloads')}
              />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App</Text>
            <View style={styles.sectionCard}>
              <MenuItem
                icon={Settings}
                label="Settings"
                onPress={() => router.push('/settings')}
              />
              <View style={styles.divider} />
              <MenuItem
                icon={Info}
                label="About"
                onPress={() => router.push('/(modals)/about')}
              />
            </View>
          </View>
        </ScrollView>
      </Screen>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 8,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: 64,
  },
});
