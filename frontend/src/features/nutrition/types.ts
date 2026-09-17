import { addDays, localDateString, localDayFromIso } from '@/lib/dates';

import type { Macros } from '@/components/ui/MacroBar';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export type MealSource = 'manual' | 'photo';

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

export interface Meal {
  id: string;
  loggedAt: string;
  name: string;
  mealSlot: MealSlot;
  photoPath: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: MealSource;
}

export interface MealInput {
  name: string;
  mealSlot: MealSlot;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt?: string;
}

/** Best-guess diary section from the local time of day. */
export function slotForTime(date: Date): MealSlot {
  const hour = date.getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snacks';
}

export function mealTotals(meals: Meal[]): Macros & { kcal: number } {
  return meals.reduce(
    (totals, meal) => ({
      kcal: totals.kcal + meal.calories,
      protein: totals.protein + meal.proteinG,
      carbs: totals.carbs + meal.carbsG,
      fat: totals.fat + meal.fatG,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function groupBySlot(meals: Meal[]): Record<MealSlot, Meal[]> {
  const groups: Record<MealSlot, Meal[]> = { breakfast: [], lunch: [], dinner: [], snacks: [] };
  for (const meal of meals) {
    groups[meal.mealSlot].push(meal);
  }
  for (const slot of MEAL_SLOTS) {
    groups[slot].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  }
  return groups;
}

/** Consecutive logged days ending today (or yesterday when today is still empty). */
export function currentStreak(meals: Meal[], todayIso: string): number {
  if (meals.length === 0) return 0;
  const days = new Set(meals.map((meal) => localDayFromIso(meal.loggedAt)));
  let cursor = new Date(`${todayIso}T12:00:00`);
  if (!days.has(todayIso)) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days.has(localDateString(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function mealsByLocalDay(meals: Meal[]): Record<string, number> {
  const byDay: Record<string, number> = {};
  for (const meal of meals) {
    const day = localDayFromIso(meal.loggedAt);
    byDay[day] = (byDay[day] ?? 0) + meal.calories;
  }
  return byDay;
}
