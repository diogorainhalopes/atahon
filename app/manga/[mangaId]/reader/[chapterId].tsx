import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

export default function ReaderScreen() {
  const { mangaId, chapterId } = useLocalSearchParams<{
    mangaId: string;
    chapterId: string;
  }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.text}>Reader</Text>
        <Text style={styles.subtitle}>
          Manga {mangaId} · Chapter {chapterId}
        </Text>
        <Text style={styles.note}>Coming in Phase 4</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  note: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },
});
