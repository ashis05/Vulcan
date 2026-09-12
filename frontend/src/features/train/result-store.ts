import { create } from 'zustand';

import type { WorkoutResult } from './workout-result';

interface ResultState {
  result: WorkoutResult | null;
  setResult: (result: WorkoutResult) => void;
  clearResult: () => void;
}

/** Last finished workout, for the summary screen. In-memory only. */
export const useResultStore = create<ResultState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clearResult: () => set({ result: null }),
}));
