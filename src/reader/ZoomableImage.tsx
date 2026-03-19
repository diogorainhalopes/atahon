import { memo, useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import type { TapZone } from './types';
import type { ScaleType } from '@stores/readerStore';
import { useReaderGestures } from './useReaderGestures';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function mapContentFit(scaleType: ScaleType): 'contain' | 'cover' | 'fill' | 'none' {
  switch (scaleType) {
    case 'fit-width':
    case 'fit-height':
    case 'fit-page':
      return 'contain';
    case 'original':
      return 'none';
  }
}

interface ZoomableImageProps {
  uri: string;
  scaleType: ScaleType;
  onTapZone: (zone: TapZone) => void;
  onLongPress?: () => void;
  onError?: () => void;
}

function ZoomableImageInner({ uri, scaleType, onTapZone, onLongPress, onError }: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Reset zoom when page changes
  useEffect(() => {
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [uri]);

  const gesture = useReaderGestures({
    scale,
    translateX,
    translateY,
    savedScale,
    savedTranslateX,
    savedTranslateY,
    containerWidth: SCREEN_WIDTH,
    containerHeight: SCREEN_HEIGHT,
    onTapZone,
    onLongPress,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit={mapContentFit(scaleType)}
          transition={{ duration: 150 }}
          onError={onError}
        />
      </Animated.View>
    </GestureDetector>
  );
}

export const ZoomableImage = memo(ZoomableImageInner);

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
