import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';

import type { PhotoPose, PhysiqueAnalysis, ProgressPhoto } from './types';

const COLUMNS = 'id, taken_on, pose, photo_path, analysis';

type PhotoRow = {
  id: string;
  taken_on: string;
  pose: PhotoPose;
  photo_path: string;
  analysis: PhysiqueAnalysis | null;
};

function mapPhoto(row: PhotoRow): ProgressPhoto {
  return {
    id: row.id,
    takenOn: row.taken_on,
    pose: row.pose,
    photoPath: row.photo_path,
    analysis: row.analysis,
  };
}

export async function fetchProgressPhotos(): Promise<ProgressPhoto[]> {
  const { data, error } = await supabase
    .from('progress_photos')
    .select(COLUMNS)
    .order('taken_on', { ascending: false });
  if (error) throw error;
  return (data as PhotoRow[]).map(mapPhoto);
}

export async function createProgressPhoto(
  userId: string,
  input: { pose: PhotoPose; photoPath: string },
): Promise<ProgressPhoto> {
  const { data, error } = await supabase
    .from('progress_photos')
    .insert({ user_id: userId, pose: input.pose, photo_path: input.photoPath })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return mapPhoto(data as PhotoRow);
}

export async function deleteProgressPhoto(id: string): Promise<void> {
  const { error } = await supabase.from('progress_photos').delete().eq('id', id);
  if (error) throw error;
}

export async function saveAnalysis(id: string, analysis: PhysiqueAnalysis): Promise<void> {
  const { error } = await supabase.from('progress_photos').update({ analysis }).eq('id', id);
  if (error) throw error;
}

export function analyzePhysique(
  token: string,
  photoPaths: string[],
  compareTo?: string,
): Promise<PhysiqueAnalysis> {
  return apiFetch<PhysiqueAnalysis>('/ai/analyze-physique', {
    method: 'POST',
    token,
    body: { photo_paths: photoPaths, compare_to: compareTo ?? null },
  });
}

/** Owner-scoped signed URL so the private photo can be displayed in the app. */
export async function createSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('progress-photos').createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}
