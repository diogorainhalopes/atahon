import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Screen from '@components/Screen';
import { Compass, Puzzle } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

export default function BrowseScreen() {
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

        <TouchableOpacity style={styles.button}>
          <Puzzle size={16} color={colors.text.inverse} />
          <Text style={styles.buttonText}>Get Extensions</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent.DEFAULT,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});