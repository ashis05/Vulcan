import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function MealLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.base },
      }}
    >
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="scan" />
      <Stack.Screen name="confirm" />
    </Stack>
  );
}
