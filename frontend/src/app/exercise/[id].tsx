import { useMemo, useState, type ReactNode } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';

import { ArrowLeftIcon, SparkIcon } from '@/components/icons';
import { Screen } from '@/components/ui/Screen';
import { useExercises, useExerciseStats } from '@/features/train/hooks';
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '@/features/train/types';
import { colors, fonts, radius, typeScale } from '@/theme';

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(iso));

function ChartCard({ children, label, right }: { children: ReactNode; label: string; right?: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.chartHead}>
        <Text style={styles.cardLabel}>{label}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(200, width - 64);

  const exercises = useExercises();
  const stats = useExerciseStats(id);
  const [mode, setMode] = useState<'rm' | 'vol'>('rm');

  const exercise = exercises.data?.find((e) => e.id === id);

  const points = useMemo(() => {
    if (!stats.data) return [];
    const series = mode === 'rm' ? stats.data.e1rmSeries : stats.data.volumeSeries;
    return series.map((p) => ({ value: p.value, label: shortDate(p.date) }));
  }, [stats.data, mode]);

  const hasData = (stats.data?.e1rmSeries.length ?? 0) > 0;

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        {stats.data && stats.data.prs.length > 0 ? (
          <View style={styles.prBadge}>
            <SparkIcon size={12} color={colors.accent.ember500} filled />
            <Text style={styles.prBadgeText}>PR</Text>
          </View>
        ) : null}
      </View>

      {stats.isPending || exercises.isPending ? (
        <ActivityIndicator color={colors.accent.ember500} style={styles.loading} />
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={styles.head}>
            <Text style={styles.title}>{exercise?.name ?? 'Exercise'}</Text>
            {exercise ? (
              <View style={styles.metaRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{MUSCLE_LABELS[exercise.primaryMuscle]}</Text>
                </View>
                {exercise.secondaryMuscles.slice(0, 2).map((m) => (
                  <View key={m} style={styles.chipMuted}>
                    <Text style={styles.chipText}>{MUSCLE_LABELS[m]}</Text>
                  </View>
                ))}
                <Text style={styles.equipment}>{EQUIPMENT_LABELS[exercise.equipment]}</Text>
              </View>
            ) : null}
          </View>

          <ChartCard
            label={mode === 'rm' ? 'e1RM' : 'Volume'}
            right={
              <View style={styles.segmented}>
                <Pressable
                  onPress={() => setMode('rm')}
                  style={[styles.seg, mode === 'rm' && styles.segActive]}
                >
                  <Text style={[styles.segText, mode === 'rm' && styles.segTextActive]}>e1RM</Text>
                </Pressable>
                <Pressable
                  onPress={() => setMode('vol')}
                  style={[styles.seg, mode === 'vol' && styles.segActive]}
                >
                  <Text style={[styles.segText, mode === 'vol' && styles.segTextActive]}>Volume</Text>
                </Pressable>
              </View>
            }
          >
            {hasData ? (
              mode === 'rm' ? (
                <LineChart
                  data={points}
                  width={chartWidth}
                  height={140}
                  color={colors.accent.ember500}
                  thickness={2}
                  hideDataPoints
                  curved
                  areaChart
                  startFillColor="rgba(255,106,0,0.30)"
                  endFillColor="rgba(255,106,0,0)"
                  startOpacity={0.3}
                  endOpacity={0}
                  hideRules
                  hideYAxisText
                  yAxisColor="transparent"
                  xAxisColor={colors.border.hairline}
                  initialSpacing={10}
                  spacing={Math.max(28, chartWidth / Math.max(1, points.length))}
                  xAxisLabelTextStyle={styles.axisLabel}
                />
              ) : (
                <BarChart
                  data={points}
                  width={chartWidth}
                  height={140}
                  frontColor={colors.accent.ember500}
                  barWidth={16}
                  spacing={20}
                  hideRules
                  hideYAxisText
                  yAxisColor="transparent"
                  xAxisColor={colors.border.hairline}
                  initialSpacing={10}
                  xAxisLabelTextStyle={styles.axisLabel}
                />
              )
            ) : (
              <Text style={styles.empty}>Log this exercise to see progress.</Text>
            )}
          </ChartCard>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>PR history</Text>
            {stats.data && stats.data.prs.length > 0 ? (
              stats.data.prs.slice(0, 5).map((pr, i) => (
                <View key={`${pr.date}-${i}`} style={styles.listRow}>
                  <Text style={styles.listValue}>
                    {pr.weightKg} × {pr.reps} · e1RM {pr.e1rm}
                  </Text>
                  <Text style={styles.listMeta}>{shortDate(pr.date)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>No PRs yet.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>All time · top sets</Text>
            {stats.data && stats.data.topSets.length > 0 ? (
              stats.data.topSets.slice(0, 6).map((set, i) => (
                <View key={`${set.date}-${i}`} style={styles.listRow}>
                  <Text style={styles.listMeta}>{shortDate(set.date)}</Text>
                  <Text style={styles.listValue}>
                    {set.weightKg} × {set.reps}
                    {set.rpe != null ? ` × RPE ${set.rpe}` : ''}
                  </Text>
                  <Text style={styles.listMeta}>Set {set.setNumber}{set.isPr ? ' · PR' : ''}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>No sets logged yet.</Text>
            )}
          </View>
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
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.hairline,
  },
  prBadgeText: { color: colors.text.primary, fontSize: typeScale.caption.size, fontWeight: '600' },
  loading: { marginTop: 48 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 24, gap: 14 },
  head: { gap: 8 },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    lineHeight: typeScale.title.lineHeight,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  chip: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipMuted: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { color: colors.text.secondary, fontSize: typeScale.caption.size, fontWeight: '600' },
  equipment: { color: colors.text.muted, fontSize: typeScale.caption.size },
  card: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 16,
    gap: 8,
  },
  chartHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  seg: { paddingHorizontal: 12, height: 28, alignItems: 'center', justifyContent: 'center' },
  segActive: { backgroundColor: colors.accent.ember500 },
  segText: { color: colors.text.secondary, fontSize: typeScale.caption.size, fontWeight: '600' },
  segTextActive: { color: colors.text.onAccent },
  axisLabel: { color: colors.text.muted, fontSize: 10 },
  empty: { color: colors.text.muted, fontSize: typeScale.label.size, paddingVertical: 8 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  listValue: { flex: 1, color: colors.text.primary, fontSize: typeScale.body.size, fontVariant: ['tabular-nums'] },
  listMeta: { color: colors.text.muted, fontSize: typeScale.caption.size, fontVariant: ['tabular-nums'] },
});
