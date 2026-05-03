import { TextStyle } from 'react-native';

type ScaleEntry = Required<Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'>> & {
  fontWeight: TextStyle['fontWeight'];
};

export const typeScale = {
  display: { fontFamily: 'Exo2-Bold',     fontWeight: '700', fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  h1:      { fontFamily: 'Exo2-Bold',     fontWeight: '700', fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  h2:      { fontFamily: 'Exo2-SemiBold', fontWeight: '600', fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  h3:      { fontFamily: 'Exo2-SemiBold', fontWeight: '600', fontSize: 16, lineHeight: 22, letterSpacing:  0   },
  bodyLg:  { fontFamily: 'Exo2-Regular',  fontWeight: '400', fontSize: 16, lineHeight: 26, letterSpacing:  0   },
  body:    { fontFamily: 'Exo2-Regular',  fontWeight: '400', fontSize: 15, lineHeight: 24, letterSpacing:  0   },
  bodySm:  { fontFamily: 'Exo2-Regular',  fontWeight: '400', fontSize: 13, lineHeight: 20, letterSpacing:  0   },
  caption: { fontFamily: 'Exo2-Medium',   fontWeight: '500', fontSize: 12, lineHeight: 16, letterSpacing:  0.5 },
  label:   { fontFamily: 'Exo2-Bold',     fontWeight: '700', fontSize: 11, lineHeight: 14, letterSpacing:  2.0 },
} as const satisfies Record<string, ScaleEntry>;

export type TypeScaleKey = keyof typeof typeScale;

export const iconSize = { xs: 16, sm: 20, md: 24, lg: 28 } as const;
export const iconStrokeWidth = { default: 1.5, active: 1.75 } as const;
