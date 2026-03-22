import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal', // 👈 or 'formSheet' on iPad-like feel
        animation: 'slide_from_bottom', // 👈 native bottom-up animation
        headerShown: false,

        // 👇 enables dimmed background
        contentStyle: {
          backgroundColor: 'transparent',
        },

        // 👇 THIS is what allows swipe to dismiss on iOS
        gestureEnabled: true,
      }}
    />
  );
}