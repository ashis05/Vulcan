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
  const blob = await response.blob();

  const path = `${userId}/${uuidv4()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return path;
}
