import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CaretLeft, Globe } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import ExtensionBridge from 'extension-bridge';

// ─── ExtensionLoginScreen ─────────────────────────────────────────────────────

export default function ExtensionLoginScreen() {
  const { pkgName, sourceId, loginUrl, name } = useLocalSearchParams<{
    pkgName: string;
    sourceId: string;
    loginUrl: string;
    name?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  async function handleOpenLogin() {
    if (!sourceId || !loginUrl) {
      Alert.alert('Error', 'Login URL not available for this source.');
      return;
    }

    setLoading(true);
    try {
      await ExtensionBridge.openLoginWebView(sourceId, loginUrl);
    } catch (e) {
      const msg = (e as Error)?.message ?? 'Unknown error';
      Alert.alert('Login failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <CaretLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          Login{name ? ` — ${name}` : ''}
        </Text>
      </View>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Globe size={48} color={colors.accent.DEFAULT} />
        </View>

        <Text style={styles.heading}>Sign in to your account</Text>
        <Text style={styles.body}>
          This source requires authentication. Tapping the button below will open
          the source login page in Chrome. After signing in, your session cookies
          will be used by the extension to access your account.
        </Text>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleOpenLogin}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Globe size={18} color={colors.text.primary} />
          <Text style={styles.btnText}>
            {loading ? 'Opening…' : 'Open Login Page'}
          </Text>
        </TouchableOpacity>

        {pkgName ? (
          <Text style={styles.hint}>Extension: {pkgName}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
    gap: spacing[1],
  },
  backBtn: {
    padding: spacing[2],
  },
  title: {
    flex: 1,
    fontSize: typography.sizes['2xl'],
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    gap: spacing[4],
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.surface.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  heading: {
    fontSize: typography.sizes['2xl'],
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * 1.6,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.accent.DEFAULT,
    borderRadius: radius.lg,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    marginTop: spacing[2],
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
  },
  hint: {
    fontSize: typography.sizes.xs,
    fontFamily: fontFamily.regular,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
