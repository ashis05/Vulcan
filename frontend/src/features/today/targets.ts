import { useMemo } from 'react';

import { adaptiveTdee, computeTargets } from '@/engine/targets';
import { trendAdjustment } from '@/engine/steps';
import { ageFromBirthDate } from '@/engine/units';
import { useMealsRange } from '@/features/nutrition/hooks';
import { mealsByLocalDay } from '@/features/nutrition/types';
import { addDays, dayRangeIso, localDateString } from '@/lib/dates';
import { useAuth } from '@/lib/use-auth';
import { useProfile } from '@/lib/use-profile';

import { useDailyActivity } from './hooks';
import { useTargetOffset } from './target-offset';
import { useWeights } from './weight';

/** Rolling window for the adaptive maintenance estimate. */
export const ADAPTIVE_WINDOW_DAYS = 21;
/** Days with both weight and logged intake required before adaptive TDEE is trusted. */
export const ADAPTIVE_MIN_DAYS = 10;
/** Window shown in the trend-review card. */
export const TREND_REVIEW_DAYS = 14;

export interface DailyTargets {
  /** Base target + confirmed offset, before today's step bonus. */
  baseTargetKcal: number;
  /** What the Today ring counts against: base + step bonus. */
  targetKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  tdee: number;
  stepBonusKcal: number;
  offsetKcal: number;
  /** True when the maintenance estimate came from real intake/weight data. */
  adaptive: boolean;
}

function adaptiveWindow(): { start: string; end: string } {
  const start = dayRangeIso(localDateString(addDays(new Date(), -(ADAPTIVE_WINDOW_DAYS - 1)))).start;
  const end = dayRangeIso(localDateString(new Date())).end;
  return { start, end };
}

/** Computes the day's calorie + macro targets from the profile, real data, and steps. */
export function useDailyTargets() {
  const { user } = useAuth();
  const profileQuery = useProfile();
  const activity = useDailyActivity(8);
  const offset = useTargetOffset(user?.id);
  const weights = useWeights(ADAPTIVE_WINDOW_DAYS);
  const window = useMemo(() => adaptiveWindow(), []);
  const meals = useMealsRange(window.start, window.end);

  const profile = profileQuery.data;
  const today = localDateString(new Date());
  const todayBonus =
    (activity.data ?? []).find((day) => day.activity_date === today)?.step_bonus_kcal ?? 0;

  const targets = useMemo<DailyTargets | null>(() => {
    if (!profile || !profile.sex || !profile.goal) return null;

    const intakeByDay = mealsByLocalDay(meals.data ?? []);
    const aligned = (weights.data ?? []).filter((entry) => (intakeByDay[entry.date] ?? 0) > 0);
    const adaptive =
      aligned.length >= ADAPTIVE_MIN_DAYS
        ? adaptiveTdee(
            aligned.map((entry) => intakeByDay[entry.date]),
            aligned.map((entry) => entry.weightKg),
          )
        : null;

    const base = computeTargets({
      sex: profile.sex,
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      ageYears: ageFromBirthDate(profile.birthDate),
      activityLevel: profile.activityLevel,
      goal: profile.goal,
      paceKgWk: profile.paceKgWk,
      tdeeOverride: adaptive,
    });

    return {
      baseTargetKcal: base.targetKcal + offset,
      targetKcal: base.targetKcal + offset + todayBonus,
      proteinG: base.proteinG,
      carbsG: base.carbsG,
      fatG: base.fatG,
      tdee: base.tdee,
      stepBonusKcal: todayBonus,
      offsetKcal: offset,
      adaptive: adaptive != null,
    };
  }, [profile, meals.data, weights.data, offset, todayBonus]);

  return {
    targets,
    profile,
    isPending: profileQuery.isPending || activity.isPending,
  };
}

/** kcal/day the 14-day weight trend suggests adding/removing, or 0. */
export function useTrendSuggestion(): number {
  const profile = useProfile();
  const weights = useWeights(TREND_REVIEW_DAYS);
  const goal = profile.data?.goal ?? null;
  const entries = weights.data;
  return useMemo(() => {
    if (!goal || !entries) return 0;
    return trendAdjustment(
      entries.map((entry) => entry.weightKg),
      goal,
    );
  }, [goal, entries]);
}
