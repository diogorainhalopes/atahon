import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';

interface PageErrorViewProps {
  pageNumber: number;
  error?: string;
  onRetry: () => void;
}

export function PageErrorView({ pageNumber, error, onRetry }: PageErrorViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Failed to load page {pageNumber}</Text>
      {error && (
        <Text style={styles.error} numberOfLines={3}>{error}</Text>
      )}
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.7}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: spacing[6],
  },
  title: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.medium,
    color: colors.text.secondary,
  },
  error: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.accent.DEFAULT,
    borderRadius: radius.md,
  },
  retryText: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.medium,
    color: '#fff',
  },
});
