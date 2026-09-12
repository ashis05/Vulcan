import { supabase } from '@/lib/supabase';

import type {
  Equipment,
  Exercise,
  MuscleGroup,
  Routine,
  RoutineDraftExercise,
  RoutineExercise,
  RoutineSource,
} from './types';

type ExerciseRow = {
  id: string;
  user_id: string | null;
  name: string;
  primary_muscle: MuscleGroup;
  secondary_muscles: MuscleGroup[] | null;
  equipment: Equipment;
  is_custom: boolean;
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

const EXERCISE_COLUMNS = 'id, user_id, name, primary_muscle, secondary_muscles, equipment, is_custom';

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
