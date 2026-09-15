import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ArrowLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ExerciseThumb } from '@/features/train/components';
import { useWorkoutDetail } from '@/features/train/hooks';
import { sessionExercisesFromHistory, useSessionStore } from '@/features/train/session-store';
import { MUSCLE_LABELS } from '@/features/train/types';
import { colors, fonts, radius, typeScale } from '@/theme';

export default function PastWorkoutScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useWorkoutDetail(id);
  const start = useSessionStore((s) => s.start);

  const onRepeat = () => {
    if (!workout.data) return;
    start({ routineName: workout.data.name, exercises: sessionExercisesFromHistory(workout.data) });
    router.push('/workout/active');
  };

  const dateLabel = workout.data
    ? new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' }).format(new Date(workout.data.startedAt))
    : '';
  const mm = workout.data ? Math.floor(workout.data.durationSec / 60) : 0;
  const ss = workout.data ? String(workout.data.durationSec % 60).padStart(2, '0') : '00';

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>History</Text>
        </Pressable>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Read-only</Text>
        </View>
      </View>

      {workout.isPending ? (
        <ActivityIndicator color={colors.accent.ember500} style={styles.loading} />
      ) : workout.isError || !workout.data ? (
        <Text style={styles.error}>Could not load this workout.</Text>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={styles.head}>
            <Text style={styles.title}>{workout.data.name}</Text>
            <Text style={styles.date}>{dateLabel}</Text>
          </View>

          <View style={styles.stats}>
            <View style={styles.tile}>
              <Text style={styles.tileLabel}>Duration</Text>
              <Text style={styles.tileValue}>
                {mm}:{ss}
              </Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.tileLabel}>Volume</Text>
              <Text style={styles.tileValue}>{workout.data.volume.toLocaleString()}</Text>
              <Text style={styles.tileUnit}>kg</Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.tileLabel}>Sets</Text>
              <Text style={styles.tileValue}>{workout.data.setCount}</Text>
            </View>
          </View>

          {workout.data.exercises.map((group, index) => (
            <View key={group.exerciseId} style={[styles.card, group.supersetGroup && styles.cardSuperset]}>
              <View style={styles.cardHead}>
                <ExerciseThumb uri={group.mediaUrl} size={40} />
                <View style={styles.cardText}>
                  <Text style={styles.kicker}>
                    {index + 1} · {MUSCLE_LABELS[group.primaryMuscle]}
                    {group.supersetGroup ? ' · superset' : ''}
                  </Text>
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: '/exercise/[id]', params: { id: group.exerciseId } })
                    }
                  >
                    <Text style={styles.exName}>{group.name}</Text>
                  </Pressable>
                </View>
                <Text style={styles.doneCount}>{group.sets.length} sets</Text>
              </View>
              {group.sets.map((set) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setNum}>{set.setNumber}</Text>
                  <Text style={styles.setValue}>
                    {set.weightKg ?? '—'} × {set.reps ?? '—'}
                  </Text>
                  <Text style={styles.setRpe}>{set.rpe != null ? `RPE ${set.rpe}` : ''}</Text>
                  {set.isPr ? <Text style={styles.pr}>PR</Text> : null}
                </View>
              ))}
            </View>
          ))}

          <Button label="Repeat as new workout" variant="ghost" onPress={onRepeat} />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44 },
  backLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  badge: {
    paddingHorizontal: 10,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.text.muted, fontSize: typeScale.caption.size, fontWeight: '600' },
  loading: { marginTop: 48 },
  error: { color: colors.semantic.danger, fontSize: typeScale.label.size, padding: 16 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 24, gap: 14 },
  head: { gap: 4 },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    lineHeight: typeScale.title.lineHeight,
  },
  date: { color: colors.text.muted, fontSize: typeScale.caption.size },
  stats: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 14,
    gap: 4,
  },
  tileLabel: { color: colors.text.secondary, fontSize: typeScale.caption.size, fontWeight: '600' },
  tileValue: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
    fontVariant: ['tabular-nums'],
  },
  tileUnit: { color: colors.text.muted, fontSize: typeScale.caption.size },
  card: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 14,
    gap: 6,
  },
  cardSuperset: { borderLeftWidth: 3, borderLeftColor: colors.charts[1] },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardText: { flex: 1, gap: 2 },
  kicker: {
    color: colors.text.muted,
    fontSize: typeScale.caption.size,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  exName: { color: colors.text.primary, fontFamily: fonts.display.bold, fontSize: typeScale.h3.size },
  doneCount: { color: colors.text.muted, fontSize: typeScale.caption.size },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  setNum: { width: 20, textAlign: 'center', color: colors.text.muted, fontFamily: fonts.display.bold },
  setValue: {
    flex: 1,
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.body.size,
    fontVariant: ['tabular-nums'],
  },
  setRpe: { color: colors.text.muted, fontSize: typeScale.caption.size, fontVariant: ['tabular-nums'] },
  pr: { color: colors.accent.ember500, fontSize: typeScale.caption.size, fontWeight: '700' },
});
