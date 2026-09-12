export type Sex = 'male' | 'female';

export type Goal = 'cut' | 'recomp' | 'maintain' | 'bulk';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';

export type Experience = 'beginner' | 'intermediate' | 'advanced';

export type HeightUnit = 'cm' | 'ft';

export type WeightUnit = 'kg' | 'lb';

/** Shape collected by the onboarding wizard (and edited from the profile screen). */
export interface Profile {
  displayName: string;
  sex: Sex | null;
  /** ISO yyyy-mm-dd */
  birthDate: string;
  /** Stored internally in cm regardless of display unit. */
  heightCm: number;
  heightUnit: HeightUnit;
  /** Stored internally in kg regardless of display unit. */
  weightKg: number;
  weightUnit: WeightUnit;
  goal: Goal | null;
  /** kg/week weight-change rate the user selected on the pace slider. */
  paceKgWk: number;
  activityLevel: ActivityLevel;
  experience: Experience | null;
  daysPerWeek: number;
  sessionLenMin: number;
  equipment: string[];
  injuries: string[];
  injuriesNote: string;
  onboardingCompleted: boolean;
}

/** Output of `computeTargets`. Targets are always computed, never stored. */
export interface Targets {
  bmr: number;
  tdee: number;
  targetKcal: number;
  /**
   * Slider pace after clamping to the goal's safe direction and bodyweight-scaled
   * rate cap (kg/wk). The user's raw slider value may be higher.
   */
  effectivePaceKgWk: number;
  /** kcal/day adjustment after the ±25%-of-TDEE cap (kg/wk × 7700 ÷ 7). */
  paceDeltaKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}