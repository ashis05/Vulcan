import { apiFetch } from '@/lib/api';

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

/**
 * Search the food catalog through FastAPI: local `foods` (INDB + customs) plus
 * Open Food Facts packaged products. The app never calls OFF directly.
 */
export async function searchFoods(
  token: string,
  query: string,
  limit = 12,
): Promise<FoodItem[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const rows = await apiFetch<FoodRow[]>(
    `/foods/search?q=${encodeURIComponent(term)}&limit=${limit}`,
    { token },
  );
  return rows.map(mapFood);
}
