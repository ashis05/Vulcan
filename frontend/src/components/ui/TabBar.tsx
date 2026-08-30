import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { LinearGradient } from 'expo-linear-gradient';
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
          if (tab?.name === 'train') {
            return (
              <View key={route.key} style={styles.trainSlot}>
                <Pressable
                  onPress={() => navigation.navigate(route.name)}
                  accessibilityRole="button"
                  accessibilityLabel="Train"
                  style={styles.trainBtn}
                >
                  <LinearGradient colors={[...colors.gradient.flame]} style={styles.trainInner}>
                    <DumbbellIcon size={28} color={colors.text.onAccent} />
                  </LinearGradient>
                </Pressable>
              </View>
            );
          }
          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="button"
              accessibilityLabel={tab?.label}
              style={styles.tab}
            >
              {tab ? (
                <tab.Icon size={24} color={focused ? colors.text.primary : colors.text.muted} />
              ) : null}
              <Text style={[styles.label, { color: focused ? colors.text.primary : colors.text.muted }]}>
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
  trainSlot: { position: 'relative', flex: 1 },
  trainBtn: {
    position: 'absolute',
    left: '50%',
    top: -30,
    width: 64,
    height: 64,
    marginLeft: -32,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.bg.base,
    shadowColor: colors.glow,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14,
  },
  trainInner: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 29 },
});