import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addDays, localDateString } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/use-auth';

export interface WeightEntry {
  date: string;
  weightKg: number;
}

export async function fetchWeights(userId: string, days: number): Promise<WeightEntry[]> {
  const start = localDateString(addDays(new Date(), -(days - 1)));
  const { data, error } = await supabase
    .from('body_metrics')
    .select('measured_on, weight_kg')
    .eq('user_id', userId)
    .gte('measured_on', start)
    .order('measured_on', { ascending: true });
  if (error) throw error;
  return (data as { measured_on: string; weight_kg: number }[]).map((row) => ({
    date: row.measured_on,
    weightKg: Number(row.weight_kg),
  }));
}

export async function logWeight(
  userId: string,
  dateIso: string,
  weightKg: number,
): Promise<void> {
  const { error } = await supabase
    .from('body_metrics')
    .upsert(
      { user_id: userId, measured_on: dateIso, weight_kg: weightKg },
      { onConflict: 'user_id,measured_on' },
    );
  if (error) throw error;
}

export function useWeights(days = 21) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['weights', user?.id, days],
    queryFn: () => fetchWeights(user!.id, days),
    enabled: !!user,
  });
}

export function useLogWeight() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, weightKg }: { date: string; weightKg: number }) =>
      logWeight(user!.id, date, weightKg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weights'] });
      // The profile's weight drives target computation, so refresh it too.
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/** Latest weight + the change over the supplied series (newest minus oldest). */
export function weightDelta(entries: WeightEntry[]): number | null {
  if (entries.length < 2) return null;
  return Math.round((entries[entries.length - 1].weightKg - entries[0].weightKg) * 10) / 10;
}
