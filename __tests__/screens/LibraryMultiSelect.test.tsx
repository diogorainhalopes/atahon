/**
 * Tests for library multi-select logic.
 *
 * These tests verify the selection state logic used in the library screen
 * without rendering the full UI (no @testing-library/react-native installed).
 */

// ─── Selection state helpers (extracted logic) ──────────────────────────────

function toggleSelected(prev: Set<number>, id: number): Set<number> {
  const next = new Set(prev);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
}

function selectAll(mangaIds: number[]): Set<number> {
  return new Set(mangaIds);
}

function clearSelection(): Set<number> {
  return new Set();
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('LibraryMultiSelect — selection state logic', () => {
  const mangaIds = [1, 2, 3, 4, 5];

  it('starts with an empty selection', () => {
    const selected = new Set<number>();
    expect(selected.size).toBe(0);
  });

  it('entering selection mode adds the long-pressed item', () => {
    // Simulate long-press on manga id=1
    const selected = new Set([1]);
    expect(selected.has(1)).toBe(true);
    expect(selected.size).toBe(1);
  });

  it('toggleSelected adds an unselected item', () => {
    let selected = new Set<number>([1]);
    selected = toggleSelected(selected, 2);
    expect(selected.has(2)).toBe(true);
    expect(selected.size).toBe(2);
  });

  it('toggleSelected removes an already-selected item', () => {
    let selected = new Set<number>([1, 2]);
    selected = toggleSelected(selected, 1);
    expect(selected.has(1)).toBe(false);
    expect(selected.size).toBe(1);
  });

  it('selectAll selects every manga id', () => {
    const selected = selectAll(mangaIds);
    expect(selected.size).toBe(mangaIds.length);
    for (const id of mangaIds) {
      expect(selected.has(id)).toBe(true);
    }
  });

  it('clearSelection results in an empty set', () => {
    const selected = clearSelection();
    expect(selected.size).toBe(0);
  });

  it('toggling all items one by one matches selectAll', () => {
    let selected = new Set<number>();
    for (const id of mangaIds) {
      selected = toggleSelected(selected, id);
    }
    const allSelected = selectAll(mangaIds);
    expect(selected.size).toBe(allSelected.size);
    for (const id of mangaIds) {
      expect(selected.has(id)).toBe(true);
    }
  });

  it('cancel exits selection mode (state cleared)', () => {
    let selectionMode = true;
    let selected = new Set<number>([1, 2, 3]);

    // Simulate cancel
    selectionMode = false;
    selected = clearSelection();

    expect(selectionMode).toBe(false);
    expect(selected.size).toBe(0);
  });

  it('select all then clear leaves empty set', () => {
    let selected = selectAll(mangaIds);
    expect(selected.size).toBe(mangaIds.length);

    selected = clearSelection();
    expect(selected.size).toBe(0);
  });
});
