export type PageLoadState = 'queue' | 'loading' | 'ready' | 'error';

export interface ReaderPage {
  index: number;
  url?: string;
  imageUrl?: string;
  state: PageLoadState;
  error?: string;
}

export interface ReaderChapter {
  id: number;
  mangaId: number;
  sourceId: string;
  sourceUrl: string;
  name: string;
  chapterNumber: number | null;
  lastPageRead: number;
  read: boolean;
}

export type TapZone = 'left' | 'center' | 'right';
