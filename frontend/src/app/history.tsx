import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnvilIcon, ArrowLeftIcon } from '@/components/icons';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, SectionLabel } from '@/features/train/components';
import { useWorkoutHistory } from '@/features/train/hooks';
import type { WorkoutHistoryItem } from '@/features/train/types';
import { colors, fonts, radius, typeScale } from '@/theme';

const monthLabel = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(iso));
const weekdayLabel = (iso: string) => new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(iso));
const minutes = (sec: number) => Math.max(1, Math.round(sec / 60));

export default function HistoryScreen() {
  const router = useRouter();
  const history = useWorkoutHistory();

  const groups: { label: string; items: WorkoutHistoryItem[] }[] = [];
  for (const workout of history.data ?? []) {
    const label = monthLabel(workout.startedAt);
    let group = groups.find((g) => g.label === label);
    if (!group) {
      group = { label, items: [] };
      groups.push(group);
    }
    group.items.push(workout);
  }

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>Train</Text>
        </Pressable>
        <Text style={styles.navTitle}>History</Text>
        <View style={styles.navSpacer} />
      </View>

      {history.isPending ? (
        <ActivityIndicator color={colors.accent.ember500} style={styles.loading} />
      ) : history.isError ? (
        <Text style={styles.error}>Could not load your history.</Text>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<AnvilIcon size={26} color={colors.text.muted} />}
          title="Nothing forged yet"
          subtitle="Finish a workout and it will show up here."
        />
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <SectionLabel>{group.label}</SectionLabel>
              <View style={styles.card}>
                {group.items.map((workout, index) => (
                  <Pressable
                    key={workout.id}
                    onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })}
                    style={[styles.row, index === group.items.length - 1 && styles.lastRow]}
                  >
                    <View style={styles.rowText}>
                      <Text style={styles.name}>{workout.name}</Text>
                      <Text style={styles.meta}>
                        {weekdayLabel(workout.startedAt)} · {minutes(workout.durationSec)} min ·{' '}
                        {workout.exerciseCount} exercises
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={styles.volume}>{workout.volume.toLocaleString()} kg</Text>
                      {workout.prCount > 0 ? (
                        <Text style={styles.pr}>{workout.prCount} PR</Text>
                      ) : (
                        <Text style={styles.sets}>{workout.setCount} sets</Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
          <Text style={styles.footnote}>All sessions sync to your data export.</Text>
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
  navTitle: { color: colors.text.primary, fontFamily: fonts.display.bold, fontSize: typeScale.h2.size },
  navSpacer: { width: 60 },
  loading: { marginTop: 48 },
  error: { color: colors.semantic.danger, fontSize: typeScale.label.size, padding: 16 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 24, gap: 18 },
  group: { gap: 8 },
  card: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  lastRow: { borderBottomWidth: 0 },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  name: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '600' },
  meta: { color: colors.text.muted, fontSize: typeScale.caption.size },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  volume: { color: colors.text.muted, fontSize: typeScale.caption.size, fontVariant: ['tabular-nums'] },
  pr: { color: colors.accent.ember500, fontSize: typeScale.caption.size, fontWeight: '600' },
  sets: { color: colors.text.muted, fontSize: typeScale.caption.size },
  footnote: { color: colors.text.muted, fontSize: typeScale.caption.size, textAlign: 'center' },
});
