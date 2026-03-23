import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import type { Chapter } from '@db/schema';

interface ChapterTransitionPageProps {
  direction: 'prev' | 'next';
  currentChapterName: string;
  targetChapter: Chapter | null;
  onNavigate: () => void;
}

export function ChapterTransitionPage({
  direction,
  currentChapterName,
  targetChapter,
  onNavigate,
}: ChapterTransitionPageProps) {
  const isPrev = direction === 'prev';
  const Icon = isPrev ? ChevronLeft : ChevronRight;
  const hasTarget = targetChapter != null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Current chapter */}
        <Text style={styles.finishedLabel}>
          {isPrev ? 'Previous chapter' : 'Finished'}
        </Text>
        <Text style={styles.chapterName} numberOfLines={2}>
          {currentChapterName}
        </Text>

        <View style={styles.divider} />

        {/* Target chapter */}
        {hasTarget ? (
          <>
            <Text style={styles.targetLabel}>
              {isPrev ? 'Go to' : 'Next'}
            </Text>
            <Text style={styles.targetName} numberOfLines={2}>
              {targetChapter.name}
            </Text>

            <Pressable style={styles.navButton} onPress={onNavigate}>
              <Icon size={18} color="#fff" />
              <Text style={styles.navButtonText}>
                {isPrev ? 'Previous Chapter' : 'Next Chapter'}
              </Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.noMoreText}>
            {isPrev ? 'No previous chapter' : 'No more chapters'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  card: {
    width: '100%',
    backgroundColor: colors.background.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing[5],
    gap: spacing[2],
  },
  finishedLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: fontFamily.medium,
  },
  chapterName: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing[2],
  },
  targetLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: fontFamily.medium,
  },
  targetName: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: colors.accent.DEFAULT,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
    paddingVertical: spacing[2.5],
    borderRadius: radius.md,
    backgroundColor: colors.accent.DEFAULT,
  },
  navButtonText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: '#fff',
  },
  noMoreText: {
    fontSize: typography.sizes.base,
    color: colors.text.muted,
    textAlign: 'center',
    paddingVertical: spacing[3],
  },
});
