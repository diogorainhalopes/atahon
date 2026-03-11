import { Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import Screen from '@components/Screen';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

export default function MangaDetailScreen() {
  const { mangaId } = useLocalSearchParams<{ mangaId: string }>();

  return (
    <Screen>
      <Text style={styles.text}>Manga Detail — {mangaId}</Text>
      <Text style={styles.subtitle}>Coming in Phase 3</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },
});
