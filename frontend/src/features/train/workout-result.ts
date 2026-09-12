import { detectPR, estimated1RM, totalVolume, type PRKind, type PerformedSet } from '@/engine/strength';
import { uuidv4 } from '@/lib/id';

import type { SessionExercise } from './session-store';

export interface WorkoutSetPayload {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  set_type: string;
  superset_group: string | null;
  reps: number | null;
  weight_kg: number | null;
  rpe: number | null;
  completed: boolean;
  is_pr: boolean;
}

export interface WorkoutPayload {
  workout: {
    id: string;
    user_id: string;
    routine_id: string | null;
    started_at: string;
    ended_at: string;
    notes: string;
  };
  sets: WorkoutSetPayload[];
}

export interface WorkoutPR {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  kind: PRKind;
  e1rm: number;
}

export interface WorkoutResult {
  workoutId: string;
  routineName: string | null;
  durationSec: number;
  volume: number;
  completedSets: number;
  prs: WorkoutPR[];
  payload: WorkoutPayload;
}

export interface BuildWorkoutResultInput {
  workoutId: string;
  userId: string;
  routineId: string | null;
  routineName: string | null;
  startedAt: number;
  endedAt: number;
  notes?: string;
  exercises: SessionExercise[];
  /** Prior completed sets per exercise (chronological), used for PR detection. */
  history: Record<string, { weightKg: number; reps: number }[]>;
}

function parseRpe(value: string): number | null {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Turns the local session into a persistable workout: drops unfinished/invalid
 * sets, flags PRs against prior history (first-ever set is a PR), and computes
 * working volume (warmups excluded).
 */
export function buildWorkoutResult(input: BuildWorkoutResultInput): WorkoutResult {
  const sets: WorkoutSetPayload[] = [];
  const prs: WorkoutPR[] = [];
  const workingSets: PerformedSet[] = [];

  for (const item of input.exercises) {
    const prior = [...(input.history[item.exercise.id] ?? [])];

    for (const set of item.sets) {
      const weight = parseFloat(set.weightKg);
      const reps = parseInt(set.reps, 10);
      const valid =
        set.completed && Number.isFinite(weight) && weight >= 0 && Number.isFinite(reps) && reps > 0;
      if (!valid) continue;

      const kind = detectPR({ weightKg: weight, reps }, prior);
      prior.push({ weightKg: weight, reps });

      if (kind) {
        prs.push({
          exerciseId: item.exercise.id,
          exerciseName: item.exercise.name,
          weightKg: weight,
          reps,
          kind,
          e1rm: Math.round(estimated1RM(weight, reps)),
        });
      }

      workingSets.push({ weightKg: weight, reps, setType: set.type });
      sets.push({
        id: uuidv4(),
        workout_id: input.workoutId,
        exercise_id: item.exercise.id,
        set_number: set.setNumber,
        set_type: set.type,
        superset_group: item.supersetGroup,
        reps,
        weight_kg: weight,
        rpe: parseRpe(set.rpe),
        completed: true,
        is_pr: kind !== null,
      });
    }
  }

  return {
    workoutId: input.workoutId,
    routineName: input.routineName,
    durationSec: Math.max(0, Math.round((input.endedAt - input.startedAt) / 1000)),
    volume: Math.round(totalVolume(workingSets)),
    completedSets: workingSets.length,
    prs,
    payload: {
      workout: {
        id: input.workoutId,
        user_id: input.userId,
        routine_id: input.routineId,
        started_at: new Date(input.startedAt).toISOString(),
        ended_at: new Date(input.endedAt).toISOString(),
        notes: input.notes ?? '',
      },
      sets,
    },
  };
}
