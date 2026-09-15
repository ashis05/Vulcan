import { stepKcalBonus } from '@/engine/steps';
import { supabase } from '@/lib/supabase';

import { localDateString, readDailySteps } from './health-connect';

export interface DailyActivityRow {
  activity_date: string;
  steps: number;
  step_bonus_kcal: number | null;
  target_kcal: number | null;
}

/**
 * Reads the last `days` of Health Connect steps and upserts `daily_activity`,
 * adding the step bonus on top of the base calorie target. Idempotent. Defaults
 * to 8 days so today + the last 7 completed days are available.
 */
export async function syncDailyActivity(
  userId: string,
  baseTargetKcal: number,
  weightKg: number,
  days = 8,
): Promise<number> {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const daily = await readDailySteps(start, end);
  if (daily.length === 0) return 0;

  const rows = daily.map((d) => {
    const bonus = stepKcalBonus(d.steps, weightKg);
    return {
      user_id: userId,
      activity_date: d.date,
      steps: d.steps,
      step_bonus_kcal: bonus,
      target_kcal: baseTargetKcal + bonus,
    };
  });

  const { error } = await supabase.from('daily_activity').upsert(rows, { onConflict: 'user_id,activity_date' });
  if (error) throw error;
  return rows.length;
}

export async function fetchDailyActivity(userId: string, days = 7): Promise<DailyActivityRow[]> {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('daily_activity')
    .select('activity_date, steps, step_bonus_kcal, target_kcal')
    .eq('user_id', userId)
    .gte('activity_date', localDateString(start))
    .order('activity_date', { ascending: false });
  if (error) throw error;
  return (data as DailyActivityRow[] | null) ?? [];
}
