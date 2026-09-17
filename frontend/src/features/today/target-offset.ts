import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface TargetOffsetState {
  offsets: Record<string, number>;
  setOffset: (userId: string, kcal: number) => void;
  clearOffset: (userId: string) => void;
}

/**
 * User-confirmed calorie nudge from the weight-trend review (Phase 3 task 7).
 * Targets themselves are computed and never stored — this is only the +/-100
 * kcal adjustment the user accepted, keyed by account.
 */
export const useTargetOffsetStore = create<TargetOffsetState>()(
  persist(
    (set) => ({
      offsets: {},
      setOffset: (userId, kcal) =>
        set((state) => ({ offsets: { ...state.offsets, [userId]: kcal } })),
      clearOffset: (userId) =>
        set((state) => {
          const next = { ...state.offsets };
          delete next[userId];
          return { offsets: next };
        }),
    }),
    {
      name: 'vulcan.target-offset',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function useTargetOffset(userId: string | undefined): number {
  const offset = useTargetOffsetStore((s) => (userId ? s.offsets[userId] : undefined));
  return offset ?? 0;
}
