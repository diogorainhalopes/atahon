import * as FileSystem from 'expo-file-system/legacy';
import { db } from '@db/client';
import {
  manga,
  chapter,
  history,
  category,
  mangaCategory,
  extensionRepo,
} from '@db/schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BackupData {
  version: number;
  exportedAt: string;
  manga: typeof manga.$inferSelect[];
  chapter: typeof chapter.$inferSelect[];
  history: typeof history.$inferSelect[];
  category: typeof category.$inferSelect[];
  mangaCategory: typeof mangaCategory.$inferSelect[];
  extensionRepo: typeof extensionRepo.$inferSelect[];
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportBackup(): Promise<string> {
  const [
    mangaRows,
    chapterRows,
    historyRows,
    categoryRows,
    mangaCategoryRows,
    extensionRepoRows,
  ] = await Promise.all([
    db.select().from(manga),
    db.select().from(chapter),
    db.select().from(history),
    db.select().from(category),
    db.select().from(mangaCategory),
    db.select().from(extensionRepo),
  ]);

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    manga: mangaRows,
    chapter: chapterRows,
    history: historyRows,
    category: categoryRows,
    mangaCategory: mangaCategoryRows,
    extensionRepo: extensionRepoRows,
  };

  const dateStr = new Date().toISOString().split('T')[0];
  const uri = `${FileSystem.documentDirectory}atahon-backup-${dateStr}.json`;

  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return uri;
}

// ─── Import ───────────────────────────────────────────────────────────────────

export async function importBackup(uri: string): Promise<void> {
  const content = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const backup: BackupData = JSON.parse(content);

  // Import in dependency order: categories and extension repos first,
  // then manga, then chapters, then history and manga_category.

  if (backup.category?.length) {
    await db
      .insert(category)
      .values(backup.category)
      .onConflictDoUpdate({
        target: [category.id],
        set: {
          name: category.name,
          order: category.order,
          flags: category.flags,
        },
      });
  }

  if (backup.extensionRepo?.length) {
    await db
      .insert(extensionRepo)
      .values(backup.extensionRepo)
      .onConflictDoUpdate({
        target: [extensionRepo.url],
        set: {
          name: extensionRepo.name,
          enabled: extensionRepo.enabled,
          lastFetchedAt: extensionRepo.lastFetchedAt,
        },
      });
  }

  if (backup.manga?.length) {
    await db
      .insert(manga)
      .values(backup.manga)
      .onConflictDoUpdate({
        target: [manga.sourceId, manga.sourceUrl],
        set: {
          title: manga.title,
          author: manga.author,
          artist: manga.artist,
          description: manga.description,
          status: manga.status,
          thumbnailUrl: manga.thumbnailUrl,
          genre: manga.genre,
          inLibrary: manga.inLibrary,
          libraryAddedAt: manga.libraryAddedAt,
          lastUpdatedAt: manga.lastUpdatedAt,
          initialized: manga.initialized,
          smartDownloads: manga.smartDownloads,
          lastReadChapterId: manga.lastReadChapterId,
          lastReadPage: manga.lastReadPage,
          updatedAt: manga.updatedAt,
        },
      });
  }

  if (backup.chapter?.length) {
    const BATCH_SIZE = 50;
    for (let i = 0; i < backup.chapter.length; i += BATCH_SIZE) {
      const batch = backup.chapter.slice(i, i + BATCH_SIZE);
      await db
        .insert(chapter)
        .values(batch)
        .onConflictDoUpdate({
          target: [chapter.mangaId, chapter.sourceUrl],
          set: {
            name: chapter.name,
            chapterNumber: chapter.chapterNumber,
            volumeNumber: chapter.volumeNumber,
            scanlator: chapter.scanlator,
            uploadDate: chapter.uploadDate,
            read: chapter.read,
            lastPageRead: chapter.lastPageRead,
            bookmark: chapter.bookmark,
            downloadStatus: chapter.downloadStatus,
            downloadedAt: chapter.downloadedAt,
          },
        });
    }
  }

  if (backup.history?.length) {
    await db
      .insert(history)
      .values(backup.history)
      .onConflictDoUpdate({
        target: [history.mangaId],
        set: {
          chapterId: history.chapterId,
          readAt: history.readAt,
          readDuration: history.readDuration,
        },
      });
  }

  if (backup.mangaCategory?.length) {
    await db
      .insert(mangaCategory)
      .values(backup.mangaCategory)
      .onConflictDoNothing();
  }
}
