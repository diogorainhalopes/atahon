import { Gesture, type ComposedGesture } from 'react-native-gesture-handler';
import {
  runOnJS,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { TapZone } from './types';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;

interface UseReaderGesturesParams {
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  savedScale: SharedValue<number>;
  savedTranslateX: SharedValue<number>;
  savedTranslateY: SharedValue<number>;
  containerWidth: number;
  containerHeight: number;
  onTapZone: (zone: TapZone) => void;
  onLongPress?: () => void;
}

export function useReaderGestures({
  scale,
  translateX,
  translateY,
  savedScale,
  savedTranslateX,
  savedTranslateY,
  containerWidth,
  containerHeight,
  onTapZone,
  onLongPress,
}: UseReaderGesturesParams): ComposedGesture {
  // ─── Pinch to zoom ──────────────────────────────────────────────────
  const pinchGesture = Gesture.Pinch()
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

      // Adjust translation to keep focal point stable
      if (savedScale.value > 0) {
        const ratio = newScale / savedScale.value;
        const focalX = e.focalX - containerWidth / 2;
        const focalY = e.focalY - containerHeight / 2;
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
  const panGesture = Gesture.Pan()
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
      const maxTranslateX = (containerWidth * (scale.value - 1)) / 2;
      const maxTranslateY = (containerHeight * (scale.value - 1)) / 2;

      let newX = savedTranslateX.value + e.translationX;
      let newY = savedTranslateY.value + e.translationY;

      // Elastic bounds
      if (newX > maxTranslateX) {
        newX = maxTranslateX + (newX - maxTranslateX) * 0.3;
      } else if (newX < -maxTranslateX) {
        newX = -maxTranslateX + (newX + maxTranslateX) * 0.3;
      }
      if (newY > maxTranslateY) {
        newY = maxTranslateY + (newY - maxTranslateY) * 0.3;
      } else if (newY < -maxTranslateY) {
        newY = -maxTranslateY + (newY + maxTranslateY) * 0.3;
      }

      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd(() => {
      'worklet';
      const maxTranslateX = (containerWidth * (scale.value - 1)) / 2;
      const maxTranslateY = (containerHeight * (scale.value - 1)) / 2;

      // Spring back if out of bounds
      if (translateX.value > maxTranslateX) {
        translateX.value = withSpring(maxTranslateX, { damping: 15 });
      } else if (translateX.value < -maxTranslateX) {
        translateX.value = withSpring(-maxTranslateX, { damping: 15 });
      }
      if (translateY.value > maxTranslateY) {
        translateY.value = withSpring(maxTranslateY, { damping: 15 });
      } else if (translateY.value < -maxTranslateY) {
        translateY.value = withSpring(-maxTranslateY, { damping: 15 });
      }
    });

  // ─── Double tap to zoom ─────────────────────────────────────────────
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
    .onEnd((e) => {
      'worklet';
      if (scale.value > 1.05) {
        // Zoom out
        scale.value = withTiming(1, { duration: 250 });
        translateX.value = withTiming(0, { duration: 250 });
        translateY.value = withTiming(0, { duration: 250 });
      } else {
        // Zoom in centered on tap point
        const targetScale = DOUBLE_TAP_SCALE;
        const focalX = e.x - containerWidth / 2;
        const focalY = e.y - containerHeight / 2;

        scale.value = withTiming(targetScale, { duration: 250 });
        translateX.value = withTiming(-focalX * (targetScale - 1), { duration: 250 });
        translateY.value = withTiming(-focalY * (targetScale - 1), { duration: 250 });
      }
    });

  // ─── Single tap (tap zones) ─────────────────────────────────────────
  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(200)
    .onEnd((e) => {
      'worklet';
      // Don't handle taps when zoomed
      if (scale.value > 1.05) return;

      const x = e.x / containerWidth;
      let zone: TapZone;
      if (x < 0.33) {
        zone = 'left';
      } else if (x > 0.67) {
        zone = 'right';
      } else {
        zone = 'center';
      }
      runOnJS(onTapZone)(zone);
    });

  // ─── Long press ─────────────────────────────────────────────────────
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onEnd(() => {
      'worklet';
      if (onLongPress) {
        runOnJS(onLongPress)();
      }
    });

  // ─── Composition ────────────────────────────────────────────────────
  // Pinch + pan run simultaneously (for zoomed panning while pinching)
  const pinchPan = Gesture.Simultaneous(pinchGesture, panGesture);

  // Double-tap takes priority over single-tap
  const taps = Gesture.Exclusive(doubleTapGesture, singleTapGesture);

  // Long press takes priority over taps
  const pressAndTaps = Gesture.Exclusive(longPressGesture, taps);

  // Zoom gestures race against tap/press gestures
  return Gesture.Race(pinchPan, pressAndTaps);
}
