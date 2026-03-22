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
let NativeExtensionBridge: ExtensionBridgeNativeModule | null = null;

try {
  NativeExtensionBridge = requireNativeModule('ExtensionBridge');
} catch {
  console.warn('[ExtensionBridge] Native module not available — using stub');
}

export interface InstalledExtensionInfo {
  pkgName: string;
  name: string;
  versionName: string;
  versionCode: number;
  lang: string;
  isNsfw: boolean;
  sources: SourceInfo[];
}

export interface ExtensionBridgeNativeModule {
  loadInstalledExtensions(): Promise<InstalledExtensionInfo[]>;
  getInstalledExtensions(): Promise<InstalledExtensionInfo[]>;
  getInstalledSources(): Promise<SourceInfo[]>;
  installExtension(apkUrl: string, pkgName: string): Promise<InstalledExtensionInfo>;
  uninstallExtension(pkgName: string): Promise<void>;
  callSource(sourceId: string, method: string, params: Record<string, unknown>): Promise<string>;
}

// High-level typed wrapper
class ExtensionBridgeAPI {
  private native(): ExtensionBridgeNativeModule {
    if (!NativeExtensionBridge) {
      throw new Error('ExtensionBridge native module is not available');
    }
    return NativeExtensionBridge;
  }

  async loadInstalledExtensions(): Promise<InstalledExtensionInfo[]> {
    return this.native().loadInstalledExtensions();
  }

  async getInstalledExtensions(): Promise<InstalledExtensionInfo[]> {
    return this.native().getInstalledExtensions();
  }

  async getInstalledSources(): Promise<SourceInfo[]> {
    return this.native().getInstalledSources();
  }

  async installExtension(apkUrl: string, pkgName: string): Promise<InstalledExtensionInfo> {
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
    return this.call(sourceId, 'getMangaDetails', { mangaUrl })
  }

  async getChapterList(sourceId: string, mangaUrl: string): Promise<SChapter[]> {
    return this.call(sourceId, 'getChapterList', { mangaUrl });
  }

  async getPageList(sourceId: string, chapterUrl: string): Promise<Page[]> {
    return this.call(sourceId, 'getPageList', { chapterUrl });
  }

  async getImageUrl(sourceId: string, pageIndex: number, pageUrl: string): Promise<string> {
    return this.call(sourceId, 'getImageUrl', { pageIndex, pageUrl });
  }

  async downloadPage(
    sourceId: string,
    imageUrl: string,
    destPath: string,
    quality?: number,
    maxWidth?: number,
  ): Promise<void> {
    await this.call(sourceId, 'downloadPage', { imageUrl, destPath, quality, maxWidth });
  }
}

export const ExtensionBridge = new ExtensionBridgeAPI();
export default ExtensionBridge;
