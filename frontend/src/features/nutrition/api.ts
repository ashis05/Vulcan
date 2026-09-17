import { dayRangeIso } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

import type { Meal, MealInput, MealSlot } from './types';

const MEAL_COLUMNS = 'id, logged_at, name, meal_slot, photo_path, calories, protein_g, carbs_g, fat_g, source';

type MealRow = {
  id: string;
  logged_at: string;
  name: string;
  meal_slot: MealSlot;
  photo_path: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source: 'manual' | 'photo';
};

function mapMeal(row: MealRow): Meal {
  return {
    id: row.id,
    loggedAt: row.logged_at,
    name: row.name,
    mealSlot: row.meal_slot,
    photoPath: row.photo_path,
    calories: Number(row.calories) || 0,
    proteinG: Number(row.protein_g) || 0,
    carbsG: Number(row.carbs_g) || 0,
    fatG: Number(row.fat_g) || 0,
    source: row.source,
  };
}

export async function fetchMealsInRange(startIso: string, endIso: string): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('meals')
    .select(MEAL_COLUMNS)
    .gte('logged_at', startIso)
    .lt('logged_at', endIso)
    .order('logged_at', { ascending: true });
  if (error) throw error;
  return (data as MealRow[]).map(mapMeal);
}

export async function fetchDayMeals(dateIso: string): Promise<Meal[]> {
  const { start, end } = dayRangeIso(dateIso);
  return fetchMealsInRange(start, end);
}

export async function fetchRecentMeals(limit = 50): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('meals')
    .select(MEAL_COLUMNS)
    .order('logged_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as MealRow[]).map(mapMeal);
}

export async function fetchMeal(id: string): Promise<Meal> {
  const { data, error } = await supabase.from('meals').select(MEAL_COLUMNS).eq('id', id).single();
  if (error) throw error;
  return mapMeal(data as MealRow);
}

export async function createMeal(userId: string, input: MealInput): Promise<Meal> {
  const { data, error } = await supabase
    .from('meals')
    .insert({
      user_id: userId,
      logged_at: input.loggedAt ?? new Date().toISOString(),
      name: input.name.trim(),
      meal_slot: input.mealSlot,
      calories: Math.round(input.calories),
      protein_g: input.proteinG,
      carbs_g: input.carbsG,
      fat_g: input.fatG,
      source: 'manual',
    })
    .select(MEAL_COLUMNS)
    .single();
  if (error) throw error;
  return mapMeal(data as MealRow);
}

export async function updateMeal(
  id: string,
  patch: Partial<Omit<MealInput, 'loggedAt'>>,
): Promise<Meal> {
  const { data, error } = await supabase
    .from('meals')
    .update({
      ...(patch.name != null ? { name: patch.name.trim() } : {}),
      ...(patch.mealSlot != null ? { meal_slot: patch.mealSlot } : {}),
      ...(patch.calories != null ? { calories: Math.round(patch.calories) } : {}),
      ...(patch.proteinG != null ? { protein_g: patch.proteinG } : {}),
      ...(patch.carbsG != null ? { carbs_g: patch.carbsG } : {}),
      ...(patch.fatG != null ? { fat_g: patch.fatG } : {}),
    })
    .eq('id', id)
    .select(MEAL_COLUMNS)
    .single();
  if (error) throw error;
  return mapMeal(data as MealRow);
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await supabase.from('meals').delete().eq('id', id);
  if (error) throw error;
}
