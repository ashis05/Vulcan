export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'biceps'
  | 'triceps'
  | 'calves'
  | 'core';

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'other';

export type RoutineSource = 'manual' | 'ai';

export interface Exercise {
  id: string;
  userId: string | null;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  isCustom: boolean;
  mediaUrl: string | null;
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sortOrder: number;
  targetSets: number | null;
  targetReps: string | null;
  targetRpe: number | null;
  restSeconds: number | null;
  supersetGroup: string | null;
}

export interface Routine {
  id: string;
  name: string;
  source: RoutineSource;
  dayLabel: string | null;
  sortOrder: number;
  programId: string | null;
  exercises: RoutineExercise[];
}

export interface RoutineDraftExercise {
  exerciseId: string;
  targetSets: number | null;
  targetReps: string | null;
  targetRpe: number | null;
  restSeconds: number | null;
  supersetGroup: string | null;
}

export interface WorkoutHistoryItem {
  id: string;
  name: string;
  startedAt: string;
  durationSec: number;
  volume: number;
  setCount: number;
  prCount: number;
  exerciseCount: number;
}

export interface WorkoutSetDetail {
  id: string;
  setNumber: number;
  setType: string;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  isPr: boolean;
}

export interface WorkoutExerciseGroup {
  exerciseId: string;
  name: string;
  primaryMuscle: MuscleGroup;
  mediaUrl: string | null;
  supersetGroup: string | null;
  sets: WorkoutSetDetail[];
}

export interface WorkoutDetail extends WorkoutHistoryItem {
  routineId: string | null;
  notes: string | null;
  exercises: WorkoutExerciseGroup[];
}

export interface ExerciseStats {
  e1rmSeries: { date: string; value: number }[];
  volumeSeries: { date: string; value: number }[];
  prs: { date: string; weightKg: number; reps: number; e1rm: number }[];
  topSets: { date: string; weightKg: number; reps: number; rpe: number | null; setNumber: number; isPr: boolean }[];
}

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  biceps: 'Biceps',
  triceps: 'Triceps',
  calves: 'Calves',
  core: 'Core',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
  other: 'Other',
};

/** Coarse picker filters map onto the finer canonical muscle groups. */
export const MUSCLE_FILTERS: { label: string; muscles: MuscleGroup[] | null }[] = [
  { label: 'All', muscles: null },
  { label: 'Chest', muscles: ['chest'] },
  { label: 'Back', muscles: ['back'] },
  { label: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  { label: 'Shoulders', muscles: ['shoulders'] },
  { label: 'Arms', muscles: ['biceps', 'triceps'] },
  { label: 'Core', muscles: ['core'] },
];
