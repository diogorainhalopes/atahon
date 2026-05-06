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
  cancelledChapterIds: Set<number>;
  // Actions
  enqueue: (item: Omit<DownloadItem, 'status' | 'progress' | 'addedAt'>) => void;
  updateProgress: (chapterId: number, progress: number) => void;
  updateStatus: (chapterId: number, status: DownloadStatus, error?: string) => void;
  remove: (chapterId: number) => void;
  removeMany: (chapterIds: number[]) => void;
  setRunning: (running: boolean) => void;
  clearCompleted: () => void;
  markCancelled: (chapterId: number) => void;
  clearCancelled: (chapterId: number) => void;
}

export const useDownloadStore = create<DownloadState>((set) => ({
  queue: [],
  isRunning: false,
  cancelledChapterIds: new Set<number>(),

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

  removeMany: (chapterIds) =>
    set((s) => {
      if (chapterIds.length === 0) return s;
      const ids = new Set(chapterIds);
      return { queue: s.queue.filter((q) => !ids.has(q.chapterId)) };
    }),

  setRunning: (isRunning) => set({ isRunning }),

  clearCompleted: () =>
    set((s) => ({ queue: s.queue.filter((q) => q.status !== 'completed') })),

  markCancelled: (chapterId) =>
    set((s) => {
      const next = new Set(s.cancelledChapterIds);
      next.add(chapterId);
      return { cancelledChapterIds: next };
    }),

  clearCancelled: (chapterId) =>
    set((s) => {
      if (!s.cancelledChapterIds.has(chapterId)) return s;
      const next = new Set(s.cancelledChapterIds);
      next.delete(chapterId);
      return { cancelledChapterIds: next };
    }),
}));
