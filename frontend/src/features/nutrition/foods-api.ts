import { supabase } from '@/lib/supabase';

const FOOD_COLUMNS = 'id, name, serving_description, kcal, protein_g, carbs_g, fat_g, source';

export type FoodSource = 'indb' | 'off' | 'custom';

export interface FoodItem {
  id: string;
  name: string;
  servingDescription: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: FoodSource;
}

type FoodRow = {
  id: string;
  name: string;
  serving_description: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source: FoodSource;
};

function mapFood(row: FoodRow): FoodItem {
  return {
    id: row.id,
    name: row.name,
    servingDescription: row.serving_description,
    kcal: Number(row.kcal) || 0,
    proteinG: Number(row.protein_g) || 0,
    carbsG: Number(row.carbs_g) || 0,
    fatG: Number(row.fat_g) || 0,
    source: row.source,
  };
}

/** Name search over the global catalog + the user's own custom foods (RLS-scoped). */
export async function searchFoods(query: string, limit = 12): Promise<FoodItem[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const { data, error } = await supabase
    .from('foods')
    .select(FOOD_COLUMNS)
    .ilike('name', `%${term}%`)
    .order('name', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data as FoodRow[]).map(mapFood);
}
