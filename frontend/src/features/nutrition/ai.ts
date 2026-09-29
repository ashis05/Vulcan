import { apiFetch } from '@/lib/api';
import { pacificDateString } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

export type FoodConfidence = 'low' | 'medium' | 'high';

/**
 * Must match `QUOTA_FOOD_PER_DAY` on the backend (PLAN.md §7).
 * Set `EXPO_PUBLIC_AI_QUOTA_ENABLED=false` to hide quota meters and gates
 * (must mirror the backend `QUOTA_ENABLED`).
 */
export const AI_QUOTA_ENABLED = process.env.EXPO_PUBLIC_AI_QUOTA_ENABLED !== 'false';
export const FOOD_SCAN_LIMIT = 5;

export interface FoodEstimate {
  name: string;
  serving_description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: FoodConfidence;
  notes: string;
}

/** FastAPI — the app never calls Gemini directly. */
export function analyzeFoodPhoto(
  token: string,
  photoPath: string,
  hint?: string,
): Promise<FoodEstimate> {
  return apiFetch<FoodEstimate>('/ai/analyze-food', {
    method: 'POST',
    token,
    body: { photo_path: photoPath, hint },
  });
}

/** How many food scans the user has used today (owner-readable `ai_usage` row). */
export async function fetchFoodScansToday(): Promise<number> {
  const { data, error } = await supabase
    .from('ai_usage')
    .select('count')
    .eq('feature', 'food')
    .eq('usage_date', pacificDateString())
    .maybeSingle();
  if (error) throw error;
  return Number((data as { count: number } | null)?.count ?? 0);
}
