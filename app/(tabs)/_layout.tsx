import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Compass, Bell, Clock, MoreHorizontal } from 'lucide-react-native';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';

type Tab = {
  name: string; // relative route path
  title: string;
  icon: React.ElementType;
};

const tabs: Tab[] = [
  { name: 'library/index', title: 'Library', icon: BookOpen },
  { name: 'browse', title: 'Browse', icon: Compass },
  { name: 'updates/index', title: 'Updates', icon: Bell },
  { name: 'history/index', title: 'History', icon: Clock },
  { name: 'more/index', title: 'More', icon: MoreHorizontal },
];

function TabIcon({ icon: Icon, color, size }: { icon: React.ElementType; color: string; size: number }) {
  return <Icon size={size} color={color} strokeWidth={2} />;
}

const MAX_TAB_BAR_WIDTH = 560;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const horizontalInset = Math.max(spacing[4], (screenWidth - MAX_TAB_BAR_WIDTH) / 2);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: horizontalInset,
          right: horizontalInset,
          bottom: insets.bottom + 8,
          borderRadius: radius.xl,
          height: spacing[16],
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.DEFAULT,
          paddingTop: 0,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarActiveTintColor: colors.accent.DEFAULT,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontFamily: fontFamily.medium,
          marginTop: 2,
        },
      }}
    >
      {tabs.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size }) => <TabIcon icon={icon} color={color} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}