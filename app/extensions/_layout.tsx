import { Stack } from 'expo-router';
import { defaultStackScreenOptions } from '@theme/commonStyles';

export default function ExtensionsLayout() {
  return (
    <Stack
      screenOptions={{
        ...defaultStackScreenOptions,
        headerShown: true,
        animation: 'slide_from_right',
      }}
    />
  );
}
