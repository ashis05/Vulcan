import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ArrowLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Tag } from '@/features/train/components';
import { useRoutine } from '@/features/train/hooks';
import type { RoutineExercise } from '@/features/train/types';
import { MUSCLE_LABELS } from '@/features/train/types';
import { colors, fonts, typeScale } from '@/theme';

function targetSummary(item: RoutineExercise): string {
  const parts: string[] = [];
  if (item.targetSets != null || item.targetReps) {
    parts.push(`${item.targetSets ?? '—'}×${item.targetReps ?? '—'}`);
  }
  if (item.targetRpe != null) parts.push(`RPE ${item.targetRpe}`);
  return parts.join(' · ');
}

export default function RoutineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const routine = useRoutine(id);

  const muscles = routine.data
    ? Array.from(new Set(routine.data.exercises.map((e) => e.exercise.primaryMuscle)))
    : [];

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>Train</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/routine/builder?id=${id}`)}
          style={styles.edit}
          hitSlop={8}
        >
          <Text style={styles.editLabel}>Edit</Text>
        </Pressable>
      </View>

      {routine.isPending ? (
        <ActivityIndicator color={colors.accent.ember500} style={styles.loading} />
      ) : routine.isError || !routine.data ? (
        <Text style={styles.error}>Could not load this routine.</Text>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={styles.head}>
            <Text style={styles.title}>{routine.data.name}</Text>
            <View style={styles.metaRow}>
              {muscles.slice(0, 3).map((m) => (
                <Tag key={m} label={MUSCLE_LABELS[m]} />
              ))}
              <Text style={styles.count}>{routine.data.exercises.length} exercises</Text>
            </View>
          </View>

          <Card style={styles.listCard}>
            {routine.data.exercises.map((item, index) => (
              <View
                key={item.id}
                style={[styles.exItem, index === routine.data!.exercises.length - 1 && styles.last]}
              >
                <View style={styles.exText}>
                  <Text style={styles.exName}>{item.exercise.name}</Text>
                  <Text style={styles.exSub}>
                    {MUSCLE_LABELS[item.exercise.primaryMuscle]}
                    {item.supersetGroup ? ` · Superset ${item.supersetGroup}` : ''}
                  </Text>
                </View>
                <Text style={styles.exTarget}>{targetSummary(item)}</Text>
              </View>
            ))}
          </Card>

          <Button
            label="Start workout"
            onPress={() => router.push(`/workout/active?routineId=${id}`)}
          />
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
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44 },
  backLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  edit: { height: 44, justifyContent: 'center' },
  editLabel: { color: colors.accent.ember500, fontSize: typeScale.label.size, fontWeight: '600' },
  loading: { marginTop: 48 },
  error: { color: colors.semantic.danger, fontSize: typeScale.label.size, padding: 16 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 24, gap: 18 },
  head: { gap: 8 },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    lineHeight: typeScale.title.lineHeight,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  count: { color: colors.text.muted, fontSize: typeScale.caption.size },
  listCard: { padding: 6 },
  exItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  last: { borderBottomWidth: 0 },
  exText: { flex: 1, minWidth: 0, gap: 2 },
  exName: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '600' },
  exSub: { color: colors.text.muted, fontSize: typeScale.caption.size },
  exTarget: { color: colors.text.secondary, fontSize: typeScale.label.size },
});
