import { estimated1RM } from '@/engine/strength';
import { supabase } from '@/lib/supabase';

import type {
  Equipment,
  Exercise,
  ExerciseStats,
  MuscleGroup,
  Routine,
  RoutineDraftExercise,
  RoutineExercise,
  RoutineSource,
  WorkoutDetail,
  WorkoutExerciseGroup,
  WorkoutHistoryItem,
} from './types';

type ExerciseRow = {
  id: string;
  user_id: string | null;
  name: string;
  primary_muscle: MuscleGroup;
  secondary_muscles: MuscleGroup[] | null;
  equipment: Equipment;
  is_custom: boolean;
  media_url: string | null;
};

type RoutineExerciseRow = {
  id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number | null;
  target_reps: string | null;
  target_rpe: number | null;
  superset_group: string | null;
  rest_seconds: number | null;
  exercises: ExerciseRow | ExerciseRow[] | null;
};

type RoutineRow = {
  id: string;
  name: string;
  source: RoutineSource;
  day_label: string | null;
  sort_order: number;
  program_id: string | null;
  routine_exercises: RoutineExerciseRow[] | null;
};

const EXERCISE_COLUMNS =
  'id, user_id, name, primary_muscle, secondary_muscles, equipment, is_custom, media_url';

const ROUTINE_SELECT = `id, name, source, day_label, sort_order, program_id,
  routine_exercises ( id, exercise_id, sort_order, target_sets, target_reps, target_rpe, superset_group, rest_seconds,
    exercises ( ${EXERCISE_COLUMNS} ) )`;

function mapExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    primaryMuscle: row.primary_muscle,
    secondaryMuscles: row.secondary_muscles ?? [],
    equipment: row.equipment,
    isCustom: row.is_custom,
    mediaUrl: row.media_url,
  };
}

function mapRoutineExercise(row: RoutineExerciseRow): RoutineExercise | null {
  const exercise = Array.isArray(row.exercises) ? row.exercises[0] : row.exercises;
  if (!exercise) return null;
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    exercise: mapExercise(exercise),
    sortOrder: row.sort_order,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    targetRpe: row.target_rpe,
    restSeconds: row.rest_seconds,
    supersetGroup: row.superset_group,
  };
}

function mapRoutine(row: RoutineRow): Routine {
  const exercises = (row.routine_exercises ?? [])
    .map(mapRoutineExercise)
    .filter((e): e is RoutineExercise => e !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    dayLabel: row.day_label,
    sortOrder: row.sort_order,
    programId: row.program_id,
    exercises,
  };
}

export async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select(EXERCISE_COLUMNS)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as ExerciseRow[]).map(mapExercise);
}

export async function createCustomExercise(
  userId: string,
  input: { name: string; primaryMuscle: MuscleGroup; equipment: Equipment },
): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      primary_muscle: input.primaryMuscle,
      secondary_muscles: [],
      equipment: input.equipment,
      is_custom: true,
    })
    .select(EXERCISE_COLUMNS)
    .single();
  if (error) throw error;
  return mapExercise(data as ExerciseRow);
}

export async function fetchRoutines(): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('routines')
    .select(ROUTINE_SELECT)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as unknown as RoutineRow[]).map(mapRoutine);
}

export async function fetchRoutine(id: string): Promise<Routine> {
  const { data, error } = await supabase.from('routines').select(ROUTINE_SELECT).eq('id', id).single();
  if (error) throw error;
  return mapRoutine(data as unknown as RoutineRow);
}

export async function saveRoutine(
  userId: string,
  routineId: string | null,
  input: { name: string; exercises: RoutineDraftExercise[] },
): Promise<string> {
  let id = routineId;
  if (!id) {
    const { data, error } = await supabase
      .from('routines')
      .insert({ user_id: userId, name: input.name.trim(), source: 'manual' })
      .select('id')
      .single();
    if (error) throw error;
    id = (data as { id: string }).id;
  } else {
    const { error } = await supabase.from('routines').update({ name: input.name.trim() }).eq('id', id);
    if (error) throw error;
    const { error: delError } = await supabase.from('routine_exercises').delete().eq('routine_id', id);
    if (delError) throw delError;
  }

  if (input.exercises.length > 0) {
    const { error } = await supabase.from('routine_exercises').insert(
      input.exercises.map((e, i) => ({
        routine_id: id,
        exercise_id: e.exerciseId,
        sort_order: i,
        target_sets: e.targetSets,
        target_reps: e.targetReps,
        target_rpe: e.targetRpe,
        rest_seconds: e.restSeconds,
        superset_group: e.supersetGroup,
      })),
    );
    if (error) throw error;
  }

  return id;
}

