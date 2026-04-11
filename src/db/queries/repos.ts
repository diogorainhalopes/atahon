import { eq } from 'drizzle-orm';
import { db } from '@db/client';
import { extensionRepo, type ExtensionRepo } from '@db/schema';

export async function getAllRepos(): Promise<ExtensionRepo[]> {
  return db.select().from(extensionRepo).orderBy(extensionRepo.createdAt);
}

export async function getEnabledRepos(): Promise<ExtensionRepo[]> {
  return db.select().from(extensionRepo).where(eq(extensionRepo.enabled, true));
}

export async function addRepo(url: string, name: string): Promise<ExtensionRepo> {
  try {
    const rows = await db
      .insert(extensionRepo)
      .values({ url, name })
      .returning();
    return rows[0];
  } catch (error) {
    // Handle duplicate URL constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new Error('This repository URL is already in your list.');
    }
    throw error;
  }
}

export async function removeRepo(id: number): Promise<void> {
  await db.delete(extensionRepo).where(eq(extensionRepo.id, id));
}

export async function toggleRepo(id: number, enabled: boolean): Promise<void> {
  await db
    .update(extensionRepo)
    .set({ enabled })
    .where(eq(extensionRepo.id, id));
}

export async function touchRepoFetchedAt(id: number): Promise<void> {
  await db
    .update(extensionRepo)
    .set({ lastFetchedAt: Math.floor(Date.now() / 1000) })
    .where(eq(extensionRepo.id, id));
}
