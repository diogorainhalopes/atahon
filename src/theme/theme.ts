import { Platform, ViewStyle } from 'react-native';

const accent = '#7C6EF8';

export const lightTheme = {
  mode: 'light' as const,
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceElevated: '#FFFFFF',
  inkPrimary: '#080808',
  inkSecondary: '#444444',
  inkTertiary: '#888888',
  border: '#DDDDDD',
  borderStrong: '#BBBBBB',
  accent,
  accentSoft: '#7C6EF814',
  status: {
    success: '#22AA66',
    warning: '#CC8800',
    error: '#CC2222',
    info: '#2266CC',
  },
  shadowColor: '#1A1A1A',
};

export const darkTheme: typeof lightTheme = {
  mode: 'dark' as unknown as 'light',
  background: '#080808',
  surface: '#0E0E0E',
  surfaceElevated: '#161616',
  inkPrimary: '#FFFFFF',
  inkSecondary: '#BBBBBB',
  inkTertiary: '#666666',
  border: '#333333',
  borderStrong: '#444444',
  accent: '#7C6EF8',
  accentSoft: '#7C6EF814',
  status: {
    success: '#44CC88',
    warning: '#FFAA33',
    error: '#FF4444',
    info: '#4488FF',
  },
  shadowColor: '#000000',
};

export type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark' | 'system';

export const radius = { sm: 6, md: 10, lg: 14, xl: 20, pill: 9999 } as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export type ElevationLevel = 'flat' | 'raised' | 'floating' | 'overlay';

export function elevation(level: ElevationLevel, t: Theme): ViewStyle {
  if (level === 'flat') {
    return { borderWidth: 1, borderColor: t.border };
  }
  const isDark = t.background === darkTheme.background;
  const shared: ViewStyle = { borderRadius: radius.lg };

  const pick = (android: ViewStyle, ios: ViewStyle): ViewStyle =>
    Platform.select<ViewStyle>({ android, ios }) ?? {};

  if (level === 'raised') {
    return {
      ...shared,
      ...pick(
        isDark
          ? { borderTopWidth: 1, borderTopColor: t.border, elevation: 4 }
          : { borderWidth: 1, borderColor: t.border, elevation: 4 },
        {
          shadowColor: t.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.35 : 0.05,
          shadowRadius: 12,
        },
      ),
    };
  }

  if (level === 'floating') {
    return {
      ...shared,
      ...pick(
        { elevation: 8 },
        {
          shadowColor: t.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.4 : 0.08,
          shadowRadius: 18,
        },
      ),
    };
  }

  return {
    ...shared,
    ...pick(
      { borderTopWidth: 1, borderTopColor: t.border, elevation: 16 },
      {
        shadowColor: t.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.45 : 0.1,
        shadowRadius: 28,
      },
    ),
  };
}
