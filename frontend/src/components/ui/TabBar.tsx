import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppleIcon, ChartIcon, DumbbellIcon, FlameIcon, PersonIcon } from '@/components/icons';
import { colors } from '@/theme';

const TABS = [
  { name: 'today', label: 'Today', Icon: FlameIcon },
  { name: 'nutrition', label: 'Nutrition', Icon: AppleIcon },
  { name: 'train', label: 'Train', Icon: DumbbellIcon },
  { name: 'progress', label: 'Progress', Icon: ChartIcon },
  { name: 'profile', label: 'Profile', Icon: PersonIcon },
] as const;

export function VulcanTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.dock}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const tab = TABS[index];
          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="button"
              accessibilityLabel={tab?.label}
              style={styles.tab}
            >
              {tab ? (
                <tab.Icon
                  size={24}
                  color={focused ? colors.accent.ember500 : colors.text.muted}
                />
              ) : null}
              <Text
                style={[
                  styles.label,
                  { color: focused ? colors.accent.ember500 : colors.text.muted },
                ]}
              >
                {tab?.label ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: 16,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  dock: {
    position: 'relative',
    height: 64,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 4,
    borderRadius: 28,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 11, fontWeight: '500' },
});
