import { useQuery } from '@tanstack/react-query';

import type { Profile } from '@/engine/types';

import { rowToProfile, type ProfileRow } from './profile';
import { supabase } from './supabase';
import { useAuth } from './use-auth';

async function fetchProfile(userId: string): Promise<Profile> {
  const { data: row, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;

  let weightKg: number | undefined;
  if (row) {
    const { data: metric, error: metricError } = await supabase
      .from('body_metrics')
      .select('weight_kg')
      .eq('user_id', userId)
      .order('measured_on', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (metricError) throw metricError;
    if (metric?.weight_kg != null) weightKg = Number(metric.weight_kg);
  }

  return rowToProfile(row as ProfileRow | null, weightKg);
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });
}