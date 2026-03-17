import '../global.css';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { runMigrations } from '@db/client';
import ExtensionBridge from 'extension-bridge';
import { Logger } from '@utils/logger';

// Prevent splash from auto hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        runMigrations();

        await ExtensionBridge.loadInstalledExtensions();

      } catch (e) {
        Logger.error('Boot', 'Prepare failed:', e);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    }
  
    prepare();
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" backgroundColor="#0A0A0F" />

          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="extensions" options={{ animation: 'slide_from_right' }} />

            <Stack.Screen
              name="manga/[mangaId]/index"
              options={{ animation: 'slide_from_right' }}
            />

            <Stack.Screen
              name="manga/[mangaId]/reader/[chapterId]"
              options={{ animation: 'fade' }}
            />
          </Stack>

        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
