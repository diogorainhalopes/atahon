import { View, Text, TouchableOpacity, Modal, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';

interface DuplicateRepoModalProps {
  visible: boolean;
  onClose: () => void;
  repoUrl?: string;
}

export function DuplicateRepoModal({ visible, onClose, repoUrl }: DuplicateRepoModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.iconContainer}>
                <AlertCircle size={48} color={colors.status.error} strokeWidth={1.5} />
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalTitle}>Repository Already Added</Text>
                <Text style={styles.modalMessage}>
                  This repository URL is already in your list.
                </Text>
                {repoUrl && (
                  <Text style={styles.modalUrl} numberOfLines={2}>
                    {repoUrl}
                  </Text>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonText}>Got it</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
  },
  iconContainer: {
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
  },
  modalBody: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
    alignItems: 'center',
    gap: spacing[2],
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalUrl: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginTop: spacing[2],
    textAlign: 'center',
  },
  modalActions: {
    width: '100%',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
  },
  modalButton: {
    backgroundColor: colors.accent.DEFAULT,
    borderRadius: radius.lg,
    paddingVertical: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: '#fff',
  },
});
