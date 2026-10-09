import type { PhotoPose, ProgressPhoto } from './types';

export interface ComparePair {
  first: ProgressPhoto;
  latest: ProgressPhoto;
}

/**
 * Pick the oldest and newest check-in for a pose. Photos arrive newest-first
 * (see `fetchProgressPhotos`). Returns null when fewer than two exist.
 */
export function pickComparePair(
  photos: ProgressPhoto[],
  pose: PhotoPose,
): ComparePair | null {
  const forPose = photos.filter((p) => p.pose === pose);
  if (forPose.length < 2) return null;
  return { first: forPose[forPose.length - 1], latest: forPose[0] };
}

/** Distinct poses that have at least one check-in, newest-first order preserved. */
export function posesWithPhotos(photos: ProgressPhoto[]): PhotoPose[] {
  const seen: PhotoPose[] = [];
  for (const photo of photos) {
    if (!seen.includes(photo.pose)) seen.push(photo.pose);
  }
  return seen;
}
