import '../global.css';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAuth } from '@/lib/use-auth';
import { useProfile } from '@/lib/use-profile';
import { useSyncManager } from '@/features/train/hooks';
import { queryClient } from '@/lib/query-client';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const profileQuery = useProfile();
  useSyncManager();

  const userId = session?.user?.id ?? null;
  const prevUserId = useRef<string | null>(null);

  // Drop the previous account's cached profile on sign-out / account switch so a
  // new user never inherits stale onboarding state.
  useEffect(() => {
    if (prevUserId.current && prevUserId.current !== userId) {
      queryClient.removeQueries({ queryKey: ['profile', prevUserId.current] });
    }
    prevUserId.current = userId;
  }, [userId]);

  if (isLoading || (session && profileQuery.isPending)) {
    return null;
  }

  const isAuthed = !!session;
  const onboarded = !!profileQuery.data?.onboardingCompleted;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.base },
        }}
      >
        <Stack.Protected guard={!isAuthed}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthed}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthed && onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="routine" />
          <Stack.Screen name="workout" />
          <Stack.Screen name="exercise" />
          <Stack.Screen name="exercise-picker" />
          <Stack.Screen name="history" />
          <Stack.Screen name="steps" />
          <Stack.Screen name="meal" />
          <Stack.Screen name="program" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}