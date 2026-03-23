import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius } from './spacing';

/**
 * Shared style presets for consistent UI patterns across the app.
 * Screens compose from these with: style={[commonStyles.x, styles.y]}
 */
export const commonStyles = StyleSheet.create({
  // Page-level header container (Library, Browse, Updates, History, More)
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },

  // Page title text ("Library", "Browse", etc.)
  pageTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },

  // Section label (navigation group labels: used by More, Settings, Extensions, Repos, [pkgName])
  // These are the uppercase, smaller, muted labels like "Downloads", "Privacy", "Extensions"
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
  },

  // Card container for grouped items (settings groups, menu items, repo entries)
  sectionCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },

  // Horizontal divider within cards and lists
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },

  // Standard list row (consistent flex layout + padding for settings, menu items, chapter rows)
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
});

/**
 * Shared Stack screen header configuration for extensions, settings, downloads layouts.
 * Used via: screenOptions={{ ...defaultStackScreenOptions }}
 */
export const defaultStackScreenOptions = {
  headerStyle: { backgroundColor: colors.background.DEFAULT },
  headerTintColor: colors.text.primary,
  headerTitleStyle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as '600',
  },
  headerShadowVisible: false,
} as const;
