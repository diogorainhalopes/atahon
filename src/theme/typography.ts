// Weight-specific Geist font families (registered as aliases in app/_layout.tsx)
export const fontFamily = {
  regular: 'Geist-Regular',
  medium: 'Geist-Medium',
  semibold: 'Geist-SemiBold',
  bold: 'Geist-Bold',
  extrabold: 'Geist-ExtraBold',
  mono: 'Geist-Mono',
} as const;

export const typography = {
  fonts: {
    sans: 'Geist-Regular',
    display: 'Geist-Bold',
    mono: 'Geist-Mono',
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight: 19,
    snug: 22,
    normal: 24,
    relaxed: 26,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;
