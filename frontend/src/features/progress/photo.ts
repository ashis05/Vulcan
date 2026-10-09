import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

import { uuidv4 } from '@/lib/id';
import { supabase } from '@/lib/supabase';

const BUCKET = 'progress-photos';
const MAX_WIDTH = 1200;

/** Resize/compress a local photo and upload it to the private `progress-photos` bucket. */
export async function uploadProgressPhoto(userId: string, uri: string): Promise<string> {
  const resized = await manipulateAsync(uri, [{ resize: { width: MAX_WIDTH } }], {
    compress: 0.75,
    format: SaveFormat.JPEG,
  });

  const response = await fetch(resized.uri);
  const bytes = await response.arrayBuffer();

  const path = `${userId}/${uuidv4()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return path;
}
