import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function ProgramLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.base },
      }}
    >
      <Stack.Screen name="generate" options={{ presentation: 'modal' }} />
      <Stack.Screen name="review" />
    </Stack>
  );
}
