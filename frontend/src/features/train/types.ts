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
