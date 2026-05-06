import { TextStyle } from 'react-native';

type ScaleEntry = Required<Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'>>;

export const typeScale = {
  display: { fontFamily: 'Exo2_700Bold',     fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  h1:      { fontFamily: 'Exo2_700Bold',     fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  h2:      { fontFamily: 'Exo2_600SemiBold', fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  h3:      { fontFamily: 'Exo2_600SemiBold', fontSize: 16, lineHeight: 22, letterSpacing:  0   },
  bodyLg:  { fontFamily: 'Exo2_400Regular',  fontSize: 16, lineHeight: 26, letterSpacing:  0   },
  body:    { fontFamily: 'Exo2_400Regular',  fontSize: 15, lineHeight: 24, letterSpacing:  0   },
  bodySm:  { fontFamily: 'Exo2_400Regular',  fontSize: 13, lineHeight: 20, letterSpacing:  0   },
  caption: { fontFamily: 'Exo2_500Medium',   fontSize: 12, lineHeight: 16, letterSpacing:  0.5 },
  label:   { fontFamily: 'Exo2_700Bold',     fontSize: 11, lineHeight: 14, letterSpacing:  2.0 },
} as const satisfies Record<string, ScaleEntry>;

export type TypeScaleKey = keyof typeof typeScale;

export const iconSize = { xs: 16, sm: 20, md: 24, lg: 28 } as const;
export const iconStrokeWidth = { default: 1.5, active: 1.75 } as const;
