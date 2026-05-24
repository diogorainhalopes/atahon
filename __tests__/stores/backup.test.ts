/**
 * Unit tests for src/utils/backup.ts
 *
 * Mocks expo-file-system and the Drizzle db to verify:
 *  1. exportBackup() produces valid JSON with the expected table keys
 *  2. importBackup() calls the correct db upsert operations for each table
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockWriteAsStringAsync = jest.fn().mockResolvedValue(undefined);
const mockReadAsStringAsync = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///data/user/0/com.atahon/files/',
  writeAsStringAsync: (...args: unknown[]) => mockWriteAsStringAsync(...args),
  readAsStringAsync: (...args: unknown[]) => mockReadAsStringAsync(...args),
  EncodingType: { UTF8: 'utf8' },
}));

// Drizzle fluent builder mock
// Each call chain ends in a jest.fn() that returns a resolved Promise.
const mockSelect = jest.fn();
const mockInsert = jest.fn();

jest.mock('@db/client', () => ({
  db: {
    select: () => mockSelect(),
    insert: (table: unknown) => mockInsert(table),
  },
}));

// Schema mock — each table is a plain object so that imports resolve.
jest.mock('@db/schema', () => ({
  manga: { sourceId: 'sourceId', sourceUrl: 'sourceUrl' },
  chapter: { mangaId: 'mangaId', sourceUrl: 'sourceUrl' },
  history: { mangaId: 'mangaId', chapterId: 'chapterId', readAt: 'readAt', readDuration: 'readDuration' },
  category: { id: 'id', name: 'name', order: 'order', flags: 'flags' },
  mangaCategory: { mangaId: 'mangaId', categoryId: 'categoryId' },
  extensionRepo: { url: 'url', name: 'name', enabled: 'enabled', lastFetchedAt: 'lastFetchedAt' },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSelectChain(rows: unknown[]) {
  return {
    from: jest.fn().mockReturnValue(Promise.resolve(rows)),
  };
}

function buildInsertChain() {
  const chain = {
    values: jest.fn(),
    onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
    onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
  };
  chain.values.mockReturnValue(chain);
  return chain;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('exportBackup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes a JSON file containing all six table keys', async () => {
    // Make every db.select() return an empty array for simplicity.
    mockSelect.mockImplementation(() => buildSelectChain([]));

    const { exportBackup } = require('@utils/backup');
    const uri = await exportBackup();

    // File should have been written once.
    expect(mockWriteAsStringAsync).toHaveBeenCalledTimes(1);

    const [writtenUri, writtenContent] = mockWriteAsStringAsync.mock.calls[0];

    // URI must start with the mocked documentDirectory and contain the date.
    expect(writtenUri).toMatch(/^file:\/\/\/data\/user\/0\/com\.atahon\/files\/atahon-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(uri).toBe(writtenUri);

    // Parse the content and check keys.
    const parsed = JSON.parse(writtenContent);
    expect(parsed).toHaveProperty('version', 1);
    expect(parsed).toHaveProperty('exportedAt');
    expect(parsed).toHaveProperty('manga');
    expect(parsed).toHaveProperty('chapter');
    expect(parsed).toHaveProperty('history');
    expect(parsed).toHaveProperty('category');
    expect(parsed).toHaveProperty('mangaCategory');
    expect(parsed).toHaveProperty('extensionRepo');
  });

  it('serialises actual rows into the JSON output', async () => {
    const fakeManga = [{ id: 1, title: 'Test Manga', sourceId: 'src', sourceUrl: '/manga/1' }];
    mockSelect
      .mockImplementationOnce(() => buildSelectChain(fakeManga)) // manga
      .mockImplementation(() => buildSelectChain([]));            // rest

    const { exportBackup } = require('@utils/backup');
    await exportBackup();

    const writtenContent = mockWriteAsStringAsync.mock.calls[0][1];
    const parsed = JSON.parse(writtenContent);
    expect(parsed.manga).toEqual(fakeManga);
  });
});

describe('importBackup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeBackup(overrides: Record<string, unknown[]> = {}) {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      manga: [{ id: 1, title: 'Manga 1', sourceId: 'src', sourceUrl: '/m/1' }],
      chapter: [{ id: 1, mangaId: 1, sourceUrl: '/ch/1', name: 'Ch 1' }],
      history: [{ id: 1, mangaId: 1, chapterId: 1, readAt: 1000, readDuration: 60 }],
      category: [{ id: 1, name: 'Favourites', order: 0, flags: 0 }],
      mangaCategory: [{ mangaId: 1, categoryId: 1 }],
      extensionRepo: [{ id: 1, url: 'https://repo.example.com', name: 'Test Repo', enabled: true }],
      ...overrides,
    });
  }

  it('calls onConflictDoUpdate for manga, chapter, history, category, extensionRepo', async () => {
    mockReadAsStringAsync.mockResolvedValue(makeBackup());

    const insertChain = buildInsertChain();
    mockInsert.mockReturnValue(insertChain);

    const { importBackup } = require('@utils/backup');
    await importBackup('file:///some/backup.json');

    // Five tables use onConflictDoUpdate, one uses onConflictDoNothing.
    expect(insertChain.onConflictDoUpdate).toHaveBeenCalledTimes(5);
    expect(insertChain.onConflictDoNothing).toHaveBeenCalledTimes(1);
  });

  it('calls onConflictDoNothing for mangaCategory', async () => {
    mockReadAsStringAsync.mockResolvedValue(makeBackup());

    const insertChain = buildInsertChain();
    mockInsert.mockReturnValue(insertChain);

    const { importBackup } = require('@utils/backup');
    await importBackup('file:///some/backup.json');

    // Last call to insert().values() should be for mangaCategory.
    // onConflictDoNothing must be called at least once.
    expect(insertChain.onConflictDoNothing).toHaveBeenCalled();
  });

  it('skips tables with empty arrays gracefully', async () => {
    mockReadAsStringAsync.mockResolvedValue(
      makeBackup({ manga: [], chapter: [], history: [], category: [], mangaCategory: [], extensionRepo: [] }),
    );

    mockInsert.mockReturnValue(buildInsertChain());

    const { importBackup } = require('@utils/backup');
    // Should not throw.
    await expect(importBackup('file:///some/backup.json')).resolves.toBeUndefined();

    // No inserts should happen for empty arrays.
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('reads the file from the provided URI', async () => {
    const backupJson = makeBackup({ manga: [], chapter: [], history: [], category: [], mangaCategory: [], extensionRepo: [] });
    mockReadAsStringAsync.mockResolvedValue(backupJson);
    mockInsert.mockReturnValue(buildInsertChain());

    const { importBackup } = require('@utils/backup');
    await importBackup('file:///documents/mybackup.json');

    expect(mockReadAsStringAsync).toHaveBeenCalledWith(
      'file:///documents/mybackup.json',
      expect.objectContaining({ encoding: 'utf8' }),
    );
  });
});
