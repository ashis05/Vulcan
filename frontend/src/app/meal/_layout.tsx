import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function MealLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        contentStyle: { backgroundColor: colors.bg.base },
      }}
    />
  );
}
