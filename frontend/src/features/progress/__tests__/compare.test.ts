import { describe, expect, it } from 'vitest';

import { pickComparePair, posesWithPhotos } from '@/features/progress/compare';
import type { ProgressPhoto } from '@/features/progress/types';

function photo(id: string, pose: ProgressPhoto['pose'], takenOn: string): ProgressPhoto {
  return { id, pose, takenOn, photoPath: `${id}.jpg`, analysis: null };
}

// fetchProgressPhotos returns newest-first.
const photos: ProgressPhoto[] = [
  photo('d', 'front', '2026-09-01'),
  photo('c', 'back', '2026-08-15'),
  photo('b', 'front', '2026-07-01'),
  photo('a', 'front', '2026-06-01'),
];

describe('pickComparePair', () => {
  it('returns the oldest and newest check-in for a pose', () => {
    const pair = pickComparePair(photos, 'front');
    expect(pair?.first.id).toBe('a');
    expect(pair?.latest.id).toBe('d');
  });

  it('ignores other poses', () => {
    expect(pickComparePair(photos, 'side')).toBeNull();
  });

  it('returns null with fewer than two check-ins for the pose', () => {
    expect(pickComparePair([photo('x', 'back', '2026-09-01')], 'back')).toBeNull();
  });
});

describe('posesWithPhotos', () => {
  it('lists distinct poses in newest-first order', () => {
    expect(posesWithPhotos(photos)).toEqual(['front', 'back']);
  });

  it('is empty for no photos', () => {
    expect(posesWithPhotos([])).toEqual([]);
  });
});
