import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();
const scheduled: { id: string; seconds: number; repeats: boolean }[] = [];
const permissions = { status: 'granted' as string };
let cancelCalls: string[] = [];

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (k: string) => storage.get(k) ?? null),
    setItem: vi.fn(async (k: string, v: string) => {
      storage.set(k, v);
    }),
    multiRemove: vi.fn(async (keys: string[]) => {
      for (const k of keys) storage.delete(k);
    }),
  },
}));

vi.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
  setNotificationChannelAsync: vi.fn(async () => {}),
  getPermissionsAsync: vi.fn(async () => permissions),
  requestPermissionsAsync: vi.fn(async () => permissions),
  scheduleNotificationAsync: vi.fn(async (req: { trigger: { seconds: number; repeats: boolean } }) => {
    const id = `n${scheduled.length + 1}`;
    scheduled.push({ id, seconds: req.trigger.seconds, repeats: req.trigger.repeats });
    return id;
  }),
  cancelScheduledNotificationAsync: vi.fn(async (id: string) => {
    cancelCalls.push(id);
  }),
}));

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));

// eslint-disable-next-line import/first -- must follow the vi.mock calls above
import {
  CHECK_IN_INTERVAL_WEEKS,
  cancelCheckInReminder,
  isReminderEnabled,
  scheduleCheckInReminder,
} from '@/features/progress/reminder';

beforeEach(() => {
  storage.clear();
  scheduled.length = 0;
  cancelCalls = [];
  permissions.status = 'granted';
});

describe('check-in reminder', () => {
  it('schedules a repeating 4-week notification and persists opt-in', async () => {
    const ok = await scheduleCheckInReminder();
    expect(ok).toBe(true);
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].seconds).toBe(CHECK_IN_INTERVAL_WEEKS * 7 * 24 * 60 * 60);
    expect(scheduled[0].repeats).toBe(true);
    expect(await isReminderEnabled()).toBe(true);
  });

  it('reschedules (cancels the previous one) instead of stacking', async () => {
    await scheduleCheckInReminder();
    await scheduleCheckInReminder();
    expect(scheduled).toHaveLength(2);
    expect(cancelCalls).toContain('n1');
  });

  it('returns false and schedules nothing when permission is denied', async () => {
    permissions.status = 'denied';
    const ok = await scheduleCheckInReminder();
    expect(ok).toBe(false);
    expect(scheduled).toHaveLength(0);
    expect(await isReminderEnabled()).toBe(false);
  });

  it('cancel clears opt-in and cancels the scheduled notification', async () => {
    await scheduleCheckInReminder();
    await cancelCheckInReminder();
    expect(await isReminderEnabled()).toBe(false);
    expect(cancelCalls).toContain('n1');
  });
});
