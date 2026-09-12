export type SetType = 'warmup' | 'normal' | 'drop' | 'failure';

export type PRKind = 'weight' | 'reps' | 'e1rm';

export interface PerformedSet {
  weightKg: number;
  reps: number;
  setType?: SetType;
}

const WEIGHT_EPSILON = 0.001;

/**
 * Epley estimated 1RM: `weight × (1 + reps / 30)`.
 * At a single rep Epley overestimates, so the weight itself is returned.
 */
export function estimated1RM(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function setVolume(set: PerformedSet): number {
  return set.weightKg * set.reps;
}

/** Working volume: sum of `weight × reps`, excluding warmup sets. */
export function totalVolume(sets: PerformedSet[]): number {
  return sets
    .filter((s) => s.setType !== 'warmup')
    .reduce((sum, s) => sum + setVolume(s), 0);
}

/**
 * PR detection against prior performances of the same exercise.
 * Beats the prior best on max weight → `weight`; on reps at the same weight →
 * `reps`; on estimated 1RM → `e1rm`. The first-ever set is always a PR. Equal
 * performance is never a PR.
 */
export function detectPR(candidate: PerformedSet, prior: PerformedSet[]): PRKind | null {
  if (prior.length === 0) return 'e1rm';

  const bestWeight = Math.max(...prior.map((s) => s.weightKg));
  if (candidate.weightKg > bestWeight + WEIGHT_EPSILON) return 'weight';

  const sameWeight = prior.filter((s) => Math.abs(s.weightKg - candidate.weightKg) <= WEIGHT_EPSILON);
  if (sameWeight.length > 0 && candidate.reps > Math.max(...sameWeight.map((s) => s.reps))) {
    return 'reps';
  }

  const bestE1rm = Math.max(...prior.map((s) => estimated1RM(s.weightKg, s.reps)));
  if (estimated1RM(candidate.weightKg, candidate.reps) > bestE1rm) return 'e1rm';

  return null;
}

/**
 * Stall detection: no e1RM improvement across `window` consecutive exposures.
 * `e1rmHistory` is chronological (oldest → newest) per-exercise best e1RM.
 */
export function detectStall(e1rmHistory: number[], window = 3): boolean {
  if (e1rmHistory.length <= window) return false;
  const recentBest = Math.max(...e1rmHistory.slice(-window));
  const priorBest = Math.max(...e1rmHistory.slice(0, -window));
  return recentBest <= priorBest;
}