export async function deleteRoutine(id: string): Promise<void> {
  const { error } = await supabase.from('routines').delete().eq('id', id);
  if (error) throw error;
}

/** Most recent completed set per exercise — powers the S10 "previous" ghost. */
export async function fetchLastPerformance(
  exerciseIds: string[],
): Promise<Record<string, { weightKg: number; reps: number }>> {
  if (exerciseIds.length === 0) return {};
  const { data, error } = await supabase
    .from('workout_sets')
    .select('exercise_id, weight_kg, reps, created_at')
    .in('exercise_id', exerciseIds)
    .eq('completed', true)
    .not('weight_kg', 'is', null)
    .not('reps', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;

  const map: Record<string, { weightKg: number; reps: number }> = {};
  for (const row of data as { exercise_id: string; weight_kg: number; reps: number }[]) {
    if (!map[row.exercise_id]) {
      map[row.exercise_id] = { weightKg: Number(row.weight_kg), reps: Number(row.reps) };
    }
  }
  return map;
}

/** Chronological completed-set history per exercise — used for PR detection at finish. */
export async function fetchExerciseHistory(
  exerciseIds: string[],
): Promise<Record<string, { weightKg: number; reps: number }[]>> {
  if (exerciseIds.length === 0) return {};
  const { data, error } = await supabase
    .from('workout_sets')
    .select('exercise_id, weight_kg, reps, created_at')
    .in('exercise_id', exerciseIds)
    .eq('completed', true)
    .not('weight_kg', 'is', null)
    .not('reps', 'is', null)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const map: Record<string, { weightKg: number; reps: number }[]> = {};
  for (const row of data as { exercise_id: string; weight_kg: number; reps: number }[]) {
    (map[row.exercise_id] ??= []).push({ weightKg: Number(row.weight_kg), reps: Number(row.reps) });
  }
  return map;
}

type HistorySetRow = {
  weight_kg: number | null;
  reps: number | null;
  set_type: string;
  is_pr: boolean;
  exercise_id: string;
};

type HistoryRow = {
  id: string;
  routine_id: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  routines: { name: string } | { name: string }[] | null;
  workout_sets: HistorySetRow[] | null;
};

type DetailSetRow = {
  id: string;
  exercise_id: string;
  set_number: number;
  set_type: string;
  superset_group: string | null;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  is_pr: boolean;
  exercises:
    | { name: string; primary_muscle: MuscleGroup; media_url: string | null }
    | { name: string; primary_muscle: MuscleGroup; media_url: string | null }[]
    | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function nameFromRoutine(row: HistoryRow): string {
  return first(row.routines)?.name ?? 'Workout';
}

const HISTORY_SELECT = `id, routine_id, started_at, ended_at, notes, routines ( name ),
  workout_sets ( weight_kg, reps, set_type, is_pr, exercise_id )`;

function mapHistory(row: HistoryRow): WorkoutHistoryItem {
  const sets = row.workout_sets ?? [];
  const volume = sets.reduce((sum, s) => {
    if (s.set_type === 'warmup') return sum;
    return sum + (Number(s.weight_kg) || 0) * (Number(s.reps) || 0);
  }, 0);
  const durationSec = row.ended_at
    ? Math.max(0, Math.round((new Date(row.ended_at).getTime() - new Date(row.started_at).getTime()) / 1000))
    : 0;
  return {
    id: row.id,
    name: nameFromRoutine(row),
    startedAt: row.started_at,
    durationSec,
    volume: Math.round(volume),
    setCount: sets.length,
    prCount: sets.filter((s) => s.is_pr).length,
    exerciseCount: new Set(sets.map((s) => s.exercise_id)).size,
  };
}

export async function fetchWorkoutHistory(): Promise<WorkoutHistoryItem[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(HISTORY_SELECT)
    .order('started_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as unknown as HistoryRow[]).map(mapHistory);
}

export async function fetchWorkoutDetail(id: string): Promise<WorkoutDetail> {
  const { data, error } = await supabase
    .from('workouts')
    .select(
      `id, routine_id, started_at, ended_at, notes, routines ( name ),
       workout_sets ( id, exercise_id, set_number, set_type, superset_group, weight_kg, reps, rpe, is_pr,
         exercises ( name, primary_muscle, media_url ) )`,
    )
    .eq('id', id)
    .single();
  if (error) throw error;

  const row = data as unknown as HistoryRow & { workout_sets: DetailSetRow[] | null };
  const base = mapHistory(row);
  const groups: WorkoutExerciseGroup[] = [];

  for (const set of row.workout_sets ?? []) {
    const exercise = first(set.exercises);
    let group = groups.find((g) => g.exerciseId === set.exercise_id);
    if (!group) {
      group = {
        exerciseId: set.exercise_id,
        name: exercise?.name ?? 'Exercise',
        primaryMuscle: exercise?.primary_muscle ?? 'core',
        mediaUrl: exercise?.media_url ?? null,
        supersetGroup: set.superset_group,
        sets: [],
      };
      groups.push(group);
    }
    group.sets.push({
      id: set.id,
      setNumber: set.set_number,
      setType: set.set_type,
      weightKg: set.weight_kg != null ? Number(set.weight_kg) : null,
      reps: set.reps,
      rpe: set.rpe != null ? Number(set.rpe) : null,
      isPr: set.is_pr,
    });
  }
  for (const group of groups) group.sets.sort((a, b) => a.setNumber - b.setNumber);

  return { ...base, routineId: row.routine_id, notes: row.notes, exercises: groups };
}

type StatRow = {
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  is_pr: boolean;
  set_type: string;
  created_at: string;
  workouts: { started_at: string } | { started_at: string }[] | null;
};

export async function fetchExerciseStats(exerciseId: string): Promise<ExerciseStats> {
  const { data, error } = await supabase
    .from('workout_sets')
    .select('set_number, weight_kg, reps, rpe, is_pr, set_type, created_at, workouts ( started_at )')
    .eq('exercise_id', exerciseId)
    .eq('completed', true)
    .not('weight_kg', 'is', null)
    .not('reps', 'is', null)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const rows = data as unknown as StatRow[];
  const byDay = new Map<string, { e1rm: number; volume: number }>();
  const prs: ExerciseStats['prs'] = [];
  const valid: { date: string; weightKg: number; reps: number; rpe: number | null; setNumber: number; isPr: boolean; e1rm: number }[] = [];

  for (const row of rows) {
    const weightKg = Number(row.weight_kg);
    const reps = row.reps ?? 0;
    if (!Number.isFinite(weightKg) || reps <= 0) continue;
    const iso = first(row.workouts)?.started_at ?? row.created_at;
    const date = iso.slice(0, 10);
    const e1rm = estimated1RM(weightKg, reps);
    const entry = byDay.get(date) ?? { e1rm: 0, volume: 0 };
    entry.e1rm = Math.max(entry.e1rm, e1rm);
    if (row.set_type !== 'warmup') entry.volume += weightKg * reps;
    byDay.set(date, entry);

    if (row.is_pr) {
      prs.push({ date, weightKg, reps, e1rm: Math.round(e1rm) });
    }
    valid.push({ date, weightKg, reps, rpe: row.rpe != null ? Number(row.rpe) : null, setNumber: row.set_number, isPr: row.is_pr, e1rm });
  }

  const days = [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  const topSets = [...valid].sort((a, b) => b.e1rm - a.e1rm).slice(0, 10);

  return {
    e1rmSeries: days.map(([date, v]) => ({ date, value: Math.round(v.e1rm) })),
    volumeSeries: days.map(([date, v]) => ({ date, value: Math.round(v.volume) })),
    prs: prs.reverse(),
    topSets,
  };
}
