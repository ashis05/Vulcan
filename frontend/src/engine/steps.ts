/** Per-step bonus per kg of bodyweight (kcal). Used from Phase 3 onward. */
export const STEP_BONUS_PER_KG_PER_STEP = 0.0005;

export function stepKcalBonus(steps: number, weightKg: number): number {
  return Math.round(steps * weightKg * STEP_BONUS_PER_KG_PER_STEP);
}