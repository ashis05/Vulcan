import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';

import { cancelScheduled, scheduleRestDone } from './notifications';

export function useRestTimer() {
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const endAtRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationRef = useRef<string | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
    setRemaining(left);
    if (left <= 0) {
      clearTick();
      setRunning(false);
      notificationRef.current = null;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [clearTick]);

  const start = useCallback(
    (seconds: number) => {
      clearTick();
      cancelScheduled(notificationRef.current);
      const secs = Math.max(1, Math.round(seconds));
      setTotal(secs);
      setRemaining(secs);
      setRunning(true);
      endAtRef.current = Date.now() + secs * 1000;
      scheduleRestDone(secs).then((id) => {
        notificationRef.current = id;
      });
      intervalRef.current = setInterval(tick, 500);
    },
    [clearTick, tick],
  );

  const addTime = useCallback(
    (seconds: number) => {
      if (!running) return;
      endAtRef.current += seconds * 1000;
      setTotal((t) => t + seconds);
      cancelScheduled(notificationRef.current);
      const left = Math.max(1, Math.round((endAtRef.current - Date.now()) / 1000));
      scheduleRestDone(left).then((id) => {
        notificationRef.current = id;
      });
      tick();
    },
    [running, tick],
  );

  const stop = useCallback(() => {
    clearTick();
    cancelScheduled(notificationRef.current);
    notificationRef.current = null;
    setRunning(false);
    setRemaining(0);
    setTotal(0);
  }, [clearTick]);

  useEffect(() => () => clearTick(), [clearTick]);

  return { running, remaining, total, start, addTime, stop };
}
