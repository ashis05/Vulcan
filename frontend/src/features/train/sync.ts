import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

import type { WorkoutPayload } from './workout-result';

const QUEUE_KEY = 'vulcan.syncQueue.v1';

export type SyncOp =
  | { kind: 'workout'; id: string; payload: WorkoutPayload; queuedAt: number }
  | { kind: 'notes'; id: string; workoutId: string; notes: string; queuedAt: number };

async function readQueue(): Promise<SyncOp[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as SyncOp[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(ops: SyncOp[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
  } catch {
    // best effort — the in-memory session is already cleared
  }
}

export async function enqueueWorkout(payload: WorkoutPayload): Promise<string> {
  const id = payload.workout.id;
  const ops = await readQueue();
  if (!ops.some((op) => op.kind === 'workout' && op.id === id)) {
    ops.push({ kind: 'workout', id, payload, queuedAt: Date.now() });
    await writeQueue(ops);
  }
  return id;
}

export async function enqueueNotes(workoutId: string, notes: string): Promise<void> {
  const ops = await readQueue();
  ops.push({ kind: 'notes', id: `${workoutId}:${Date.now()}`, workoutId, notes, queuedAt: Date.now() });
  await writeQueue(ops);
}

async function pushWorkout(payload: WorkoutPayload): Promise<void> {
  const { error } = await supabase.from('workouts').upsert(payload.workout, { onConflict: 'id' });
  if (error) throw error;
  if (payload.sets.length > 0) {
    const { error: setsError } = await supabase.from('workout_sets').upsert(payload.sets, { onConflict: 'id' });
    if (setsError) throw setsError;
  }
}

async function pushNotes(workoutId: string, notes: string): Promise<void> {
  const { error } = await supabase.from('workouts').update({ notes }).eq('id', workoutId);
  if (error) throw error;
}

/**
 * Flush queued writes in order. On the first failure everything from that op
 * onward stays queued, so nothing is lost when the network drops mid-sync.
 */
export async function flushQueue(): Promise<number> {
  const ops = await readQueue();
  let flushed = 0;
  for (const op of ops) {
    try {
      if (op.kind === 'workout') await pushWorkout(op.payload);
      else await pushNotes(op.workoutId, op.notes);
      flushed += 1;
    } catch {
      break;
    }
  }
  if (flushed > 0) await writeQueue(ops.slice(flushed));
  return flushed;
}

export async function pendingSyncCount(): Promise<number> {
  return (await readQueue()).length;
}
