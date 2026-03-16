import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Settings } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing, radius } from '@theme/spacing';
import { useReaderStore } from '@stores/readerStore';
import { ReaderSettingsSheet } from './ReaderSettingsSheet';

const AUTO_HIDE_MS = 5000;

interface ReaderOverlayProps {
  chapterName: string;
  mangaTitle: string;
  currentPage: number;
  totalPages: number;
  onSeekPage: (page: number) => void;
}

export function ReaderOverlay({
  chapterName,
  mangaTitle,
  currentPage,
  totalPages,
  onSeekPage,
}: ReaderOverlayProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isVisible = useReaderStore((s) => s.isOverlayVisible);
  const setOverlayVisible = useReaderStore((s) => s.setOverlayVisible);

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
    pointerEvents: opacity.value > 0 ? 'auto' : 'none',
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
        <View style={[styles.topBar, { paddingTop: insets.top + spacing[2] }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <ArrowLeft size={22} color={colors.text.primary} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.chapterName} numberOfLines={1}>
              {chapterName}
            </Text>
            <Text style={styles.mangaTitle} numberOfLines={1}>
              {mangaTitle}
            </Text>
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
        </View>

        {/* ── Bottom bar ───────────────────────────────────────────── */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing[2] }]}>
          {/* Page scrubber */}
          {totalPages > 1 && (
            <PageScrubber
              currentPage={currentPage}
              totalPages={totalPages}
              onSeek={handleScrub}
            />
          )}
        </View>
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
  onSeek: (page: number) => void;
}

function PageScrubber({ currentPage, totalPages, onSeek }: PageScrubberProps) {
  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  const progress = totalPages > 1 ? currentPage / (totalPages - 1) : 0;

  const handlePress = useCallback(
    (evt: { nativeEvent: { locationX: number } }) => {
      if (trackWidth <= 0) return;
      const ratio = Math.max(0, Math.min(1, evt.nativeEvent.locationX / trackWidth));
      const page = Math.round(ratio * (totalPages - 1));
      onSeek(page);
    },
    [trackWidth, totalPages, onSeek],
  );

  return (
    <View style={styles.scrubberContainer}>
      <Text style={styles.scrubberText}>{currentPage + 1}</Text>
      <Pressable
        ref={trackRef}
        style={styles.scrubberTrack}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onPress={handlePress}
      >
        <View style={styles.scrubberTrackBg} />
        <View
          style={[
            styles.scrubberFill,
            { width: `${progress * 100}%` },
          ]}
        />
        <View
          style={[
            styles.scrubberThumb,
            { left: `${progress * 100}%` },
          ]}
        />
      </Pressable>
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
    paddingBottom: spacing[3],
    backgroundColor: colors.reader.overlay,
    gap: spacing[3],
  },
  backBtn: {
    padding: spacing[1],
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  chapterName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  mangaTitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
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
    paddingTop: spacing[3],
    backgroundColor: colors.reader.overlay,
  },

  // Scrubber
  scrubberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  scrubberText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    minWidth: 28,
    textAlign: 'center',
  },
  scrubberTrack: {
    flex: 1,
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
    marginLeft: -7,
    top: 9,
  },
});
