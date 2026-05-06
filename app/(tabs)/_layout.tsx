import { Tabs, usePathname, router } from 'expo-router';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Compass, Bell, Clock, DotsThree } from 'phosphor-react-native';
import { useTheme } from '@theme/ThemeProvider';
import { fontFamily } from '@theme/typography';

type Tab = {
  name: string;
  route: string;
  title: string;
  icon: React.ElementType;
};

const tabs: Tab[] = [
  { name: 'library/index', route: '/(tabs)/library', title: 'Library', icon: BookOpen },
  { name: 'browse', route: '/(tabs)/browse', title: 'Browse', icon: Compass },
  { name: 'updates/index', route: '/(tabs)/updates', title: 'Updates', icon: Bell },
  { name: 'history/index', route: '/(tabs)/history', title: 'History', icon: Clock },
  { name: 'more/index', route: '/(tabs)/more', title: 'More', icon: DotsThree },
];

function CustomTabBar() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const pathname = usePathname();

  const barWidth = Math.min(screenWidth - 24, 400);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: t.surfaceElevated,
          borderColor: t.border,
          bottom: insets.bottom + 12,
          width: barWidth,
          left: (screenWidth - barWidth) / 2,
        },
      ]}
    >
      {tabs.map(({ name, route, title, icon: Icon }) => {
        const focused = pathname.startsWith(route.replace('/(tabs)', ''));

        return (
          <Pressable
            key={name}
            onPress={() => router.push(route as any)}
            style={styles.tabItem}
            android_ripple={null}
          >
            <View
              style={[
                styles.pill,
                focused && styles.pillFocused,
                focused && { backgroundColor: t.accent },
              ]}
            >
              <Icon
                size={18}
                color={focused ? '#FFFFFF' : t.inkTertiary}
                weight={focused ? 'fill' : 'regular'}
              />
              {focused && (
                <Text
                  style={[styles.label, { color: '#FFFFFF' }]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        {tabs.map(({ name, title }) => (
          <Tabs.Screen key={name} name={name} options={{ title }} />
        ))}
      </Tabs>
      <View
        style={[
          styles.barContainer,
          { bottom: 0, paddingBottom: insets.bottom + 12 },
        ]}
        pointerEvents="box-none"
      >
        <CustomTabBar />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  bar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    paddingHorizontal: 20,
    overflow: 'visible',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 40,
  },
  pillFocused: {
    paddingHorizontal: 14,
    position: 'absolute',
  },
  label: {
    fontSize: 12,
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
    lineHeight: 16,
  },
});