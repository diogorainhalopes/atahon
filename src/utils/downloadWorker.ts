import * as FileSystem from 'expo-file-system/legacy';
import ExtensionBridge from 'extension-bridge';
import { Logger } from '@utils/logger';
import { useDownloadStore } from '@stores/downloadStore';
import { useSettingsStore } from '@stores/settingsStore';
import { updateDownloadProgress, markDownloadComplete, markDownloadError } from '@db/queries/downloads';
import { chapterDir, indexPath, pagePath, PageIndex } from '@utils/downloadPaths';

const MODULE = 'DownloadWorker';

let isWorkerRunning = false;
let activeJobsCount = 0;

export function startWorker(): void {
  const store = useDownloadStore.getState();
  if (!isWorkerRunning) {
    isWorkerRunning = true;
    store.setRunning(true);
    Logger.info(MODULE, '🚀 Worker STARTED');
    Logger.info(MODULE, `Queue has ${store.queue.length} items`);
    pump();
  } else {
    Logger.debug(MODULE, '⚠️ Worker already running');
  }
}

export function stopWorker(): void {
  isWorkerRunning = false;
  useDownloadStore.getState().setRunning(false);
  Logger.debug(MODULE, 'Worker stopped');
}

export function isWorkerActive(): boolean {
  return isWorkerRunning;
}

/**
 * Main pump loop: grabs items from queue and launches downloads.
 * Respects concurrentDownloads limit.
 */
