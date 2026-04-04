import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@db/client';
import { category, mangaCategory, manga, type Manga, type Category } from '@db/schema';

export async function getAllCategories(): Promise<Category[]> {
  return db
    .select()
    .from(category)
    .orderBy(asc(category.order), asc(category.createdAt));
}

export async function createCategory(name: string): Promise<Category> {
  const result = await db
    .insert(category)
    .values({
      name,
      order: 0,
      flags: 0,
    })
    .returning();
  return result[0];
}

export async function deleteCategory(id: number): Promise<void> {
  await db.delete(category).where(eq(category.id, id));
}

export async function getMangaCountsForCategories(
  categoryIds: number[],
): Promise<Record<number, number>> {
  if (categoryIds.length === 0) return {};

  const rows = await db
    .select({
      categoryId: mangaCategory.categoryId,
      count: sql<number>`count(*)`,
    })
    .from(mangaCategory)
    .where(inArray(mangaCategory.categoryId, categoryIds))
    .groupBy(mangaCategory.categoryId);

  const result: Record<number, number> = {};
  for (const row of rows) {
    result[row.categoryId] = row.count;
  }
  return result;
}

export async function getMangaInCategory(categoryId: number): Promise<Manga[]> {
  return db
    .select()
    .from(manga)
    .innerJoin(mangaCategory, eq(mangaCategory.mangaId, manga.id))
    .where(eq(mangaCategory.categoryId, categoryId))
    .orderBy(asc(manga.title))
    .then((rows) => rows.map((r) => r.manga));
}

export async function getCategoryIdsForManga(mangaId: number): Promise<number[]> {
  const rows = await db
    .select({ categoryId: mangaCategory.categoryId })
    .from(mangaCategory)
    .where(eq(mangaCategory.mangaId, mangaId));
  return rows.map((r) => r.categoryId);
}

export async function getBucketPreviewThumbnails(
  categoryIds: number[],
): Promise<Record<number, string[]>> {
  if (categoryIds.length === 0) return {};

  const rows = await db
    .select({
      categoryId: mangaCategory.categoryId,
      thumbnailUrl: manga.thumbnailUrl,
    })
    .from(mangaCategory)
    .innerJoin(manga, eq(manga.id, mangaCategory.mangaId))
    .where(inArray(mangaCategory.categoryId, categoryIds))
    .orderBy(asc(mangaCategory.categoryId), asc(manga.title));

  const result: Record<number, string[]> = {};
  for (const row of rows) {
    if (!row.thumbnailUrl) continue;
    if (!result[row.categoryId]) result[row.categoryId] = [];
    if (result[row.categoryId].length < 4) {
      result[row.categoryId].push(row.thumbnailUrl);
    }
  }
  return result;
}

export async function addMangaToCategory(
  mangaId: number,
  categoryId: number,
): Promise<void> {
  await db
    .insert(mangaCategory)
    .values({ mangaId, categoryId })
    .onConflictDoNothing();
}

export async function removeMangaFromCategory(
  mangaId: number,
  categoryId: number,
): Promise<void> {
  await db
    .delete(mangaCategory)
    .where(and(eq(mangaCategory.mangaId, mangaId), eq(mangaCategory.categoryId, categoryId)));
}
