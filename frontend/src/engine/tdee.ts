import type { ActivityLevel, Sex } from './types';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
};

/**
 * Mifflin-St Jeor BMR.
 * male: 10w + 6.25h − 5a + 5 · female: 10w + 6.25h − 5a − 161
 */
export function bmrMifflinStJeor(sex: Sex, weightKg: number, heightCm: number, ageYears: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return base + (sex === 'male' ? 5 : -161);
}

/**
 * Katch-McArdle BMR from lean body mass (kg): 370 + 21.6 × LBM.
 * More accurate than Mifflin-St Jeor when body-fat % is known, because lean mass
 * is the metabolically active compartment and it skips the sex/height proxies.
 */
export function bmrKatchMcArdle(leanMassKg: number): number {
  return 370 + 21.6 * leanMassKg;
}

/** Convert total weight + body-fat % to lean body mass (kg). */
export function leanMassKg(weightKg: number, bodyfatPct: number): number {
  return weightKg * (1 - bodyfatPct / 100);
}

export function tdeeFromBmr(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}