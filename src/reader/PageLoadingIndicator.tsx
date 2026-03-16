import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface PageLoadingIndicatorProps {
  pageNumber: number;
}

export function PageLoadingIndicator({ pageNumber }: PageLoadingIndicatorProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
      <Text style={styles.text}>Page {pageNumber}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },
});
