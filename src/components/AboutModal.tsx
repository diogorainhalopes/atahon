import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { X } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AboutModal({ visible, onClose }: AboutModalProps) {
  const version = Constants.expoConfig?.version || '1.0.0';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>About</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
            {/* App Info */}
            <View style={styles.section}>
              <Text style={styles.appName}>Atahon</Text>
              <Text style={styles.version}>v{version}</Text>
              <Text style={styles.description}>
                A modern manga reader with full extension support for seamless manga browsing and reading.
              </Text>
            </View>

            {/* Thanks to Mihon */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Thanks to Mihon</Text>
              <Text style={styles.cardDescription}>
                Atahon is inspired by and built on the Mihon/Tachiyomi extension ecosystem. We're grateful for the open-source manga reader community and their incredible work on extension compatibility and manga source management.
              </Text>
            </View>

            {/* About */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About This App</Text>
              <Text style={styles.cardDescription}>
                Atahon provides a clean, modern interface for browsing and reading manga with full support for Mihon/Tachiyomi extensions. Built with React Native and Expo for a seamless cross-platform experience.
              </Text>
            </View>

            <View style={{ height: spacing[4] }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  },
  modal: {
    backgroundColor: colors.background.card,
    borderRadius: radius['2xl'],
    maxHeight: '80%',
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
  },
  content: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  section: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  appName: {
    fontSize: typography.sizes['2xl'],
    fontFamily: fontFamily.bold,
    color: colors.accent.DEFAULT,
    marginBottom: spacing[2],
  },
  version: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.relaxed,
  },
  card: {
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    width: '100%',
  },
  cardTitle: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: colors.accent.DEFAULT,
    marginBottom: spacing[2],
  },
  cardDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.relaxed,
  },
});
