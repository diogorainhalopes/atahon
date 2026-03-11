import { requireNativeModule } from 'expo-modules-core';
import type {
  SourceInfo,
  SManga,
  SChapter,
  Page,
  MangasPage,
  FilterList,
} from '../../../src/types/extensions';

// The native Kotlin module — loaded from the Android classloader
// Full implementation in Phase 1
let NativeExtensionBridge: ExtensionBridgeNativeModule | null = null;

try {
  NativeExtensionBridge = requireNativeModule('ExtensionBridge');
} catch {
  // Native module not yet loaded (e.g. running in Expo Go or web)
  console.warn('[ExtensionBridge] Native module not available — using stub');
}

export interface ExtensionBridgeNativeModule {
  getInstalledSources(): Promise<SourceInfo[]>;
  callSource(sourceId: string, method: string, params: Record<string, unknown>): Promise<string>;
  installExtension(apkUrl: string, pkgName: string): Promise<void>;
  uninstallExtension(pkgName: string): Promise<void>;
}

// High-level typed wrapper
class ExtensionBridgeAPI {
  private native(): ExtensionBridgeNativeModule {
    if (!NativeExtensionBridge) {
      throw new Error('ExtensionBridge native module is not available');
    }
    return NativeExtensionBridge;
  }

  async getInstalledSources(): Promise<SourceInfo[]> {
    return this.native().getInstalledSources();
  }

  async installExtension(apkUrl: string, pkgName: string): Promise<void> {
    return this.native().installExtension(apkUrl, pkgName);
  }

  async uninstallExtension(pkgName: string): Promise<void> {
    return this.native().uninstallExtension(pkgName);
  }

  private async call<T>(sourceId: string, method: string, params: Record<string, unknown> = {}): Promise<T> {
    const json = await this.native().callSource(sourceId, method, params);
    return JSON.parse(json) as T;
  }

  async getPopularManga(sourceId: string, page: number): Promise<MangasPage> {
    return this.call(sourceId, 'getPopularManga', { page });
  }

  async getLatestUpdates(sourceId: string, page: number): Promise<MangasPage> {
    return this.call(sourceId, 'getLatestUpdates', { page });
  }

  async searchManga(
    sourceId: string,
    page: number,
    query: string,
    filters: FilterList,
  ): Promise<MangasPage> {
    return this.call(sourceId, 'searchManga', { page, query, filters });
  }

  async getMangaDetails(sourceId: string, mangaUrl: string): Promise<SManga> {
    return this.call(sourceId, 'getMangaDetails', { url: mangaUrl });
  }

  async getChapterList(sourceId: string, mangaUrl: string): Promise<SChapter[]> {
    return this.call(sourceId, 'getChapterList', { url: mangaUrl });
  }

  async getPageList(sourceId: string, chapterUrl: string): Promise<Page[]> {
    return this.call(sourceId, 'getPageList', { url: chapterUrl });
  }

  async getImageUrl(sourceId: string, pageIndex: number, pageUrl: string): Promise<string> {
    return this.call(sourceId, 'getImageUrl', { index: pageIndex, url: pageUrl });
  }
}

export const ExtensionBridge = new ExtensionBridgeAPI();
export default ExtensionBridge;
