import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';
import { migrationStatements } from './migrations/migrations';

const expo = openDatabaseSync('atahon.db', { enableChangeListener: true });

export const db = drizzle(expo, { schema });

// Run migrations synchronously on startup
export function runMigrations(): void {
  expo.execSync('PRAGMA journal_mode = WAL;');
  expo.execSync('PRAGMA foreign_keys = ON;');

  // Track applied migrations
  expo.execSync(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );
  `);

  const applied = expo.getAllSync<{ hash: string }>(
    'SELECT hash FROM __drizzle_migrations',
  );
  const appliedSet = new Set(applied.map((r) => r.hash));

  for (const [tag, sql] of Object.entries(migrationStatements).sort(([a], [b]) => a.localeCompare(b))) {
    if (!appliedSet.has(tag)) {
      try {
        expo.execSync(sql);
      } catch (e) {
        // Schema mismatch from a stale dev database — drop everything and retry fresh
        expo.execSync(`
          PRAGMA foreign_keys = OFF;
          DROP TABLE IF EXISTS download_queue;
          DROP TABLE IF EXISTS manga_category;
          DROP TABLE IF EXISTS history;
          DROP TABLE IF EXISTS chapter;
          DROP TABLE IF EXISTS manga;
          DROP TABLE IF EXISTS category;
          DROP TABLE IF EXISTS extension_repo;
          DROP TABLE IF EXISTS __drizzle_migrations;
          PRAGMA foreign_keys = ON;
        `);
        expo.execSync(`
          CREATE TABLE IF NOT EXISTS __drizzle_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hash TEXT NOT NULL UNIQUE,
            created_at INTEGER NOT NULL
          );
        `);
        expo.execSync(sql);
      }
      expo.runSync('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)', [
        tag,
        Date.now(),
      ]);
    }
  }

}
