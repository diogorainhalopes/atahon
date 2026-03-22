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
  compressDownloads: boolean;
  downloadQuality: number; // WebP quality 1–100
  // Reader defaults
  defaultReadingMode: 'webtoon' | 'ltr' | 'rtl' | 'vertical';
  defaultPreloadCount: number;
  // Privacy
  anonymousMode: boolean;
  // Actions
  setTheme: (theme: Theme) => void;
  setGridSize: (size: GridSize) => void;
  setLibraryDisplayMode: (mode: LibraryDisplayMode) => void;
  setShowUnreadBadges: (show: boolean) => void;
  setLibraryUpdateInterval: (hours: number) => void;
  setConcurrentDownloads: (n: number) => void;
  setDownloadOnWifiOnly: (wifiOnly: boolean) => void;
  setCompressDownloads: (enabled: boolean) => void;
  setDownloadQuality: (quality: number) => void;
  setDefaultReadingMode: (mode: 'webtoon' | 'ltr' | 'rtl' | 'vertical') => void;
  setDefaultPreloadCount: (n: number) => void;
  setAnonymousMode: (enabled: boolean) => void;
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
      compressDownloads: true,
      downloadQuality: 80,
      defaultReadingMode: 'webtoon',
      defaultPreloadCount: 3,
      anonymousMode: false,

      setTheme: (theme) => set({ theme }),
      setGridSize: (gridSize) => set({ gridSize }),
      setLibraryDisplayMode: (libraryDisplayMode) => set({ libraryDisplayMode }),
      setShowUnreadBadges: (showUnreadBadges) => set({ showUnreadBadges }),
      setLibraryUpdateInterval: (libraryUpdateInterval) => set({ libraryUpdateInterval }),
      setConcurrentDownloads: (concurrentDownloads) => set({ concurrentDownloads }),
      setDownloadOnWifiOnly: (downloadOnWifiOnly) => set({ downloadOnWifiOnly }),
      setCompressDownloads: (compressDownloads) => set({ compressDownloads }),
      setDownloadQuality: (downloadQuality) => set({ downloadQuality }),
      setDefaultReadingMode: (defaultReadingMode) => set({ defaultReadingMode }),
      setDefaultPreloadCount: (defaultPreloadCount) => set({ defaultPreloadCount }),
      setAnonymousMode: (anonymousMode) => set({ anonymousMode }),
    }),
    {
      name: 'atahon-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
