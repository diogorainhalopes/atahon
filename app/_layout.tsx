import '../global.css';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold, Geist_800ExtraBold } from '@expo-google-fonts/geist';
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { runMigrations } from '@db/client';
import { restoreQueueOnStartup } from '@db/queries/downloads';
import ExtensionBridge from 'extension-bridge';
import { Logger } from '@utils/logger';
import { startWorker, stopWorker } from '@utils/downloadWorker';
import { useDownloadStore } from '@stores/downloadStore';

// Prevent splash from auto hiding
SplashScreen.preventAutoHideAsync();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Geist-Regular': Geist_400Regular,
    'Geist-Medium': Geist_500Medium,
    'Geist-SemiBold': Geist_600SemiBold,
    'Geist-Bold': Geist_700Bold,
    'Geist-ExtraBold': Geist_800ExtraBold,
    'Geist-Mono': GeistMono_400Regular,
  });
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        runMigrations();

        await ExtensionBridge.loadInstalledExtensions();

        // Restore download queue from DB and start worker
        const queueItems = await restoreQueueOnStartup();
        if (queueItems.length > 0) {
          Logger.debug('Boot', `Restoring ${queueItems.length} downloads from queue`);
          for (const item of queueItems) {
            useDownloadStore.getState().enqueue({
              id: item.chapterId,
              chapterId: item.chapterId,
              mangaId: item.mangaId,
              mangaTitle: item.mangaTitle,
              chapterName: item.chapterName,
              sourceId: item.sourceId,
              chapterUrl: item.chapterUrl,
            });
          }
          startWorker();
        }
      } catch (e) {
        Logger.error('Boot', 'Prepare failed:', e);
      } finally {
        setAppReady(true);
      }
    }

    prepare();

    // Cleanup: stop worker on unmount
    return () => {
      stopWorker();
    };
  }, []);

  // Hide splash once both app and fonts are ready
  useEffect(() => {
    if (appReady && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [appReady, fontsLoaded, fontError]);

  if (!appReady || (!fontsLoaded && !fontError)) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" backgroundColor="#0A0A0F" />

          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(modals)" options={{ presentation: 'transparentModal', headerShown: false, }} />
            <Stack.Screen name="extensions" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="downloads" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />

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
