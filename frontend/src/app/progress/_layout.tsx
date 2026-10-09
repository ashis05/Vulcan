import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function ProgressLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.base },
      }}
    >
      <Stack.Screen name="checkin" options={{ presentation: 'modal' }} />
      <Stack.Screen name="analysis" />
      <Stack.Screen name="compare" />
    </Stack>
  );
}
