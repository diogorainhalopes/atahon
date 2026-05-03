export const fontFamily = {
  regular:  'Exo2-Regular',
  medium:   'Exo2-Medium',
  semibold: 'Exo2-SemiBold',
  bold:     'Exo2-Bold',
  mono:     'Geist-Mono',
} as const;

export const typography = {
  fonts: {
    sans:    'Exo2-Regular',
    display: 'Exo2-Bold',
    mono:    'Geist-Mono',
  },
  sizes: {
    xs:      11,
    sm:      13,
    base:    15,
    md:      16,
    lg:      18,
    xl:      20,
    '2xl':   24,
    '3xl':   30,
    '4xl':   36,
    '5xl':   48,
    display: 32,
    h1:      26,
    h2:      20,
    h3:      16,
  },
  weights: {
    regular:   '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
  },
  lineHeights: {
    tight:   16,
    snug:    22,
    normal:  24,
    relaxed: 26,
    display: 38,
    h1:      32,
    h2:      26,
    h3:      22,
  },
  letterSpacing: {
    tight:  -0.5,
    normal:  0,
    wide:    0.5,
    wider:   1,
    label:   2.0,
  },
} as const;
