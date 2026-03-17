import { memo, useCallback, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import type { ReaderPage } from './types';
import { PageLoadingIndicator } from './PageLoadingIndicator';
import { PageErrorView } from './PageErrorView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;

interface ContinuousPageImageProps {
  page: ReaderPage;
  onRetry: (index: number) => void;
  onTap?: () => void;
}

function ContinuousPageImageInner({ page, onRetry, onTap }: ContinuousPageImageProps) {
  const [displayHeight, setDisplayHeight] = useState(SCREEN_HEIGHT);
  const containerHeight = useSharedValue(SCREEN_HEIGHT);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const handleLoad = useCallback(
    (e: { source: { width: number; height: number } }) => {
      const { width, height } = e.source;
      if (width > 0) {
        const h = Math.round(SCREEN_WIDTH * (height / width));
        setDisplayHeight(h);
        containerHeight.value = h;
      }
    },
    [],
  );

  // ─── Pinch to zoom ──────────────────────────────────────────────────
  const pinch = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      'worklet';
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
      scale.value = newScale;
      if (savedScale.value > 0) {
        const ratio = newScale / savedScale.value;
        const focalX = e.focalX - SCREEN_WIDTH / 2;
        const focalY = e.focalY - containerHeight.value / 2;
        translateX.value = savedTranslateX.value * ratio + focalX * (1 - ratio);
        translateY.value = savedTranslateY.value * ratio + focalY * (1 - ratio);
      }
    })
    .onEnd(() => {
      'worklet';
      if (scale.value < 1.05) {
        scale.value = withSpring(1, { damping: 15 });
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  // ─── Pan when zoomed ────────────────────────────────────────────────
  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .manualActivation(true)
    .onTouchesMove((_e, stateManager) => {
      'worklet';
      if (scale.value > 1.05) {
        stateManager.activate();
      } else {
        stateManager.fail();
      }
    })
    .onStart(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      'worklet';
      const maxTX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
      const maxTY = (containerHeight.value * (scale.value - 1)) / 2;

      let newX = savedTranslateX.value + e.translationX;
      let newY = savedTranslateY.value + e.translationY;

      // Elastic bounds
      if (newX > maxTX) newX = maxTX + (newX - maxTX) * 0.3;
      else if (newX < -maxTX) newX = -maxTX + (newX + maxTX) * 0.3;
      if (newY > maxTY) newY = maxTY + (newY - maxTY) * 0.3;
      else if (newY < -maxTY) newY = -maxTY + (newY + maxTY) * 0.3;

      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd(() => {
      'worklet';
      const maxTX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
      const maxTY = (containerHeight.value * (scale.value - 1)) / 2;

      if (translateX.value > maxTX) translateX.value = withSpring(maxTX, { damping: 15 });
      else if (translateX.value < -maxTX) translateX.value = withSpring(-maxTX, { damping: 15 });
      if (translateY.value > maxTY) translateY.value = withSpring(maxTY, { damping: 15 });
      else if (translateY.value < -maxTY) translateY.value = withSpring(-maxTY, { damping: 15 });
    });

  // ─── Double-tap to zoom in/out ────────────────────────────────────
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
    .onEnd((e) => {
      'worklet';
      if (scale.value > 1.05) {
        scale.value = withTiming(1, { duration: 250 });
        translateX.value = withTiming(0, { duration: 250 });
        translateY.value = withTiming(0, { duration: 250 });
      } else {
        const focalX = e.x - SCREEN_WIDTH / 2;
        const focalY = e.y - containerHeight.value / 2;
        scale.value = withTiming(DOUBLE_TAP_SCALE, { duration: 250 });
        translateX.value = withTiming(-focalX * (DOUBLE_TAP_SCALE - 1), { duration: 250 });
        translateY.value = withTiming(-focalY * (DOUBLE_TAP_SCALE - 1), { duration: 250 });
      }
    });

  // ─── Single-tap to toggle overlay ─────────────────────────────────
  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(200)
    .onEnd(() => {
      'worklet';
      if (scale.value > 1.05) return;
      if (onTap) runOnJS(onTap)();
    });

  // ─── Compose gestures ─────────────────────────────────────────────
  const pinchPan = Gesture.Simultaneous(pinch, pan);
  const taps = Gesture.Exclusive(doubleTap, singleTap);
  const gesture = Gesture.Race(pinchPan, taps);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (page.state === 'queue' || page.state === 'loading') {
    return (
      <View style={styles.placeholder}>
        <PageLoadingIndicator pageNumber={page.index + 1} />
      </View>
    );
  }

  if (page.state === 'error') {
    return (
      <View style={styles.placeholder}>
        <PageErrorView
          pageNumber={page.index + 1}
          error={page.error}
          onRetry={() => onRetry(page.index)}
        />
      </View>
    );
  }

  return (
    <View style={{ width: SCREEN_WIDTH, height: displayHeight, overflow: 'visible' }}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ width: SCREEN_WIDTH, height: displayHeight }, animatedStyle]}>
          <Image
            source={{ uri: page.imageUrl! }}
            style={{ width: SCREEN_WIDTH, height: displayHeight }}
            contentFit="contain"
            onLoad={handleLoad}
            transition={{ duration: 150 }}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export const ContinuousPageImage = memo(ContinuousPageImageInner);

const styles = StyleSheet.create({
  placeholder: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
});