function pump(): void {
  Logger.debug(MODULE, `pump() called. Worker running: ${isWorkerRunning}, Active jobs: ${activeJobsCount}`);

  if (!isWorkerRunning) {
    Logger.debug(MODULE, '⚠️ Worker stopped, pump exiting');
    return;
  }

  const concurrentLimit = useSettingsStore.getState().concurrentDownloads ?? 3;
  Logger.debug(MODULE, `Concurrent limit: ${concurrentLimit}, Active: ${activeJobsCount}`);

  // Try to launch jobs up to the concurrent limit
  while (activeJobsCount < concurrentLimit) {
    // Get the queue and find next queued item
    const store = useDownloadStore.getState();
    Logger.debug(MODULE, `Searching queue (${store.queue.length} items) for queued chapter...`);

    const queuedItem = store.queue.find((item) => {
      Logger.debug(MODULE, `  - Chapter ${item.chapterId}: status=${item.status}`);
      return item.status === 'queued';
    });

    if (!queuedItem) {
      Logger.info(MODULE, '📭 Queue empty, worker idle');
      if (activeJobsCount === 0) {
        isWorkerRunning = false;
        store.setRunning(false);
        Logger.info(MODULE, '✋ Worker stopped (queue empty, no active jobs)');
      }
      return;
    }

    // Launch the download (async, non-blocking)
    activeJobsCount++;
    Logger.info(MODULE, `▶️ Launching download for chapter ${queuedItem.chapterId} (${activeJobsCount}/${concurrentLimit} slots)`);

    downloadChapter(queuedItem)
      .catch((e) => {
        Logger.error(MODULE, `❌ Download failed for chapter ${queuedItem.chapterId}:`, e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        activeJobsCount--;
        Logger.debug(MODULE, `✅ Chapter ${queuedItem.chapterId} completed. Active jobs: ${activeJobsCount}`);
        // Try to pick up the next item after this one completes
        if (isWorkerRunning) {
          pump();
        }
      });
  }
}

/**
 * Download a single chapter: fetch pages, write files, update DB.
 */
async function downloadChapter(item: ReturnType<typeof useDownloadStore.getState>['queue'][0]): Promise<void> {
  const { chapterId, mangaId, sourceId, chapterUrl } = item;

  try {
    Logger.info(MODULE, `🔵 [Chapter ${chapterId}] Download starting...`);
    Logger.info(MODULE, `   - Manga ID: ${mangaId}`);
    Logger.info(MODULE, `   - Source ID: ${sourceId}`);
    Logger.info(MODULE, `   - Chapter URL: ${chapterUrl}`);

    // Step 1: Update status to downloading
    useDownloadStore.getState().updateStatus(chapterId, 'downloading');
    await updateDownloadProgress(chapterId, 0, 1); // 1 = downloading

    // Step 2: Fetch page list from extension
    Logger.info(MODULE, `🔵 [Chapter ${chapterId}] Fetching page list...`);
    const pages = await ExtensionBridge.getPageList(sourceId, chapterUrl);
    Logger.info(MODULE, `🔵 [Chapter ${chapterId}] Got ${pages.length} pages`);
    if (pages.length === 0) {
      throw new Error('No pages returned from extension');
    }

    // Step 3: Create chapter directory
    const dir = chapterDir(mangaId, chapterId);
    Logger.debug(MODULE, `Creating directory: ${dir}`);
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

    // Step 4: Download pages
    const pageIndex: PageIndex = {
      chapterId,
      pageCount: pages.length,
      pages: [],
    };

    // Batch download up to 3 pages concurrently
    const BATCH_SIZE = 3;
    for (let i = 0; i < pages.length; i += BATCH_SIZE) {
      const batch = pages.slice(i, i + BATCH_SIZE);

      // Resolve image URLs in parallel
      const resolvedUrls = await Promise.all(
        batch.map(async (page) => {
          let imageUrl = page.imageUrl;
          if (!imageUrl && page.url) {
            try {
              imageUrl = await ExtensionBridge.getImageUrl(sourceId, page.index, page.url);
            } catch (e) {
              Logger.warn(MODULE, `Failed to resolve image URL for page ${page.index}:`, e);
              throw new Error(`Failed to resolve page ${page.index}`);
            }
          }
          return { page, imageUrl };
        }),
      );

      // Download images in parallel
      await Promise.all(
        resolvedUrls.map(async ({ page, imageUrl }) => {
          if (!imageUrl) {
            throw new Error(`No image URL for page ${page.index}`);
          }

          const filename = `${page.index}.jpg`;
          const filepath = pagePath(mangaId, chapterId, page.index);

          try {
            Logger.debug(MODULE, `Downloading page ${page.index}/${pages.length} to ${filename}`);
            // Use extension's OkHttp client (via ExtensionBridge) to download with proper headers
            await ExtensionBridge.downloadPage(sourceId, imageUrl, filepath);
          } catch (e) {
            Logger.error(MODULE, `Failed to download page ${page.index}:`, e);
            throw e;
          }
        }),
      );

      // Update progress after each batch
      const progress = Math.min((i + batch.length) / pages.length, 1);
      useDownloadStore.getState().updateProgress(chapterId, progress);
      await updateDownloadProgress(chapterId, progress, 1); // 1 = downloading

      Logger.debug(MODULE, `Progress: ${Math.round(progress * 100)}%`);
    }

    // Step 5: Write pages.json (completion sentinel)
    Logger.debug(MODULE, `Writing pages.json for chapter ${chapterId}`);
    pageIndex.pages = pages.map((p) => ({
      index: p.index,
      filename: `${p.index}.jpg`,
      url: p.url,
    }));
    Logger.debug(MODULE, `pages.json content: ${JSON.stringify(pageIndex)}`);
    await FileSystem.writeAsStringAsync(indexPath(mangaId, chapterId), JSON.stringify(pageIndex));

    // Step 6: Mark as complete in DB
    Logger.debug(MODULE, `Marking chapter ${chapterId} as complete`);
    await markDownloadComplete(chapterId);

    // Step 7: Update store
    useDownloadStore.getState().updateStatus(chapterId, 'completed');

    Logger.info(MODULE, `✓ Downloaded chapter ${chapterId}`);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    Logger.error(MODULE, `✗ Failed to download chapter ${chapterId}:`, errorMessage);

    // Mark as error in DB and store
    await markDownloadError(chapterId, errorMessage);
    useDownloadStore.getState().updateStatus(chapterId, 'error', errorMessage);
  }
}
