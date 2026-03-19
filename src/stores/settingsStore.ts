import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'dark' | 'amoled';
export type LibraryDisplayMode = 'grid' | 'list';
export type GridSize = 'small' | 'medium' | 'large';

interface SettingsState {
  // Appearance
  theme: Theme;
  gridSize: GridSize;
  libraryDisplayMode: LibraryDisplayMode;
  showUnreadBadges: boolean;
  // Library
  libraryUpdateInterval: number; // hours, 0 = manual only
  // Downloads
  concurrentDownloads: number;
  downloadOnWifiOnly: boolean;
  // Reader defaults
  defaultReadingMode: 'webtoon' | 'ltr' | 'rtl' | 'vertical';
  defaultPreloadCount: number;
  // Actions
  setTheme: (theme: Theme) => void;
  setGridSize: (size: GridSize) => void;
  setLibraryDisplayMode: (mode: LibraryDisplayMode) => void;
  setShowUnreadBadges: (show: boolean) => void;
  setLibraryUpdateInterval: (hours: number) => void;
  setConcurrentDownloads: (n: number) => void;
  setDownloadOnWifiOnly: (wifiOnly: boolean) => void;
  setDefaultReadingMode: (mode: 'webtoon' | 'ltr' | 'rtl' | 'vertical') => void;
  setDefaultPreloadCount: (n: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      gridSize: 'medium',
      libraryDisplayMode: 'grid',
      showUnreadBadges: true,
      libraryUpdateInterval: 12,
      concurrentDownloads: 6,
      downloadOnWifiOnly: false,
      defaultReadingMode: 'webtoon',
      defaultPreloadCount: 3,

      setTheme: (theme) => set({ theme }),
      setGridSize: (gridSize) => set({ gridSize }),
      setLibraryDisplayMode: (libraryDisplayMode) => set({ libraryDisplayMode }),
      setShowUnreadBadges: (showUnreadBadges) => set({ showUnreadBadges }),
      setLibraryUpdateInterval: (libraryUpdateInterval) => set({ libraryUpdateInterval }),
      setConcurrentDownloads: (concurrentDownloads) => set({ concurrentDownloads }),
      setDownloadOnWifiOnly: (downloadOnWifiOnly) => set({ downloadOnWifiOnly }),
      setDefaultReadingMode: (defaultReadingMode) => set({ defaultReadingMode }),
      setDefaultPreloadCount: (defaultPreloadCount) => set({ defaultPreloadCount }),
    }),
    {
      name: 'atahon-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
