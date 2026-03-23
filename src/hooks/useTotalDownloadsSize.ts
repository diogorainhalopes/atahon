import { useEffect, useState } from 'react';
import { getChapterDownloadInfo } from '@utils/downloadPaths';

export interface Download {
  mangaId: number;
  chapterId: number;
}

export function useTotalDownloadsSize(downloads: Download[]) {
  const [totalSize, setTotalSize] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const calculateTotal = async () => {
      if (downloads.length === 0) {
        setTotalSize(0);
        return;
      }

      setIsLoading(true);
      let sum = 0;

      for (const dl of downloads) {
        try {
          const info = await getChapterDownloadInfo(dl.mangaId, dl.chapterId);
          if (info) {
            sum += info.sizeBytes;
          }
        } catch {
          // Skip on error
        }
      }

      if (isMounted) {
        setTotalSize(sum);
        setIsLoading(false);
      }
    };

    calculateTotal();

    return () => {
      isMounted = false;
    };
  }, [downloads]);

  return { totalSize, isLoading };
}
