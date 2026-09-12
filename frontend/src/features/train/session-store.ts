import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SetType } from '@/engine/strength';

import type { Exercise, Routine } from './types';

export const DEFAULT_REST_SECONDS = 120;
export const DEFAULT_SET_COUNT = 3;

export interface SessionSet {
  key: string;
  setNumber: number;
  type: SetType;
  weightKg: string;
  reps: string;
  rpe: string;
  completed: boolean;
}

export interface SessionExercise {
  key: string;
  exercise: Exercise;
  restSeconds: number;
  supersetGroup: string | null;
  sets: SessionSet[];
}

let keyCounter = 0;
function makeKey(prefix: string): string {
  keyCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${keyCounter}`;
}

/** RFC-4122 v4 id — client-generated so sessions work offline. */
export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function makeSet(setNumber: number): SessionSet {
  return {
    key: makeKey('set'),
    setNumber,
    type: 'normal',
    weightKg: '',
    reps: '',
    rpe: '',
    completed: false,
  };
}

function makeSessionExercise(exercise: Exercise, restSeconds: number, supersetGroup: string | null, setCount: number): SessionExercise {
  return {
    key: makeKey('ex'),
    exercise,
    restSeconds,
    supersetGroup,
    sets: Array.from({ length: Math.max(1, setCount) }, (_, i) => makeSet(i + 1)),
  };
}

export function sessionExercisesFromRoutine(routine: Routine): SessionExercise[] {
  return routine.exercises.map((re) =>
    makeSessionExercise(re.exercise, re.restSeconds ?? DEFAULT_REST_SECONDS, re.supersetGroup, re.targetSets ?? DEFAULT_SET_COUNT),
  );
}

interface StartInput {
  routineId?: string | null;
  routineName?: string | null;
  exercises?: SessionExercise[];
}

interface SessionState {
  workoutId: string | null;
  routineId: string | null;
  routineName: string | null;
  startedAt: number;
  notes: string;
  exercises: SessionExercise[];
  start: (input?: StartInput) => void;
  addExercises: (exercises: Exercise[]) => void;
  removeExercise: (exerciseKey: string) => void;
  addSet: (exerciseKey: string) => void;
  removeSet: (exerciseKey: string, setKey: string) => void;
  updateSet: (exerciseKey: string, setKey: string, patch: Partial<Pick<SessionSet, 'weightKg' | 'reps' | 'rpe'>>) => void;
  toggleSet: (exerciseKey: string, setKey: string) => void;
  setSetType: (exerciseKey: string, setKey: string, type: SetType) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
}

function renumber(sets: SessionSet[]): SessionSet[] {
  return sets.map((s, i) => ({ ...s, setNumber: i + 1 }));
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      workoutId: null,
      routineId: null,
      routineName: null,
      startedAt: 0,
      notes: '',
      exercises: [],
      start: (input) =>
        set({
          workoutId: uuidv4(),
          routineId: input?.routineId ?? null,
          routineName: input?.routineName ?? null,
          startedAt: Date.now(),
          notes: '',
          exercises: input?.exercises ?? [],
        }),
      addExercises: (exercises) =>
        set((state) => ({
          exercises: [
            ...state.exercises,
            ...exercises.map((e) => makeSessionExercise(e, DEFAULT_REST_SECONDS, null, DEFAULT_SET_COUNT)),
          ],
        })),
      removeExercise: (exerciseKey) =>
        set((state) => ({ exercises: state.exercises.filter((e) => e.key !== exerciseKey) })),
      addSet: (exerciseKey) =>
        set((state) => ({
          exercises: state.exercises.map((e) =>
            e.key === exerciseKey ? { ...e, sets: [...e.sets, makeSet(e.sets.length + 1)] } : e,
          ),
        })),
      removeSet: (exerciseKey, setKey) =>
        set((state) => ({
          exercises: state.exercises.map((e) =>
            e.key === exerciseKey ? { ...e, sets: renumber(e.sets.filter((s) => s.key !== setKey)) } : e,
          ),
        })),
      updateSet: (exerciseKey, setKey, patch) =>
        set((state) => ({
          exercises: state.exercises.map((e) =>
            e.key === exerciseKey
              ? { ...e, sets: e.sets.map((s) => (s.key === setKey ? { ...s, ...patch } : s)) }
              : e,
          ),
        })),
      toggleSet: (exerciseKey, setKey) =>
        set((state) => ({
          exercises: state.exercises.map((e) =>
            e.key === exerciseKey
              ? { ...e, sets: e.sets.map((s) => (s.key === setKey ? { ...s, completed: !s.completed } : s)) }
              : e,
          ),
        })),
      setSetType: (exerciseKey, setKey, type) =>
        set((state) => ({
          exercises: state.exercises.map((e) =>
            e.key === exerciseKey
              ? { ...e, sets: e.sets.map((s) => (s.key === setKey ? { ...s, type } : s)) }
              : e,
          ),
        })),
      setNotes: (notes) => set({ notes }),
      clear: () =>
        set({
          workoutId: null,
          routineId: null,
          routineName: null,
          startedAt: 0,
          notes: '',
          exercises: [],
        }),
    }),
    {
      name: 'vulcan.session',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
