import { ReactNode } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
};

export default function Screen({
  children,
  scroll = false,
  padded = true,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        padded && styles.padded,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, padded && styles.padded]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 128, // 64 tab bar height + 8 gap
        },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  content: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: spacing[5],
  },
});