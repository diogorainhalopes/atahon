import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReadingMode = 'webtoon' | 'ltr' | 'rtl' | 'vertical';
export type PageLayout = 'single' | 'double' | 'double-first';
export type ScaleType = 'fit-width' | 'fit-height' | 'fit-page' | 'original';

interface ReaderSession {
  chapterId: number | null;
  mangaId: number | null;
  currentPage: number;
  totalPages: number;
  isOverlayVisible: boolean;
}

interface ReaderSettings {
  readingMode: ReadingMode;
  pageLayout: PageLayout;
  scaleType: ScaleType;
  preloadCount: number;
  backgroundColor: string;
  keepScreenOn: boolean;
  showPageNumber: boolean;
  fullscreen: boolean;
}

interface ReaderState extends ReaderSession, ReaderSettings {
  // Session actions
  openChapter: (chapterId: number, mangaId: number) => void;
  closeChapter: () => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setOverlayVisible: (visible: boolean) => void;
  toggleOverlay: () => void;
  // Settings actions
  setReadingMode: (mode: ReadingMode) => void;
  setPageLayout: (layout: PageLayout) => void;
  setScaleType: (scale: ScaleType) => void;
  setPreloadCount: (n: number) => void;
  setBackgroundColor: (color: string) => void;
  setKeepScreenOn: (keep: boolean) => void;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      // Session (not persisted — see partialize)
      chapterId: null,
      mangaId: null,
      currentPage: 0,
      totalPages: 0,
      isOverlayVisible: false,

      // Settings (persisted)
      readingMode: 'webtoon',
      pageLayout: 'single',
      scaleType: 'fit-width',
      preloadCount: 3,
      backgroundColor: '#000000',
      keepScreenOn: true,
      showPageNumber: true,
      fullscreen: true,

      openChapter: (chapterId, mangaId) =>
        set({ chapterId, mangaId, currentPage: 0, totalPages: 0, isOverlayVisible: false }),
      closeChapter: () =>
        set({ chapterId: null, mangaId: null, currentPage: 0, totalPages: 0 }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      setTotalPages: (totalPages) => set({ totalPages }),
      setOverlayVisible: (isOverlayVisible) => set({ isOverlayVisible }),
      toggleOverlay: () => set((s) => ({ isOverlayVisible: !s.isOverlayVisible })),
      setReadingMode: (readingMode) => set({ readingMode }),
      setPageLayout: (pageLayout) => set({ pageLayout }),
      setScaleType: (scaleType) => set({ scaleType }),
      setPreloadCount: (preloadCount) => set({ preloadCount }),
      setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
      setKeepScreenOn: (keepScreenOn) => set({ keepScreenOn }),
    }),
    {
      name: 'atahon-reader',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist settings, not session state
      partialize: (state) => ({
        readingMode: state.readingMode,
        pageLayout: state.pageLayout,
        scaleType: state.scaleType,
        preloadCount: state.preloadCount,
        backgroundColor: state.backgroundColor,
        keepScreenOn: state.keepScreenOn,
        showPageNumber: state.showPageNumber,
        fullscreen: state.fullscreen,
      }),
    },
  ),
);
