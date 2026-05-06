import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';
import { radius as radiusTokens } from '@theme/spacing';
import { elevation, ElevationLevel } from '@theme/theme';

interface CardProps extends ViewProps {
  level?: ElevationLevel;
  radius?: keyof typeof radiusTokens;
}

export function Card({ level = 'flat', radius = 'lg', style, children, ...rest }: CardProps) {
  const t = useTheme();
  return (
    <View
      {...rest}
      style={[
        styles.base,
        { backgroundColor: t.surface, borderRadius: radiusTokens[radius] },
        elevation(level, t),
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
