import type { Goal } from './types';

/** Per-step bonus per kg of bodyweight (kcal). Used from Phase 3 onward. */
export const STEP_BONUS_PER_KG_PER_STEP = 0.0005;

export function stepKcalBonus(steps: number, weightKg: number): number {
  return Math.round(steps * weightKg * STEP_BONUS_PER_KG_PER_STEP);
}

/** Rolling window for weight-trend review (days). */
export const TREND_WINDOW_DAYS = 14;
/** kcal/day nudge when the trend contradicts the goal. */
export const TREND_ADJUSTMENT_KCAL = 100;
/** A weight change smaller than this counts as "no meaningful movement" (kg). */
export const MIN_TREND_KG = 0.2;

/**
 * Suggests a daily calorie nudge when the 14-day weight trend contradicts the
 * goal: no loss on a cut/recomp → −100; no gain on a bulk → +100; else 0.
 * `weightsKg` is chronological (oldest → newest).
 */
export function trendAdjustment(weightsKg: number[], goal: Goal): number {
  if (goal === 'maintain' || weightsKg.length < 2) return 0;
  const delta = weightsKg[weightsKg.length - 1] - weightsKg[0];
  if ((goal === 'cut' || goal === 'recomp') && delta > -MIN_TREND_KG) return -TREND_ADJUSTMENT_KCAL;
  if (goal === 'bulk' && delta < MIN_TREND_KG) return TREND_ADJUSTMENT_KCAL;
  return 0;
}