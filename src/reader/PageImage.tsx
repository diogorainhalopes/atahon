import { memo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import type { ReaderPage, TapZone } from './types';
import type { ScaleType } from '@stores/readerStore';
import { PageLoadingIndicator } from './PageLoadingIndicator';
import { PageErrorView } from './PageErrorView';
import { ZoomableImage } from './ZoomableImage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PageImageProps {
  page: ReaderPage;
  scaleType: ScaleType;
  onRetry: (index: number) => void;
  onTapZone: (zone: TapZone) => void;
  onImageError: (index: number) => void;
  onLongPress?: () => void;
}

function PageImageInner({ page, scaleType, onRetry, onTapZone, onImageError, onLongPress }: PageImageProps) {
  if (page.state === 'queue' || page.state === 'loading') {
    return (
      <View style={styles.container}>
        <PageLoadingIndicator pageNumber={page.index + 1} />
      </View>
    );
  }

  if (page.state === 'error') {
    return (
      <View style={styles.container}>
        <PageErrorView
          pageNumber={page.index + 1}
          error={page.error}
          onRetry={() => onRetry(page.index)}
        />
      </View>
    );
  }

  return (
    <ZoomableImage
      uri={page.imageUrl!}
      scaleType={scaleType}
      onTapZone={onTapZone}
      onLongPress={onLongPress}
      onError={() => onImageError(page.index)}
    />
  );
}

export const PageImage = memo(PageImageInner);

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
});
