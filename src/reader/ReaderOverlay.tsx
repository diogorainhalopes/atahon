import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Settings } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { spacing, radius } from '@theme/spacing';
import { useReaderStore } from '@stores/readerStore';
import { ReaderSettingsSheet } from './ReaderSettingsSheet';
import type { ReaderPage } from './types';

const AUTO_HIDE_MS = 5000;
const BUBBLE_W = 90;
const BUBBLE_H = 120;
const BUBBLE_GAP = 16;

interface ReaderOverlayProps {
  chapterName: string;
  mangaTitle: string;
  currentPage: number;
  totalPages: number;
  pages: ReaderPage[];
  onSeekPage: (page: number) => void;
}

export function ReaderOverlay({
  chapterName,
  mangaTitle,
  currentPage,
  totalPages,
  pages,
  onSeekPage,
}: ReaderOverlayProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isVisible = useReaderStore((s) => s.isOverlayVisible);
  const setOverlayVisible = useReaderStore((s) => s.setOverlayVisible);
  const scrubberBlur = useReaderStore((s) => s.scrubberBlur);

  const [settingsVisible, setSettingsVisible] = useState(false);
  const autoHideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Animated opacity
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, { duration: 200 });

    if (isVisible) {
      resetAutoHide();
    } else {
      clearTimeout(autoHideTimer.current);
    }

    return () => clearTimeout(autoHideTimer.current);
  }, [isVisible]);

  function resetAutoHide() {
    clearTimeout(autoHideTimer.current);
    autoHideTimer.current = setTimeout(() => {
      setOverlayVisible(false);
    }, AUTO_HIDE_MS);
  }

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleScrub = useCallback(
    (page: number) => {
      resetAutoHide();
      onSeekPage(page);
    },
    [onSeekPage],
  );

  if (!isVisible && opacity.value === 0) return null;

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="box-none">
        {/* ── Top bar ──────────────────────────────────────────────── */}
        <LinearGradient
          colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']}
          style={[styles.topBar, { paddingTop: insets.top + spacing[2] }]}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <ArrowLeft size={22} color={colors.text.primary} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.chapterName} numberOfLines={1}>
              {chapterName}
            </Text>
            {mangaTitle ? (
              <Text style={styles.mangaTitle} numberOfLines={1}>
                {mangaTitle}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => {
              resetAutoHide();
              setSettingsVisible(true);
            }}
            style={styles.settingsBtn}
            hitSlop={12}
          >
            <Settings size={20} color={colors.text.primary} />
          </Pressable>
        </LinearGradient>

        {/* ── Bottom bar ───────────────────────────────────────────── */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
          style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing[2] }]}
        >
          {/* Page scrubber */}
          {totalPages > 1 && (
            <PageScrubber
              currentPage={currentPage}
              totalPages={totalPages}
              pages={pages}
              onSeek={handleScrub}
              scrubberBlur={scrubberBlur}
            />
          )}
        </LinearGradient>
      </Animated.View>

      <ReaderSettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </>
  );
}

// ─── PageScrubber ──────────────────────────────────────────────────────────────

interface PageScrubberProps {
  currentPage: number;
  totalPages: number;
  pages: ReaderPage[];
  onSeek: (page: number) => void;
  scrubberBlur: boolean;
}

