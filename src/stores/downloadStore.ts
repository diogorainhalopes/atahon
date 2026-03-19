import { create } from 'zustand';

export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'error' | 'completed';

export interface DownloadItem {
  id: number;
  chapterId: number;
  mangaId: number;
  mangaTitle: string;
  chapterName: string;
  sourceId: string;
  chapterUrl: string;
  status: DownloadStatus;
  progress: number; // 0–1
  error?: string;
  addedAt: number;
}

interface DownloadState {
  queue: DownloadItem[];
  isRunning: boolean;
  // Actions
  enqueue: (item: Omit<DownloadItem, 'status' | 'progress' | 'addedAt'>) => void;
  updateProgress: (chapterId: number, progress: number) => void;
  updateStatus: (chapterId: number, status: DownloadStatus, error?: string) => void;
  remove: (chapterId: number) => void;
  setRunning: (running: boolean) => void;
  clearCompleted: () => void;
}

export const useDownloadStore = create<DownloadState>((set) => ({
  queue: [],
  isRunning: false,

  enqueue: (item) =>
    set((s) => {
      const alreadyExists = s.queue.some((q) => q.chapterId === item.chapterId);
      if (alreadyExists) {
        console.log(`[DownloadStore] ⚠️ Chapter ${item.chapterId} already in queue`);
        return s;
      }
      const newItem: DownloadItem = {
        ...item,
        status: 'queued' as const,
        progress: 0,
        addedAt: Date.now(),
      };
      const newQueue = [...s.queue, newItem];
      console.log(`[DownloadStore] ➕ Chapter ${item.chapterId} enqueued (total: ${newQueue.length})`);
      return { queue: newQueue };
    }),

  updateProgress: (chapterId, progress) =>
    set((s) => {
      console.log(`[DownloadStore] 📊 Chapter ${chapterId} progress: ${Math.round(progress * 100)}%`);
      return {
        queue: s.queue.map((q) => (q.chapterId === chapterId ? { ...q, progress } : q)),
      };
    }),

  updateStatus: (chapterId, status, error) =>
    set((s) => {
      console.log(`[DownloadStore] 🔄 Chapter ${chapterId} status: ${status}${error ? ` (${error})` : ''}`);
      return {
        queue: s.queue.map((q) =>
          q.chapterId === chapterId ? { ...q, status, error } : q,
        ),
      };
    }),

  remove: (chapterId) =>
    set((s) => ({ queue: s.queue.filter((q) => q.chapterId !== chapterId) })),

  setRunning: (isRunning) => set({ isRunning }),

  clearCompleted: () =>
    set((s) => ({ queue: s.queue.filter((q) => q.status !== 'completed') })),
}));
