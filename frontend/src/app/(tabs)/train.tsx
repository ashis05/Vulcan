import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnvilIcon, PlusIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ActiveSessionBanner, EmptyState, RoutineCard, SectionLabel } from '@/features/train/components';
import { useRoutines, useWorkoutHistory } from '@/features/train/hooks';
import { colors, fonts, typeScale } from '@/theme';

const weekday = (iso: string) => new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(iso));
const minutes = (sec: number) => Math.max(1, Math.round(sec / 60));

export default function TrainScreen() {
  const router = useRouter();
  const routines = useRoutines();
  const history = useWorkoutHistory();
  const recent = (history.data ?? []).slice(0, 5);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Train</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <ActiveSessionBanner />

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <SectionLabel>My routines</SectionLabel>
            <Pressable
              onPress={() => router.push('/routine/builder')}
              style={styles.newBtn}
              hitSlop={8}
            >
              <PlusIcon size={16} color={colors.accent.ember500} />
              <Text style={styles.newLabel}>New routine</Text>
            </Pressable>
          </View>

          {routines.isPending ? (
            <ActivityIndicator color={colors.accent.ember500} style={styles.loading} />
          ) : routines.isError ? (
            <Text style={styles.error}>Could not load your routines.</Text>
          ) : routines.data && routines.data.length > 0 ? (
            <View style={styles.list}>
              {routines.data.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  onPress={() => router.push({ pathname: '/routine/[id]', params: { id: routine.id } })}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<AnvilIcon size={26} color={colors.accent.ember500} />}
              title="No routines yet"
              subtitle="Build a routine to make training repeatable."
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <SectionLabel>History</SectionLabel>
            {recent.length > 0 ? (
              <Pressable onPress={() => router.push('/history')} style={styles.newBtn} hitSlop={8}>
                <Text style={styles.newLabel}>See all</Text>
              </Pressable>
            ) : null}
          </View>
          {history.isPending ? (
            <ActivityIndicator color={colors.accent.ember500} style={styles.loading} />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<AnvilIcon size={26} color={colors.text.muted} />}
              title="Nothing forged yet"
              subtitle="Your finished sessions will show up here."
            />
          ) : (
            <View style={styles.historyCard}>
              {recent.map((workout, index) => (
                <Pressable
                  key={workout.id}
                  onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })}
                  style={[styles.histRow, index === recent.length - 1 && styles.histLast]}
                >
                  <View style={styles.histText}>
                    <Text style={styles.histName}>{workout.name}</Text>
                    <Text style={styles.histMeta}>
                      {weekday(workout.startedAt)} · {minutes(workout.durationSec)} min
                    </Text>
                  </View>
                  <View style={styles.histRight}>
                    <Text style={styles.histVol}>{workout.volume.toLocaleString()} kg</Text>
                    {workout.prCount > 0 ? (
                      <Text style={styles.histPr}>{workout.prCount} PR</Text>
                    ) : (
                      <Text style={styles.histSets}>{workout.setCount} sets</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Start empty workout" onPress={() => router.push('/workout/active')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 24 },
  title: {
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    lineHeight: typeScale.title.lineHeight,
    color: colors.text.primary,
  },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 22, paddingBottom: 24 },
  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32 },
  newLabel: { color: colors.accent.ember500, fontSize: typeScale.label.size, fontWeight: '600' },
  list: { gap: 10 },
  historyCard: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: 14,
    backgroundColor: colors.bg.card,
    paddingHorizontal: 16,
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  histLast: { borderBottomWidth: 0 },
  histText: { flex: 1, minWidth: 0, gap: 2 },
  histName: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '500' },
  histMeta: { color: colors.text.muted, fontSize: typeScale.caption.size },
  histRight: { alignItems: 'flex-end', gap: 2 },
  histVol: { color: colors.text.muted, fontSize: typeScale.caption.size, fontVariant: ['tabular-nums'] },
  histPr: { color: colors.accent.ember500, fontSize: typeScale.caption.size, fontWeight: '600' },
  histSets: { color: colors.text.muted, fontSize: typeScale.caption.size },
  loading: { paddingVertical: 24 },
  error: { color: colors.semantic.danger, fontSize: typeScale.label.size },
  footer: { paddingHorizontal: 16, paddingBottom: 12 },
});
