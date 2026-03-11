import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

// ─── Manga ────────────────────────────────────────────────────────────────────

export const manga = sqliteTable('manga', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceId: text('source_id').notNull(),
  sourceUrl: text('source_url').notNull(),
  title: text('title').notNull(),
  author: text('author'),
  artist: text('artist'),
  description: text('description'),
  status: integer('status').notNull().default(0), // 0=unknown,1=ongoing,2=completed,3=licensed,4=hiatus,5=cancelled
  thumbnailUrl: text('thumbnail_url'),
  genre: text('genre'), // JSON array string
  inLibrary: integer('in_library', { mode: 'boolean' }).notNull().default(false),
  libraryAddedAt: integer('library_added_at'), // unix timestamp
  lastUpdatedAt: integer('last_updated_at'),
  initialized: integer('initialized', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

// ─── Chapter ──────────────────────────────────────────────────────────────────

export const chapter = sqliteTable(
  'chapter',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    mangaId: integer('manga_id')
      .notNull()
      .references(() => manga.id, { onDelete: 'cascade' }),
    sourceUrl: text('source_url').notNull(),
    name: text('name').notNull(),
    chapterNumber: real('chapter_number'),
    volumeNumber: real('volume_number'),
    scanlator: text('scanlator'),
    uploadDate: integer('upload_date'), // unix timestamp
    read: integer('read', { mode: 'boolean' }).notNull().default(false),
    lastPageRead: integer('last_page_read').notNull().default(0),
    bookmark: integer('bookmark', { mode: 'boolean' }).notNull().default(false),
    downloadStatus: integer('download_status').notNull().default(0), // 0=none,1=queued,2=downloading,3=done,4=error
    downloadedAt: integer('downloaded_at'),
    createdAt: integer('created_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (t) => ({
    uniqueChapter: uniqueIndex('unique_chapter').on(t.mangaId, t.sourceUrl),
  }),
);

// ─── History ──────────────────────────────────────────────────────────────────

export const history = sqliteTable('history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  chapterId: integer('chapter_id')
    .notNull()
    .references(() => chapter.id, { onDelete: 'cascade' }),
  mangaId: integer('manga_id')
    .notNull()
    .references(() => manga.id, { onDelete: 'cascade' }),
  readAt: integer('read_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  readDuration: integer('read_duration').notNull().default(0), // seconds
});

// ─── Category ─────────────────────────────────────────────────────────────────

export const category = sqliteTable('category', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  order: integer('order').notNull().default(0),
  flags: integer('flags').notNull().default(0),
  createdAt: integer('created_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

// ─── Manga ↔ Category ─────────────────────────────────────────────────────────

export const mangaCategory = sqliteTable(
  'manga_category',
  {
    mangaId: integer('manga_id')
      .notNull()
      .references(() => manga.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => category.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: uniqueIndex('manga_category_pk').on(t.mangaId, t.categoryId),
  }),
);

// ─── Download Queue ───────────────────────────────────────────────────────────

export const downloadQueue = sqliteTable('download_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  chapterId: integer('chapter_id')
    .notNull()
    .references(() => chapter.id, { onDelete: 'cascade' }),
  mangaId: integer('manga_id')
    .notNull()
    .references(() => manga.id, { onDelete: 'cascade' }),
  priority: integer('priority').notNull().default(0),
  status: integer('status').notNull().default(0), // 0=queued,1=downloading,2=paused,3=error
  progress: real('progress').notNull().default(0), // 0.0–1.0
  error: text('error'),
  addedAt: integer('added_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

// ─── Extension Repo ───────────────────────────────────────────────────────────

export const extensionRepo = sqliteTable('extension_repo', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  url: text('url').notNull().unique(),
  name: text('name').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  lastFetchedAt: integer('last_fetched_at'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type Manga = typeof manga.$inferSelect;
export type NewManga = typeof manga.$inferInsert;
export type Chapter = typeof chapter.$inferSelect;
export type NewChapter = typeof chapter.$inferInsert;
export type History = typeof history.$inferSelect;
export type Category = typeof category.$inferSelect;
export type DownloadQueue = typeof downloadQueue.$inferSelect;
export type ExtensionRepo = typeof extensionRepo.$inferSelect;
