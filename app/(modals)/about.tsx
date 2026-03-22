import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import Constants from 'expo-constants';
import { X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
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
            <Text style={styles.appName}>Atahon</Text>
            <Text style={styles.version}>v{version}</Text>
            <Text style={styles.description}>
              A modern manga reader with full extension support for seamless manga browsing and reading.
            </Text>
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
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  content: {
    padding: spacing[5],
    gap: spacing[6],
  },
  section: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  appName: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
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
  card: {
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  cardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.accent.DEFAULT,
  },
  cardDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});