function PageScrubber({ currentPage, totalPages, pages, onSeek, scrubberBlur }: PageScrubberProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [hoveredPage, setHoveredPage] = useState(currentPage);

  const thumbX = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const dragPage = useSharedValue(currentPage);

  // Sync thumb to currentPage when not dragging
  useEffect(() => {
    if (trackWidth <= 0) return;
    const progress = totalPages > 1 ? currentPage / (totalPages - 1) : 0;
    thumbX.value = withTiming(progress * trackWidth, { duration: 150 });
  }, [currentPage, totalPages, trackWidth]);

  // UI-thread helper: x pixels → page index
  function xToPage(x: number): number {
    'worklet';
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    return Math.round(ratio * (totalPages - 1));
  }

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      'worklet';
      isDragging.value = true;
      const x = Math.max(0, Math.min(trackWidth, e.x));
      thumbX.value = x;
      const page = xToPage(x);
      dragPage.value = page;
      runOnJS(setHoveredPage)(page);
    })
    .onUpdate((e) => {
      'worklet';
      const x = Math.max(0, Math.min(trackWidth, e.x));
      thumbX.value = x;
      const page = xToPage(x);
      if (page !== dragPage.value) {
        dragPage.value = page;
        runOnJS(setHoveredPage)(page);
      }
    })
    .onFinalize(() => {
      'worklet';
      isDragging.value = false;
      runOnJS(onSeek)(dragPage.value);
    });

  const fillStyle = useAnimatedStyle(() => ({ width: thumbX.value }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - 7 }],
  }));
  const bubbleStyle = useAnimatedStyle(() => {
    const clampedX = Math.max(
      BUBBLE_W / 2,
      Math.min(trackWidth - BUBBLE_W / 2, thumbX.value),
    );
    return {
      opacity: isDragging.value
        ? withTiming(1, { duration: 80 })
        : withTiming(0, { duration: 150 }),
      transform: [{ translateX: clampedX - BUBBLE_W / 2 }],
    };
  });

  return (
    <View style={styles.scrubberContainer}>
      <Text style={styles.scrubberText}>{currentPage + 1}</Text>

      <View style={styles.scrubberTrackArea}>
        {/* Bubble */}
        <Animated.View style={[styles.bubble, bubbleStyle]} pointerEvents="none">
          {pages[hoveredPage]?.state === 'ready' && pages[hoveredPage]?.imageUrl ? (
            <Image
              source={{ uri: pages[hoveredPage].imageUrl }}
              style={styles.bubbleImg}
              contentFit="cover"
              blurRadius={scrubberBlur ? 6 : 0}
            />
          ) : (
            <View style={styles.bubblePlaceholder} />
          )}
          <View style={styles.bubbleOverlay}>
            <Text style={styles.bubbleLabel}>{hoveredPage + 1}</Text>
          </View>
          <View style={styles.bubbleTip} />
        </Animated.View>

        {/* Track */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={styles.scrubberTrack}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          >
            <View style={styles.scrubberTrackBg} />
            <Animated.View style={[styles.scrubberFill, fillStyle]} />
            <Animated.View style={[styles.scrubberThumb, thumbStyle]} />
          </Animated.View>
        </GestureDetector>
      </View>

      <Text style={styles.scrubberText}>{totalPages}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[3],
  },
  backBtn: {
    padding: spacing[1],
  },
  titleBlock: {
    flex: 1,
    gap: 2,
    alignItems: 'center',
  },
  chapterName: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  mangaTitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  settingsBtn: {
    padding: spacing[1],
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[8],
    overflow: 'visible',
  },

  // Scrubber
  scrubberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  scrubberText: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.medium,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    minWidth: 28,
    textAlign: 'center',
  },
  scrubberTrackArea: {
    flex: 1,
  },
  scrubberTrack: {
    height: 32,
    justifyContent: 'center',
  },
  scrubberTrackBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1.5,
  },
  scrubberFill: {
    position: 'absolute',
    left: 0,
    height: 3,
    backgroundColor: colors.reader.scrubber,
    borderRadius: 1.5,
  },
  scrubberThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.reader.scrubber,
    top: 9,
  },

  // Bubble
  bubble: {
    position: 'absolute',
    bottom: 32 + BUBBLE_GAP,
    width: BUBBLE_W,
    height: BUBBLE_H,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bubbleImg: {
    width: BUBBLE_W,
    height: BUBBLE_H,
  },
  bubblePlaceholder: {
    width: BUBBLE_W,
    height: BUBBLE_H,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleLabel: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.bold,
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  bubbleTip: {
    position: 'absolute',
    bottom: -6,
    left: BUBBLE_W / 2 - 6,
    width: 12,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.88)',
    transform: [{ rotate: '45deg' }],
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});
