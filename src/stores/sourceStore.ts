import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SourceState {
  enabledSourceIds: string[];
  enableSource: (id: string) => void;
  disableSource: (id: string) => void;
  toggleSource: (id: string) => void;
  enableAll: (ids: string[]) => void;
  disableAll: (ids: string[]) => void;
}

export const useSourceStore = create<SourceState>()(
  persist(
    (set) => ({
      enabledSourceIds: [],

      enableSource: (id) =>
        set((s) =>
          s.enabledSourceIds.includes(id)
            ? s
            : { enabledSourceIds: [...s.enabledSourceIds, id] },
        ),

      disableSource: (id) =>
        set((s) => ({
          enabledSourceIds: s.enabledSourceIds.filter((x) => x !== id),
        })),

      toggleSource: (id) =>
        set((s) =>
          s.enabledSourceIds.includes(id)
            ? { enabledSourceIds: s.enabledSourceIds.filter((x) => x !== id) }
            : { enabledSourceIds: [...s.enabledSourceIds, id] },
        ),

      enableAll: (ids) =>
        set((s) => {
          const current = new Set(s.enabledSourceIds);
          ids.forEach((id) => current.add(id));
          return { enabledSourceIds: [...current] };
        }),

      disableAll: (ids) =>
        set((s) => {
          const toRemove = new Set(ids);
          return {
            enabledSourceIds: s.enabledSourceIds.filter((x) => !toRemove.has(x)),
          };
        }),
    }),
    {
      name: 'atahon-sources',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
