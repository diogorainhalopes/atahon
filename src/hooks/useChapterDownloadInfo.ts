import { useEffect, useState } from 'react';
import { getChapterDownloadInfo, type ChapterDownloadInfo } from '@utils/downloadPaths';

export function useChapterDownloadInfo(mangaId: number, chapterId: number) {
  const [info, setInfo] = useState<ChapterDownloadInfo | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const downloadInfo = await getChapterDownloadInfo(mangaId, chapterId);
        if (isMounted) {
          setInfo(downloadInfo);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [mangaId, chapterId]);

  return { info, isLoading };
}
