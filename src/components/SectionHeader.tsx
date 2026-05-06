import { Text, TextProps } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';
import { typeScale } from '@theme/typeScale';

export function SectionHeader({ style, ...rest }: TextProps) {
  const t = useTheme();
  return (
    <Text
      {...rest}
      style={[
        typeScale.label,
        { color: t.inkTertiary, textTransform: 'uppercase' },
        style,
      ]}
    />
  );
}
