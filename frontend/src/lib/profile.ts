import type { ActivityLevel, Experience, Goal, HeightUnit, Profile, Sex, WeightUnit } from '@/engine/types';

import { supabase } from './supabase';

export type ProfileRow = {
  id: string;
  display_name: string | null;
  sex: Sex | null;
  birth_date: string | null;
  height_cm: number | null;
  height_unit: HeightUnit | null;
  weight_unit: WeightUnit | null;
  goal: Goal | null;
  pace_kg_wk: number | null;
  activity_level: ActivityLevel | null;
  experience: Experience | null;
  days_per_week: number | null;
  session_len_min: number | null;
  equipment: string[] | null;
  injuries: string[] | null;
  injuries_note: string | null;
  onboarding_completed: boolean | null;
};

export const EMPTY_PROFILE: Profile = {
  displayName: '',
  sex: null,
  birthDate: '1998-08-01',
  heightCm: 175,
  heightUnit: 'cm',
  weightKg: 82,
  weightUnit: 'kg',
  goal: null,
  paceKgWk: -0.5,
  activityLevel: 'moderate',
  experience: null,
  daysPerWeek: 4,
  sessionLenMin: 60,
  equipment: [],
  injuries: [],
  injuriesNote: '',
  onboardingCompleted: false,
};

export function rowToProfile(row: ProfileRow | null | undefined, weightKgFallback?: number): Profile {
  if (!row) return { ...EMPTY_PROFILE, weightKg: weightKgFallback ?? EMPTY_PROFILE.weightKg };
  return {
    displayName: row.display_name ?? '',
    sex: row.sex,
    birthDate: row.birth_date ?? EMPTY_PROFILE.birthDate,
    heightCm: row.height_cm ?? EMPTY_PROFILE.heightCm,
    heightUnit: row.height_unit ?? 'cm',
    weightKg: weightKgFallback ?? EMPTY_PROFILE.weightKg,
    weightUnit: row.weight_unit ?? 'kg',
    goal: row.goal,
    paceKgWk: row.pace_kg_wk ?? EMPTY_PROFILE.paceKgWk,
    activityLevel: row.activity_level ?? 'moderate',
    experience: row.experience,
    daysPerWeek: row.days_per_week ?? EMPTY_PROFILE.daysPerWeek,
    sessionLenMin: row.session_len_min ?? EMPTY_PROFILE.sessionLenMin,
    equipment: row.equipment ?? [],
    injuries: row.injuries ?? [],
    injuriesNote: row.injuries_note ?? '',
    onboardingCompleted: row.onboarding_completed ?? false,
  };
}

function todayIso(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Upsert the user's profile (onboarding_completed = true) and log today's weight. */
export async function saveProfileAndFirstMetric(userId: string, profile: Profile): Promise<void> {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      display_name: profile.displayName.trim() || null,
      sex: profile.sex,
      birth_date: profile.birthDate || null,
      height_cm: profile.heightCm,
      height_unit: profile.heightUnit,
      weight_unit: profile.weightUnit,
      goal: profile.goal,
      pace_kg_wk: profile.paceKgWk,
      activity_level: profile.activityLevel,
      experience: profile.experience,
      days_per_week: profile.daysPerWeek,
      session_len_min: profile.sessionLenMin,
      equipment: profile.equipment,
      injuries: profile.injuries,
      injuries_note: profile.injuriesNote.trim() || null,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (error) throw error;

  const { error: metricError } = await supabase
    .from('body_metrics')
    .upsert(
      { user_id: userId, measured_on: todayIso(), weight_kg: profile.weightKg },
      { onConflict: 'user_id,measured_on' },
    );
  if (metricError) throw metricError;
}

export function goalLabel(goal: Goal | null): string {
  if (goal === 'cut') return 'Cut';
  if (goal === 'bulk') return 'Bulk';
  if (goal === 'maintain') return 'Maintain';
  if (goal === 'recomp') return 'Recomp';
  return '';
}

export function formatPaceKgWk(pace: number): string {
  const sign = pace > 0 ? '+' : '−';
  return `${sign}${Math.abs(pace).toFixed(2)} kg/wk`;
}

export function goalChipLabel(goal: Goal | null, pace: number): string {
  if (!goal) return '';
  return `${goalLabel(goal)} · ${formatPaceKgWk(pace)}`;
}