import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { computeTargets } from '@/engine/targets';
import { ageFromBirthDate } from '@/engine/units';
import { useAuth } from '@/lib/use-auth';
import { useProfile } from '@/lib/use-profile';

import {
  getHealthConnectStatus,
  hasStepsPermission,
  initializeHealthConnect,
  requestStepsPermission,
} from './health-connect';
import { fetchDailyActivity, setManualSteps, syncDailyActivity } from './steps';

export function useDailyActivity(days = 7) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['daily-activity', user?.id, days],
    queryFn: () => fetchDailyActivity(user!.id, days),
    enabled: !!user,
  });
}

export function useHealthConnectStatus() {
  return useQuery({ queryKey: ['health-connect-status'], queryFn: getHealthConnectStatus, staleTime: Infinity });
}

export function useHasStepsPermission() {
  return useQuery({ queryKey: ['health-connect-granted'], queryFn: hasStepsPermission, staleTime: 0 });
}

/** Requests step permission (after initializing the SDK). Returns whether granted. */
export function useConnectHealthConnect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await initializeHealthConnect();
      return requestStepsPermission();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health-connect-granted'] }),
  });
}

/** Base target from the profile → upserts daily steps + bonus for the last `days`. */
export function useSyncSteps(defaultDays = 8) {
  const { user } = useAuth();
  const profileQuery = useProfile();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (days: number = defaultDays) => {
      const profile = profileQuery.data;
      if (!user || !profile || !profile.sex || !profile.goal) return 0;
      const targets = computeTargets({
        sex: profile.sex,
        weightKg: profile.weightKg,
        heightCm: profile.heightCm,
        ageYears: ageFromBirthDate(profile.birthDate),
        activityLevel: profile.activityLevel,
        goal: profile.goal,
        paceKgWk: profile.paceKgWk,
      });
      return syncDailyActivity(user.id, targets.targetKcal, profile.weightKg, days);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daily-activity'] }),
  });
}

/** Manual step entry — the fallback when Health Connect is denied/unavailable. */
export function useSetManualSteps() {
  const { user } = useAuth();
  const profileQuery = useProfile();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, steps }: { date: string; steps: number }) => {
      const profile = profileQuery.data;
      if (!user || !profile || !profile.sex || !profile.goal) {
        throw new Error('Finish onboarding before entering steps.');
      }
      const targets = computeTargets({
        sex: profile.sex,
        weightKg: profile.weightKg,
        heightCm: profile.heightCm,
        ageYears: ageFromBirthDate(profile.birthDate),
        activityLevel: profile.activityLevel,
        goal: profile.goal,
        paceKgWk: profile.paceKgWk,
      });
      return setManualSteps(user.id, date, steps, targets.targetKcal, profile.weightKg);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daily-activity'] }),
  });
}

/**
 * Auto-syncs steps on focus and then on a timer while the screen stays focused.
 * No manual action required, and polling stops when you leave the screen.
 */
export function useAutoSyncSteps(enabled: boolean, intervalMs = 60_000, days = 8) {
  const sync = useSyncSteps(days);
  const { mutate } = sync;

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      mutate(days);
      const id = setInterval(() => mutate(days), intervalMs);
      return () => clearInterval(id);
    }, [enabled, intervalMs, mutate, days]),
  );

  return sync;
}
