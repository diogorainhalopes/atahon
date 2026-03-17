import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getReadingHistory,
  deleteHistoryEntry,
  clearAllHistory,
  type HistoryEntry,
} from '@db/queries/reader';

export const historyKeys = {
  all: ['history'] as const,
  list: () => [...historyKeys.all, 'list'] as const,
};

export function useReadingHistory() {
  return useQuery<HistoryEntry[]>({
    queryKey: historyKeys.list(),
    queryFn: getReadingHistory,
    staleTime: 0,
  });
}

export function useDeleteHistoryEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHistoryEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}

export function useClearAllHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearAllHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}
