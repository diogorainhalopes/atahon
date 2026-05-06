import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';
import { typeScale } from '@theme/typeScale';
import { space } from '@theme/theme';

interface PageHeaderProps {
  title: string;
  right?: React.ReactNode;
}

export default function PageHeader({ title, right }: PageHeaderProps) {
  const t = useTheme();
  return (
    <View style={[styles.header, { borderBottomColor: t.border, backgroundColor: t.background }]}>
      <Text style={[typeScale.h1, { color: t.inkPrimary }]}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    borderBottomWidth: 1,
  },
});
