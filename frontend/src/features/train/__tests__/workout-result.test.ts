import { describe, expect, it } from 'vitest';

import type { SessionExercise, SessionSet } from '../session-store';
import type { Exercise } from '../types';
import { buildWorkoutResult } from '../workout-result';

function makeExercise(id: string, name: string): Exercise {
  return {
    id,
    userId: null,
    name,
    primaryMuscle: 'chest',
    secondaryMuscles: [],
    equipment: 'barbell',
    isCustom: false,
    mediaUrl: null,
  };
}

function makeSet(partial: Partial<SessionSet> & Pick<SessionSet, 'setNumber'>): SessionSet {
  return {
    key: `set_${partial.setNumber}`,
    type: 'normal',
    weightKg: '',
    reps: '',
    rpe: '',
    completed: false,
    ...partial,
  };
}

function sessionExercise(exercise: Exercise, sets: SessionSet[]): SessionExercise {
  return { key: `ex_${exercise.id}`, exercise, restSeconds: 120, supersetGroup: null, sets };
}

const baseInput = {
  workoutId: 'w1',
  userId: 'u1',
  routineId: null,
  routineName: null,
  startedAt: 0,
  endedAt: 120_000,
  history: {} as Record<string, { weightKg: number; reps: number }[]>,
};

describe('buildWorkoutResult', () => {
  it('drops unfinished sets, excludes warmups from volume, flags the first-ever set as a PR', () => {
    const bench = makeExercise('e1', 'Bench Press');
    const exercises = [
      sessionExercise(bench, [
        makeSet({ setNumber: 1, weightKg: '60', reps: '8', completed: true }),
        makeSet({ setNumber: 2, weightKg: '40', reps: '10', type: 'warmup', completed: true }),
        makeSet({ setNumber: 3, weightKg: '70', reps: '5', completed: false }),
      ]),
    ];

    const result = buildWorkoutResult({ ...baseInput, exercises });

    expect(result.payload.sets).toHaveLength(2);
    expect(result.completedSets).toBe(2);
    expect(result.volume).toBe(60 * 8); // warmup excluded
    expect(result.durationSec).toBe(120);
    expect(result.prs).toHaveLength(1);
    expect(result.prs[0].exerciseName).toBe('Bench Press');
    expect(result.payload.sets[0].is_pr).toBe(true);
  });

  it('treats equal performance against history as not a PR', () => {
    const bench = makeExercise('e1', 'Bench Press');
    const exercises = [
      sessionExercise(bench, [makeSet({ setNumber: 1, weightKg: '100', reps: '5', completed: true })]),
    ];

    const result = buildWorkoutResult({
      ...baseInput,
      exercises,
      history: { e1: [{ weightKg: 100, reps: 5 }] },
    });

    expect(result.prs).toHaveLength(0);
    expect(result.payload.sets[0].is_pr).toBe(false);
    expect(result.volume).toBe(500);
  });

  it('flags a new max weight as a PR', () => {
    const bench = makeExercise('e1', 'Bench Press');
    const exercises = [
      sessionExercise(bench, [makeSet({ setNumber: 1, weightKg: '105', reps: '3', completed: true })]),
    ];

    const result = buildWorkoutResult({
      ...baseInput,
      exercises,
      history: { e1: [{ weightKg: 100, reps: 5 }] },
    });

    expect(result.prs).toHaveLength(1);
    expect(result.prs[0].kind).toBe('weight');
    expect(result.payload.sets[0].is_pr).toBe(true);
  });

  it('drops a completed set with no reps recorded', () => {
    const bench = makeExercise('e1', 'Bench Press');
    const exercises = [
      sessionExercise(bench, [makeSet({ setNumber: 1, weightKg: '100', reps: '', completed: true })]),
    ];

    const result = buildWorkoutResult({ ...baseInput, exercises });
    expect(result.payload.sets).toHaveLength(0);
    expect(result.completedSets).toBe(0);
  });
});
