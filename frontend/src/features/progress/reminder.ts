import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** How often to nudge for a new check-in. Matches the Phase-6 spec (4 weeks). */
export const CHECK_IN_INTERVAL_WEEKS = 4;

const CHANNEL_ID = 'check-in';
const STORAGE_KEY = 'vulcan.progress-reminder';
const NOTIFICATION_ID_KEY = 'vulcan.progress-reminder.id';

async function ensureChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Check-in reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Whether the user has opted into the 4-week check-in reminder. */
export async function isReminderEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(STORAGE_KEY)) === 'on';
}

async function storedId(): Promise<string | null> {
  return AsyncStorage.getItem(NOTIFICATION_ID_KEY);
}

/** Cancel any scheduled reminder and forget it. */
export async function cancelCheckInReminder(): Promise<void> {
  const id = await storedId();
  if (id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // already fired or cancelled
    }
  }
  await AsyncStorage.multiRemove([STORAGE_KEY, NOTIFICATION_ID_KEY]);
}

/**
 * Schedule a repeating 4-week check-in nudge. Requests permission; returns false
 * if the user denied it (nothing scheduled). Idempotent — replaces any existing one.
 */
export async function scheduleCheckInReminder(): Promise<boolean> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  const status =
    current.status === 'granted'
      ? 'granted'
      : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return false;

  await cancelCheckInReminder();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time for a check-in',
      body: 'Snap your progress photos so VULCAN can adjust your program.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: CHECK_IN_INTERVAL_WEEKS * 7 * 24 * 60 * 60,
      channelId: CHANNEL_ID,
      repeats: true,
    },
  });
  await AsyncStorage.setItem(STORAGE_KEY, 'on');
  await AsyncStorage.setItem(NOTIFICATION_ID_KEY, id);
  return true;
}
