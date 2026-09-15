import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { fetchExerciseHistory } from '@/features/train/api';
import { ExerciseCard, RestTimerBar } from '@/features/train/session-components';
import { useLastPerformance, useRoutine } from '@/features/train/hooks';
import { ensureNotificationsReady } from '@/features/train/notifications';
import { useResultStore } from '@/features/train/result-store';
import {
  sessionExercisesFromRoutine,
  useSessionStore,
  type SessionSet,
} from '@/features/train/session-store';
import { enqueueWorkout, flushQueue } from '@/features/train/sync';
import { useRestTimer } from '@/features/train/use-rest-timer';
import { buildWorkoutResult } from '@/features/train/workout-result';
import type { SetType } from '@/engine/strength';
import { uuidv4 } from '@/lib/id';
import { useAuth } from '@/lib/use-auth';
import { colors, fonts, radius, typeScale } from '@/theme';

const SET_TYPES: { key: SetType; label: string }[] = [
  { key: 'warmup', label: 'Warmup' },
  { key: 'normal', label: 'Normal' },
  { key: 'drop', label: 'Dropset' },
  { key: 'failure', label: 'Failure' },
];

export default function ActiveWorkoutScreen() {
  useKeepAwake();
  const router = useRouter();
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();

  const routine = useRoutine(routineId);
  const exercises = useSessionStore((s) => s.exercises);
  const routineName = useSessionStore((s) => s.routineName);
  const startedAt = useSessionStore((s) => s.startedAt);
  const start = useSessionStore((s) => s.start);
  const addSet = useSessionStore((s) => s.addSet);
  const removeSet = useSessionStore((s) => s.removeSet);
  const removeExercise = useSessionStore((s) => s.removeExercise);
  const updateSet = useSessionStore((s) => s.updateSet);
  const toggleSet = useSessionStore((s) => s.toggleSet);
  const setSetType = useSessionStore((s) => s.setSetType);
  const clear = useSessionStore((s) => s.clear);

  const { user } = useAuth();
  const setResult = useResultStore((s) => s.setResult);
  const rest = useRestTimer();
  const [elapsed, setElapsed] = useState(0);
  const [hydrated, setHydrated] = useState(useSessionStore.persist.hasHydrated());
  const [setSheet, setSetSheet] = useState<{ exerciseKey: string; setKey: string } | null>(null);
  const [exerciseSheet, setExerciseSheet] = useState<string | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    ensureNotificationsReady();
  }, []);

  useEffect(() => {
    const unsub = useSessionStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated || startedRef.current) return;
    if (routineId && !routine.data && !routine.isError) return;
    startedRef.current = true;
    const current = useSessionStore.getState();
    if (current.workoutId != null || current.exercises.length > 0) return;
    if (routineId && routine.data) {
      start({
        routineId,
        routineName: routine.data.name,
        exercises: sessionExercisesFromRoutine(routine.data),
      });
    } else {
      start();
    }
  }, [hydrated, routineId, routine.data, routine.isError, start]);

  useEffect(() => {
    if (!startedAt) return;
    const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const exerciseIds = exercises.map((e) => e.exercise.id);
  const prevMap = useLastPerformance(exerciseIds).data ?? {};

  const totalSets = exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const doneSets = exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).length, 0);
  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, '0');

  const onToggleSet = (exerciseKey: string, restSeconds: number, set: SessionSet) => {
    const completing = !set.completed;
    toggleSet(exerciseKey, set.key);
    if (completing) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      rest.start(restSeconds);
    }
  };

  const volume = exercises.reduce(
    (sum, e) =>
      sum +
      e.sets.reduce((s, set) => {
        if (!set.completed) return s;
        const kg = parseFloat(set.weightKg) || 0;
        const reps = parseInt(set.reps, 10) || 0;
        return s + kg * reps;
      }, 0),
    0,
  );

  const doFinish = async () => {
    if (!user) return;
    setConfirmFinish(false);
    rest.stop();
    const endedAt = Date.now();
    let history: Record<string, { weightKg: number; reps: number }[]> = {};
    try {
      history = await fetchExerciseHistory(exerciseIds);
    } catch {
      history = {};
    }
    const workoutId = useSessionStore.getState().workoutId ?? uuidv4();
    const result = buildWorkoutResult({
      workoutId,
      userId: user.id,
      routineId: routineId ?? null,
      routineName,
      startedAt: startedAt || endedAt,
      endedAt,
      exercises,
      history,
    });
    await enqueueWorkout(result.payload);
    flushQueue().catch(() => {});
    setResult(result);
    clear();
    router.replace('/workout/summary');
  };

  const doDiscard = () => {
    setConfirmDiscard(false);
    rest.stop();
    clear();
    router.replace('/train');
  };

  if (!hydrated) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent.ember500} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topbar}>
        <Text style={styles.timer}>
          {mm}:{ss}
          <Text style={styles.timerUnit}> elapsed</Text>
        </Text>
        <View style={styles.topActions}>
          <Pressable onPress={() => setConfirmDiscard(true)} hitSlop={8} style={styles.topBtn}>
            <Text style={styles.discardLabel}>Discard</Text>
          </Pressable>
          <Pressable onPress={() => setConfirmFinish(true)} hitSlop={8} style={styles.topBtn}>
            <Text style={styles.finishLabel}>Finish</Text>
          </Pressable>
        </View>
      </View>

      <OfflineBanner />

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headRow}>
          <Text style={styles.workoutName} numberOfLines={1}>
            {routineName ?? 'Empty workout'}
          </Text>
          <Text style={styles.setCount}>
            {doneSets} / {totalSets} sets
          </Text>
        </View>

        {exercises.map((item, index) => (
          <ExerciseCard
            key={item.key}
            index={index}
            item={item}
            prev={prevMap[item.exercise.id]}
            onAddSet={() => addSet(item.key)}
            onRemoveSet={() => {
              const last = item.sets[item.sets.length - 1];
              if (last) removeSet(item.key, last.key);
            }}
            onSetChange={(setKey, patch) => updateSet(item.key, setKey, patch)}
            onToggleSet={(set) => onToggleSet(item.key, item.restSeconds, set)}
            onSetOptions={(set) => setSetSheet({ exerciseKey: item.key, setKey: set.key })}
            onExerciseOptions={() => setExerciseSheet(item.key)}
          />
        ))}

        <Pressable onPress={() => router.push('/exercise-picker?target=session')} style={styles.addExercise}>
          <Text style={styles.addExerciseText}>+ Add exercise</Text>
        </Pressable>
      </ScrollView>

      {rest.running ? (
        <View style={styles.restWrap}>
          <RestTimerBar remaining={rest.remaining} total={rest.total} onAdd={() => rest.addTime(30)} onSkip={rest.stop} />
        </View>
      ) : null}

      <Modal visible={!!setSheet} transparent animationType="slide" onRequestClose={() => setSetSheet(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSetSheet(null)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Set type</Text>
          {SET_TYPES.map((t) => (
            <Pressable
              key={t.key}
              style={styles.sheetRow}
              onPress={() => {
                if (setSheet) setSetType(setSheet.exerciseKey, setSheet.setKey, t.key);
                setSetSheet(null);
              }}
            >
              <Text style={styles.sheetRowText}>{t.label}</Text>
            </Pressable>
          ))}
          <Pressable
            style={styles.sheetRow}
            onPress={() => {
              if (setSheet) removeSet(setSheet.exerciseKey, setSheet.setKey);
              setSetSheet(null);
            }}
          >
            <Text style={[styles.sheetRowText, { color: colors.semantic.danger }]}>Delete set</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={!!exerciseSheet} transparent animationType="slide" onRequestClose={() => setExerciseSheet(null)}>
        <Pressable style={styles.backdrop} onPress={() => setExerciseSheet(null)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Exercise</Text>
          <Pressable
            style={styles.sheetRow}
            onPress={() => {
              if (exerciseSheet) removeExercise(exerciseSheet);
              setExerciseSheet(null);
            }}
          >
            <Text style={[styles.sheetRowText, { color: colors.semantic.danger }]}>Remove exercise</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={confirmFinish} transparent animationType="fade" onRequestClose={() => setConfirmFinish(false)}>
        <Pressable style={styles.backdrop} onPress={() => setConfirmFinish(false)} />
        <View style={styles.confirmWrap}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Finish workout?</Text>
            <Text style={styles.confirmBody}>
              {doneSets}/{totalSets} sets · {Math.round(volume).toLocaleString()} kg volume · {mm} min. Unfinished
              sets are dropped.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable onPress={() => setConfirmFinish(false)} style={styles.confirmGhost}>
                <Text style={styles.confirmGhostText}>Keep going</Text>
              </Pressable>
              <Pressable onPress={doFinish} style={styles.confirmPrimary}>
                <Text style={styles.confirmPrimaryText}>Finish</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmDiscard} transparent animationType="fade" onRequestClose={() => setConfirmDiscard(false)}>
        <Pressable style={styles.backdrop} onPress={() => setConfirmDiscard(false)} />
        <View style={styles.confirmWrap}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Discard session?</Text>
            <Text style={styles.confirmBody}>The forge forgets. Nothing is saved.</Text>
            <View style={styles.confirmActions}>
              <Pressable onPress={() => setConfirmDiscard(false)} style={styles.confirmGhost}>
                <Text style={styles.confirmGhostText}>Stay</Text>
              </Pressable>
              <Pressable onPress={doDiscard} style={styles.confirmDanger}>
                <Text style={styles.confirmPrimaryText}>Discard</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  timer: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: 20,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.4,
  },
  timerUnit: { color: colors.text.muted, fontSize: typeScale.caption.size, fontWeight: '500' },
  topActions: { marginLeft: 'auto', flexDirection: 'row', gap: 4 },
  topBtn: { height: 40, justifyContent: 'center', paddingHorizontal: 10 },
  discardLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  finishLabel: { color: colors.accent.ember500, fontSize: typeScale.label.size, fontWeight: '700' },
  body: { flex: 1 },
  bodyContent: { padding: 14, gap: 14, paddingBottom: 24 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  workoutName: { color: colors.text.primary, fontFamily: fonts.display.bold, fontSize: typeScale.h3.size, flex: 1 },
  setCount: { color: colors.text.muted, fontSize: typeScale.caption.size, fontVariant: ['tabular-nums'] },
  addExercise: {
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExerciseText: { color: colors.text.secondary, fontSize: typeScale.body.size, fontWeight: '600' },
  restWrap: { paddingHorizontal: 14, paddingBottom: 14 },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: colors.border.hairline,
    padding: 16,
    paddingBottom: 28,
    gap: 4,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.hairline,
    marginBottom: 8,
  },
  sheetTitle: { color: colors.text.primary, fontFamily: fonts.display.bold, fontSize: typeScale.h2.size, marginBottom: 4 },
  sheetRow: { height: 52, justifyContent: 'center' },
  sheetRowText: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '500' },
  confirmWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  confirmCard: {
    width: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.card,
    padding: 20,
    gap: 10,
  },
  confirmTitle: { color: colors.text.primary, fontFamily: fonts.display.bold, fontSize: typeScale.h2.size },
  confirmBody: { color: colors.text.secondary, fontSize: typeScale.label.size, lineHeight: 20 },
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  confirmGhost: {
    flex: 1,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmGhostText: { color: colors.text.secondary, fontSize: typeScale.body.size, fontWeight: '600' },
  confirmPrimary: {
    flex: 1,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.ember500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDanger: {
    flex: 1,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.semantic.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmPrimaryText: { color: colors.text.onAccent, fontSize: typeScale.body.size, fontWeight: '700' },
});
