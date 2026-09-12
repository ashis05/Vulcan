import { tdeeFromBmr, bmrKatchMcArdle, bmrMifflinStJeor, leanMassKg } from './tdee';
import type { ActivityLevel, Goal, Sex, Targets } from './types';

/** Energy value of a kg of body mass (≈7700 kcal). */
export const KCAL_PER_KG_BODYFAT = 7700;
export const DAYS_PER_WEEK = 7;

export const PROTEIN_PER_KG_CUT = 2.2;
export const PROTEIN_PER_KG_MAINTENANCE = 1.8;
export const FAT_PCT_OF_KCAL = 0.25;

/** Safety floors: 1500 male / 1200 female kcal/day. */
export const KCAL_FLOOR: Record<Sex, number> = { male: 1500, female: 1200 };

/** A pace-driven deficit/surplus may never exceed this share of TDEE. */
export const MAX_PACE_DELTA_TDEE_PCT = 0.25;
/** Safe weekly rate caps as a fraction of bodyweight (cut ≈1%/wk, bulk ≈0.5%/wk). */
export const MAX_CUT_RATE_PCT_BW = 0.01;
export const MAX_BULK_RATE_PCT_BW = 0.005;

/** Where the pace slider starts for each goal (kg/week). */
export const DEFAULT_PACE_KG_WK: Record<Goal, number> = {
  cut: -0.5,
  recomp: -0.5,
  maintain: 0,
  bulk: 0.3,
};

/** kg/week rate → kcal/day delta (×7700 ÷ 7). */
export function paceToKcalDelta(paceKgWk: number): number {
  return Math.round((paceKgWk * KCAL_PER_KG_BODYFAT) / DAYS_PER_WEEK);
}

/**
 * Largest safe weekly rate (kg/wk) for a goal, scaled to bodyweight:
 * cut/recomp ≤1% BW/wk, bulk ≤0.5% BW/wk, maintain 0.
 */
export function maxPaceKgWk(weightKg: number, goal: Goal): number {
  if (goal === 'bulk') return Math.round(MAX_BULK_RATE_PCT_BW * weightKg * 100) / 100;
  if (goal === 'cut' || goal === 'recomp') return Math.round(MAX_CUT_RATE_PCT_BW * weightKg * 100) / 100;
  return 0;
}

/** Clamp a slider pace to its goal's safe direction and bodyweight-scaled rate cap. */
export function clampPaceKgWk(paceKgWk: number, weightKg: number, goal: Goal): number {
  const max = maxPaceKgWk(weightKg, goal);
  if (goal === 'maintain') return 0;
  if (goal === 'bulk') return Math.min(Math.max(paceKgWk, 0), max);
  return Math.max(Math.min(paceKgWk, 0), -max);
}

export interface ComputeTargetsInput {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  paceKgWk: number;
  /**
   * Optional body-fat % (0–100). When present, BMR uses Katch-McArdle with lean
   * mass instead of Mifflin-St Jeor.
   */
  bodyfatPct?: number | null;
}

export function computeTargets(input: ComputeTargetsInput): Targets {
  const { sex, weightKg, heightCm, ageYears, activityLevel, goal, paceKgWk, bodyfatPct } = input;

  const useKatch = bodyfatPct != null && bodyfatPct > 0 && bodyfatPct < 100;
  const bmr = useKatch
    ? bmrKatchMcArdle(leanMassKg(weightKg, bodyfatPct))
    : bmrMifflinStJeor(sex, weightKg, heightCm, ageYears);
  const tdee = tdeeFromBmr(bmr, activityLevel);

  const effectivePaceKgWk = clampPaceKgWk(paceKgWk, weightKg, goal);
  const maxDeltaKcal = Math.round(tdee * MAX_PACE_DELTA_TDEE_PCT);
  const paceDeltaKcal = Math.max(
    -maxDeltaKcal,
    Math.min(maxDeltaKcal, paceToKcalDelta(effectivePaceKgWk)),
  );
  const targetKcal = Math.max(KCAL_FLOOR[sex], Math.round(tdee + paceDeltaKcal));

  const proteinPerKg = goal === 'cut' ? PROTEIN_PER_KG_CUT : PROTEIN_PER_KG_MAINTENANCE;
  const proteinG = Math.round(proteinPerKg * weightKg);
  const fatG = Math.round((targetKcal * FAT_PCT_OF_KCAL) / 9);
  const carbsG = Math.max(0, Math.round((targetKcal - proteinG * 4 - fatG * 9) / 4));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetKcal,
    effectivePaceKgWk,
    paceDeltaKcal,
    proteinG,
    carbsG,
    fatG,
  };
}