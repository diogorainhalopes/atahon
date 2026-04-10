import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Image,
  Linking,
} from 'react-native';
import Constants from 'expo-constants';
import { X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';

export default function AboutScreen() {
  const router = useRouter();
  const version = Constants.expoConfig?.version || '1.0.0';

  return (
    <TouchableWithoutFeedback onPress={() => router.back()}>
    <View style={styles.backdrop}>
      
      {/* Prevent closing when tapping modal itself */}
      <TouchableWithoutFeedback>
        <View style={styles.modal}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>About</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          
          <View style={styles.section}>
            <Image source={require('../../ATAHON.png')} style={styles.logo} />
            <Text style={styles.appName}>Atahon</Text>
            <Text style={styles.version}>v{version}</Text>
            <Text style={styles.description}>
              A modern manga reader with full extension support for seamless manga browsing and reading.
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://diogorainhalopes.github.io/atahon/')}>
              <Text style={styles.docsLink}>Documentation</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.cardDescription}>
            Atahon provides a clean, modern interface for browsing and reading manga with
             full support for Mihon/Tachiyomi extensions. 
             Built with React Native and Expo for a seamless cross-platform experience.
            </Text>
          </View>

          {/* Thanks to Mihon */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Thanks to Mihon</Text>
            <Text style={styles.cardDescription}>
              Atahon is inspired by and built on the Mihon/Tachiyomi extension ecosystem.
              We're grateful for the open-source manga reader community and their
              incredible work on extension compatibility and manga source management.
            </Text>
          </View>

        </ScrollView>

        </View>
        </TouchableWithoutFeedback>

      </View>
    </TouchableWithoutFeedback>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', // 👈 dim background
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  },
  modal: {
    backgroundColor: colors.background.card,
    borderRadius: radius['2xl'],
    maxHeight: '80%',
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
  },
  content: {
    padding: spacing[5],
    gap: spacing[6],
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    marginBottom: spacing[3],
  },
  section: {
    alignItems: 'center',
  },
  appName: {
    fontSize: typography.sizes['2xl'],
    fontFamily: fontFamily.bold,
    color: colors.accent.DEFAULT,
  },
  version: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  docsLink: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.semibold,
    color: colors.accent.DEFAULT,
    marginTop: spacing[2],
  },
  card: {
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  cardTitle: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: colors.accent.DEFAULT,
  },
  cardDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});