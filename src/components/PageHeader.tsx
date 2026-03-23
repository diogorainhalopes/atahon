import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { spacing } from '@theme/spacing';

interface PageHeaderProps {
  title: string;
  right?: React.ReactNode;
}

export default function PageHeader({ title, right }: PageHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
    backgroundColor: colors.background.DEFAULT,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
  },
});
