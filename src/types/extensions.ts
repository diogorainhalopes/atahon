// Extension API contracts — mirrors tachiyomi-extensions-interface
// Reference: .tmp/app/src/main/java/eu/kanade/tachiyomi/source/

export interface SManga {
  url: string;
  title: string;
  artist?: string;
  author?: string;
  description?: string;
  genre?: string; // comma-separated
  status: MangaStatus;
  thumbnail_url?: string;
  initialized: boolean;
}

export enum MangaStatus {
  UNKNOWN = 0,
  ONGOING = 1,
  COMPLETED = 2,
  LICENSED = 3,
  PUBLISHING_FINISHED = 4,
  CANCELLED = 5,
  ON_HIATUS = 6,
}

export interface SChapter {
  url: string;
  name: string;
  date_upload: number; // unix timestamp ms
  chapter_number: number; // -1 if not applicable
  scanlator?: string;
  volume_number?: number;
}

export interface Page {
  index: number;
  url?: string;
  imageUrl?: string;
}

export interface MangasPage {
  mangas: SManga[];
  hasNextPage: boolean;
}

export interface FilterList {
  filters: Filter[];
}

export type FilterType = 'header' | 'separator' | 'text' | 'checkbox' | 'tristate' | 'select' | 'group' | 'sort';

export interface Filter {
  type: FilterType;
  name: string;
  state?: unknown;
}

// Source metadata exposed by the native bridge
export interface SourceInfo {
  id: string; // Long as string to avoid JS precision issues
  name: string;
  lang: string;
  iconUrl?: string;
  supportsLatest: boolean;
  isNsfw: boolean;
  versionId: number;
}

// Extension (APK) metadata
export interface ExtensionInfo {
  pkgName: string;
  name: string;
  versionName: string;
  versionCode: number;
  lang: string;
  isNsfw: boolean;
  sources: SourceInfo[];
  iconUrl?: string;
  installed: boolean;
  hasUpdate?: boolean;
  repoUrl: string;
  apkUrl: string;
}

// Index entry from keiyoushi repo
export interface ExtensionIndexEntry {
  name: string;
  pkg: string;
  apk: string;
  lang: string;
  code: number;
  version: string;
  nsfw: number; // 0 or 1
  sources: Array<{
    id: string;
    lang: string;
    name: string;
    baseUrl: string;
  }>;
}
