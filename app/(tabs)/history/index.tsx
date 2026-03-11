import { View, Text, StyleSheet } from 'react-native';
import Screen from '@components/Screen';
import { Clock } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

export default function HistoryScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>
      <View style={styles.empty}>
        <Clock size={64} color={colors.text.muted} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>No reading history</Text>
        <Text style={styles.emptySubtitle}>
          Chapters you've read will appear here
        </Text>
      </View>
    </Screen>
  );
}

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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
});
