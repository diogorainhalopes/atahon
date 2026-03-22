import { type MigrationConfig } from 'drizzle-orm/migrator';

// Inline migrations — avoids filesystem reads at runtime on Android
// Generated from: drizzle-kit generate
const migrations: MigrationConfig = {
  migrationsFolder: './drizzle',
  // Inline journal for bundled execution
};

export const migrationJournal = {
  version: '7',
  dialect: 'sqlite',
  entries: [
    {
      idx: 0,
      version: '7',
      when: 1700000000000,
      tag: '0000_init',
      breakpoints: true,
    },
    {
      idx: 1,
      version: '7',
      when: 1700000001000,
      tag: '0001_smart_downloads',
      breakpoints: true,
    },
    {
      idx: 2,
      version: '7',
      when: 1700000002000,
      tag: '0002_repo_url_full',
      breakpoints: true,
    },
  ],
};

export const migrationStatements = {
  '0000_init': `
    CREATE TABLE IF NOT EXISTS \`manga\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`source_id\` text NOT NULL,
      \`source_url\` text NOT NULL,
      \`title\` text NOT NULL,
      \`author\` text,
      \`artist\` text,
      \`description\` text,
      \`status\` integer DEFAULT 0 NOT NULL,
      \`thumbnail_url\` text,
      \`genre\` text,
      \`in_library\` integer DEFAULT false NOT NULL,
      \`library_added_at\` integer,
      \`last_updated_at\` integer,
      \`initialized\` integer DEFAULT false NOT NULL,
      \`created_at\` integer NOT NULL,
      \`updated_at\` integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS \`chapter\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`manga_id\` integer NOT NULL,
      \`source_url\` text NOT NULL,
      \`name\` text NOT NULL,
      \`chapter_number\` real,
      \`volume_number\` real,
      \`scanlator\` text,
      \`upload_date\` integer,
      \`read\` integer DEFAULT false NOT NULL,
      \`last_page_read\` integer DEFAULT 0 NOT NULL,
      \`bookmark\` integer DEFAULT false NOT NULL,
      \`download_status\` integer DEFAULT 0 NOT NULL,
      \`downloaded_at\` integer,
      \`created_at\` integer NOT NULL,
      FOREIGN KEY (\`manga_id\`) REFERENCES \`manga\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
    CREATE UNIQUE INDEX IF NOT EXISTS \`unique_chapter\` ON \`chapter\` (\`manga_id\`,\`source_url\`);

    CREATE TABLE IF NOT EXISTS \`history\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`chapter_id\` integer NOT NULL,
      \`manga_id\` integer NOT NULL,
      \`read_at\` integer NOT NULL,
      \`read_duration\` integer DEFAULT 0 NOT NULL,
      FOREIGN KEY (\`chapter_id\`) REFERENCES \`chapter\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`manga_id\`) REFERENCES \`manga\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );

    CREATE TABLE IF NOT EXISTS \`category\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`name\` text NOT NULL,
      \`order\` integer DEFAULT 0 NOT NULL,
      \`flags\` integer DEFAULT 0 NOT NULL,
      \`created_at\` integer NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS \`category_name_unique\` ON \`category\` (\`name\`);

    CREATE TABLE IF NOT EXISTS \`manga_category\` (
      \`manga_id\` integer NOT NULL,
      \`category_id\` integer NOT NULL,
      FOREIGN KEY (\`manga_id\`) REFERENCES \`manga\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`category_id\`) REFERENCES \`category\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
    CREATE UNIQUE INDEX IF NOT EXISTS \`manga_category_pk\` ON \`manga_category\` (\`manga_id\`,\`category_id\`);

    CREATE TABLE IF NOT EXISTS \`download_queue\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`chapter_id\` integer NOT NULL,
      \`manga_id\` integer NOT NULL,
      \`priority\` integer DEFAULT 0 NOT NULL,
      \`status\` integer DEFAULT 0 NOT NULL,
      \`progress\` real DEFAULT 0 NOT NULL,
      \`error\` text,
      \`added_at\` integer NOT NULL,
      FOREIGN KEY (\`chapter_id\`) REFERENCES \`chapter\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`manga_id\`) REFERENCES \`manga\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );

    CREATE TABLE IF NOT EXISTS \`extension_repo\` (
      \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      \`url\` text NOT NULL,
      \`name\` text NOT NULL,
      \`enabled\` integer DEFAULT true NOT NULL,
      \`last_fetched_at\` integer,
      \`created_at\` integer NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS \`extension_repo_url_unique\` ON \`extension_repo\` (\`url\`);
  `,
  '0001_smart_downloads': `
    ALTER TABLE manga ADD COLUMN smart_downloads INTEGER DEFAULT 0 NOT NULL;
  `,
  '0002_repo_url_full': `
    UPDATE extension_repo SET url = url || '/index.min.json' WHERE url NOT LIKE '%/index.min.json';
  `,
};

export default migrations;
