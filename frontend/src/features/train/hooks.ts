import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/use-auth';

import * as api from './api';
import { flushQueue } from './sync';
import type { Equipment, MuscleGroup, RoutineDraftExercise } from './types';

export function useExercises() {
  return useQuery({ queryKey: ['exercises'], queryFn: api.fetchExercises });
}

export function useRoutines() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['routines', user?.id],
    queryFn: api.fetchRoutines,
    enabled: !!user,
  });
}

export function useRoutine(id: string | undefined) {
  return useQuery({
    queryKey: ['routine', id],
    queryFn: () => api.fetchRoutine(id as string),
    enabled: !!id,
  });
}

export function useCreateExercise() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; primaryMuscle: MuscleGroup; equipment: Equipment }) =>
      api.createCustomExercise(user!.id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  });
}

export function useSaveRoutine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string | null; name: string; exercises: RoutineDraftExercise[] }) =>
      api.saveRoutine(user!.id, input.id, { name: input.name, exercises: input.exercises }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routine'] });
    },
  });
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteRoutine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] }),
  });
}

export function useLastPerformance(exerciseIds: string[]) {
  const key = [...exerciseIds].sort().join(',');
  return useQuery({
    queryKey: ['last-performance', key],
    queryFn: () => api.fetchLastPerformance(exerciseIds),
    enabled: exerciseIds.length > 0,
  });
}

/** Flush queued offline writes on mount and whenever connectivity returns. */
export function useSyncManager() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const run = () => {
      flushQueue()
        .then((count) => {
          if (count > 0) {
            queryClient.invalidateQueries({ queryKey: ['last-performance'] });
          }
        })
        .catch(() => {});
    };
    run();
    return NetInfo.addEventListener((state) => {
      if (state.isConnected) run();
    });
  }, [queryClient]);
}
