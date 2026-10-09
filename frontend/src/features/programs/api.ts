import { ApiError, apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';

import type { ActiveProgram, ProgramPayload } from './types';

/** FastAPI — the app never calls Gemini directly. Generation also persists + applies. */
export function generateProgram(
  token: string,
  input: { notes?: string; focusAreas?: string[] },
): Promise<ProgramPayload> {
  return apiFetch<ProgramPayload>('/ai/generate-program', {
    method: 'POST',
    token,
    body: { notes: input.notes ?? null, focus_areas: input.focusAreas ?? [] },
  });
}

export async function fetchActiveProgram(token: string): Promise<ActiveProgram | null> {
  try {
    return await apiFetch<ActiveProgram>('/ai/program/active', { token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Pacific date (yyyy-mm-dd) of the last program forging, or null (never). */
export async function fetchLastForgedDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from('ai_usage')
    .select('usage_date')
    .eq('feature', 'program')
    .gt('count', 0)
    .order('usage_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as { usage_date: string } | null)?.usage_date ?? null;
}

/** Rename a stored program (owner update via RLS), keeping the payload in sync. */
export async function renameProgram(
  id: string,
  payload: ProgramPayload,
  name: string,
): Promise<void> {
  const { error } = await supabase
    .from('programs')
    .update({ payload: { ...payload, name: name.trim() } })
    .eq('id', id);
  if (error) throw error;
}
