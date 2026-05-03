import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { typography, fontFamily } from './typography';
import { spacing, radius } from './spacing';

export const commonStyles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },

  pageTitle: {
    fontSize: typography.sizes.h1,
    fontFamily: fontFamily.semibold,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    lineHeight: typography.lineHeights.h1,
    letterSpacing: -0.4,
  },

  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: fontFamily.semibold,
    fontWeight: typography.weights.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.label,
  },

  sectionCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border.DEFAULT,
  },

  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 56,
  },
});

export const defaultStackScreenOptions = {
  headerStyle: { backgroundColor: colors.background.DEFAULT },
  headerTintColor: colors.text.primary,
  headerTitleStyle: {
    fontSize: typography.sizes.h3,
    fontFamily: fontFamily.semibold,
    fontWeight: typography.weights.semibold as '600',
  },
  headerShadowVisible: false,
  animation: 'fade' as const,
  animationDuration: 400,
} as const;
