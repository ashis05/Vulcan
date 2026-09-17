import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { localDayFromIso } from '@/lib/dates';
import { useAuth } from '@/lib/use-auth';

import * as api from './api';
import type { Meal, MealInput } from './types';

export function useDayMeals(dateIso: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['meals', 'day', user?.id, dateIso],
    queryFn: () => api.fetchDayMeals(dateIso),
    enabled: !!user,
  });
}

export function useMealsRange(startIso: string, endIso: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['meals', 'range', user?.id, startIso, endIso],
    queryFn: () => api.fetchMealsInRange(startIso, endIso),
    enabled: !!user,
  });
}

export function useRecentMeals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['meals', 'recent', user?.id],
    queryFn: () => api.fetchRecentMeals(),
    enabled: !!user,
  });
}

export function useMeal(id: string | undefined) {
  return useQuery({
    queryKey: ['meal', id],
    queryFn: () => api.fetchMeal(id as string),
    enabled: !!id,
  });
}

export function useCreateMeal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MealInput) => api.createMeal(user!.id, input),
    // Optimistic: the diary ring and macros update before the round-trip.
    onMutate: async (input) => {
      const loggedAt = input.loggedAt ?? new Date().toISOString();
      const day = localDayFromIso(loggedAt);
      const key = ['meals', 'day', user?.id, day] as const;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Meal[]>(key);
      const optimistic: Meal = {
        id: `optimistic-${Date.now()}`,
        loggedAt,
        name: input.name.trim(),
        mealSlot: input.mealSlot,
        photoPath: null,
        calories: Math.round(input.calories),
        proteinG: input.proteinG,
        carbsG: input.carbsG,
        fatG: input.fatG,
        source: 'manual',
      };
      queryClient.setQueryData<Meal[]>(key, [...(previous ?? []), optimistic]);
      return { key, previous };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['meals'] }),
  });
}

export function useUpdateMeal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Omit<MealInput, 'loggedAt'>>) => api.updateMeal(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['meal', id] });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMeal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meals'] }),
  });
}
