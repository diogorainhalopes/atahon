import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PuzzlePiece, DownloadSimple, Database, GearSix, CaretRight, Info } from 'phosphor-react-native';
import Screen from '@components/Screen';
import PageHeader from '@components/PageHeader';
import { useTheme } from '@theme/ThemeProvider';
import { typeScale } from '@theme/typeScale';
import { radius, spacing } from '@theme/spacing';
import { AboutModal } from '@components/AboutModal';

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  onPress?: () => void;
}

function MenuItem({ icon: Icon, label, onPress }: MenuItemProps) {
  const t = useTheme();
  return (
    <TouchableOpacity
      style={[styles.menuItem, { minHeight: 56 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconWrapper, { backgroundColor: t.accentSoft }]}>
          <Icon size={20} color={t.accent} />
        </View>
        <Text style={[typeScale.body, { color: t.inkPrimary }]}>{label}</Text>
      </View>
      <CaretRight size={18} color={t.inkTertiary} />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const t = useTheme();

  const divider = { height: 1, backgroundColor: t.border, marginLeft: spacing[16] };
  const sectionCard = {
    backgroundColor: t.surface,
    borderRadius: radius.lg,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: t.border,
  };

  return (
    <Screen padded={false}>
      <PageHeader title="More" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[typeScale.label, { color: t.inkTertiary, textTransform: 'uppercase' }]}>
            Content
          </Text>
          <View style={sectionCard}>
            <MenuItem icon={PuzzlePiece} label="Extensions" onPress={() => router.push('/extensions')} />
            <View style={divider} />
            <MenuItem
              icon={Database}
              label="Repositories"
              onPress={() => router.push('/extensions/repos')}
            />
            <View style={divider} />
            <MenuItem
              icon={DownloadSimple}
              label="Downloads"
              onPress={() => router.push('/downloads')}
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[typeScale.label, { color: t.inkTertiary, textTransform: 'uppercase' }]}>
            App
          </Text>
          <View style={sectionCard}>
            <MenuItem
              icon={GearSix}
              label="Settings"
              onPress={() => router.push('/settings')}
            />
            <View style={divider} />
            <MenuItem
              icon={Info}
              label="About"
              onPress={() => router.push('/(modals)/about')}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing[4],
    gap: spacing[6],
  },
  section: {
    gap: spacing[2],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
