import { create } from 'zustand';

export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'error' | 'completed';

export interface DownloadItem {
  id: number;
  chapterId: number;
  mangaId: number;
  mangaTitle: string;
  chapterName: string;
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
    set((s) => ({
      queue: s.queue.some((q) => q.chapterId === item.chapterId)
        ? s.queue
        : [
            ...s.queue,
            { ...item, status: 'queued', progress: 0, addedAt: Date.now() },
          ],
    })),

  updateProgress: (chapterId, progress) =>
    set((s) => ({
      queue: s.queue.map((q) => (q.chapterId === chapterId ? { ...q, progress } : q)),
    })),

  updateStatus: (chapterId, status, error) =>
    set((s) => ({
      queue: s.queue.map((q) =>
        q.chapterId === chapterId ? { ...q, status, error } : q,
      ),
    })),

  remove: (chapterId) =>
    set((s) => ({ queue: s.queue.filter((q) => q.chapterId !== chapterId) })),

  setRunning: (isRunning) => set({ isRunning }),

  clearCompleted: () =>
    set((s) => ({ queue: s.queue.filter((q) => q.status !== 'completed') })),
}));
