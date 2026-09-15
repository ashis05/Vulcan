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
import { fetchDailyActivity, syncDailyActivity } from './steps';

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

/** Base target from the profile → upserts daily steps + bonus for the last 7 days. */
export function useSyncSteps() {
  const { user } = useAuth();
  const profileQuery = useProfile();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
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
      return syncDailyActivity(user.id, targets.targetKcal, profile.weightKg);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daily-activity'] }),
  });
}

/**
 * Auto-syncs steps on focus and then on a timer while the screen stays focused.
 * No manual action required, and polling stops when you leave the screen.
 */
export function useAutoSyncSteps(enabled: boolean, intervalMs = 60_000) {
  const sync = useSyncSteps();
  const { mutate } = sync;

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      mutate();
      const id = setInterval(() => mutate(), intervalMs);
      return () => clearInterval(id);
    }, [enabled, intervalMs, mutate]),
  );

  return sync;
}
