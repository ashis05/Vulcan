import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

import { uuidv4 } from '@/lib/id';
import { supabase } from '@/lib/supabase';

const BUCKET = 'food-photos';
const MAX_WIDTH = 1600;

/** Resize/compress a local photo and upload it to the private `food-photos` bucket. */
export async function uploadMealPhoto(userId: string, uri: string): Promise<string> {
  const resized = await manipulateAsync(uri, [{ resize: { width: MAX_WIDTH } }], {
    compress: 0.7,
    format: SaveFormat.JPEG,
  });

  const response = await fetch(resized.uri);
  // Upload raw bytes (not a Blob) so Supabase applies our contentType — a
  // Blob's empty/incorrect type gets stored as `text/plain`, which then makes
  // Gemini treat the image as text.
  const bytes = await response.arrayBuffer();

  const path = `${userId}/${uuidv4()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return path;
}
