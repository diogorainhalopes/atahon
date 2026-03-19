import { Stack } from 'expo-router';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

export default function DownloadsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background.DEFAULT },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.semibold,
        },
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
