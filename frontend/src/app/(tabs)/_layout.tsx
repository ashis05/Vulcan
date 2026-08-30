import { Tabs } from 'expo-router/js-tabs';

import { VulcanTabBar } from '@/components/ui/TabBar';
import { colors } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <VulcanTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg.base },
      }}
    >
      <Tabs.Screen name="today" />
      <Tabs.Screen name="nutrition" />
      <Tabs.Screen name="train" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}