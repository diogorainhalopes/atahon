import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from './theme';
import { useSettingsStore } from '@stores/settingsStore';

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSettingsStore((s) => s.themeMode);
  const system = useColorScheme();

  const resolved: Theme = useMemo(() => {
    if (mode === 'light') return lightTheme;
    if (mode === 'dark') return darkTheme;
    return system === 'light' ? lightTheme : darkTheme;
  }, [mode, system]);

  return <ThemeContext.Provider value={resolved}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): Theme => useContext(ThemeContext);
