import { create } from 'zustand';

import type { Exercise, Routine, RoutineDraftExercise } from './types';

export interface BuilderItem {
  key: string;
  exercise: Exercise;
  targetSets: string;
  targetReps: string;
  targetRpe: string;
  restSeconds: string;
  /** This exercise pairs with the one directly below it (a superset). */
  supersetWithNext: boolean;
}

let counter = 0;
function makeKey(): string {
  counter += 1;
  return `bi_${Date.now().toString(36)}_${counter}`;
}

function toItem(exercise: Exercise): BuilderItem {
  return {
    key: makeKey(),
    exercise,
    targetSets: '3',
    targetReps: '8-12',
    targetRpe: '',
    restSeconds: '120',
    supersetWithNext: false,
  };
}

interface BuilderState {
  routineId: string | null;
  name: string;
  items: BuilderItem[];
  setRoutineId: (id: string | null) => void;
  setName: (name: string) => void;
  reset: () => void;
  load: (routine: Routine) => void;
  addExercises: (exercises: Exercise[]) => void;
  remove: (key: string) => void;
  update: (
    key: string,
    patch: Partial<Pick<BuilderItem, 'targetSets' | 'targetReps' | 'targetRpe' | 'restSeconds'>>,
  ) => void;
  move: (key: string, delta: -1 | 1) => void;
  toggleSuperset: (key: string) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  routineId: null,
  name: '',
  items: [],
  setRoutineId: (routineId) => set({ routineId }),
  setName: (name) => set({ name }),
  reset: () => set({ routineId: null, name: '', items: [] }),
  load: (routine) =>
    set({
      routineId: routine.id,
      name: routine.name,
      items: routine.exercises.map((re, index) => {
        const next = routine.exercises[index + 1];
        return {
          key: makeKey(),
          exercise: re.exercise,
          targetSets: re.targetSets != null ? String(re.targetSets) : '',
          targetReps: re.targetReps ?? '',
          targetRpe: re.targetRpe != null ? String(re.targetRpe) : '',
          restSeconds: re.restSeconds != null ? String(re.restSeconds) : '',
          supersetWithNext:
            re.supersetGroup != null && next != null && next.supersetGroup === re.supersetGroup,
        };
      }),
    }),
  addExercises: (exercises) => set((state) => ({ items: [...state.items, ...exercises.map(toItem)] })),
  remove: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
  update: (key, patch) =>
    set((state) => ({ items: state.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) })),
  move: (key, delta) =>
    set((state) => {
      const index = state.items.findIndex((i) => i.key === key);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= state.items.length) return state;
      const items = [...state.items];
      [items[index], items[target]] = [items[target], items[index]];
      return { items };
    }),
  toggleSuperset: (key) =>
    set((state) => {
      const index = state.items.findIndex((i) => i.key === key);
      if (index < 0 || index === state.items.length - 1) return state;
      return {
        items: state.items.map((i) =>
          i.key === key ? { ...i, supersetWithNext: !i.supersetWithNext } : i,
        ),
      };
    }),
}));

/** Parse the editable draft into persisted targets, assigning superset group labels. */
export function toDraft(items: BuilderItem[]): RoutineDraftExercise[] {
  const groups: (string | null)[] = items.map(() => null);
  let groupIndex = 0;
  for (let i = 0; i < items.length - 1; i += 1) {
    if (items[i].supersetWithNext) {
      const label = String.fromCharCode(65 + (groupIndex % 26));
      groupIndex += 1;
      groups[i] = label;
      groups[i + 1] = label;
    }
  }

  return items.map((item, i) => {
    const sets = parseInt(item.targetSets, 10);
    const rpe = parseFloat(item.targetRpe);
    const rest = parseInt(item.restSeconds, 10);
    const reps = item.targetReps.trim();
    return {
      exerciseId: item.exercise.id,
      targetSets: Number.isFinite(sets) && sets > 0 ? sets : null,
      targetReps: reps.length > 0 ? reps : null,
      targetRpe: Number.isFinite(rpe) ? rpe : null,
      restSeconds: Number.isFinite(rest) ? rest : null,
      supersetGroup: groups[i],
    };
  });
}
