import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Compass, Bell, Clock, MoreHorizontal } from 'lucide-react-native';
import { colors } from '@theme/colors';

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

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: insets.bottom + 8,
          borderRadius: 16,
          height: 64,
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.DEFAULT,
        },
        tabBarActiveTintColor: colors.accent.DEFAULT,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
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