import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { ArrowLeftIcon } from '@/components/icons';
import { Screen } from '@/components/ui/Screen';
import { StatTile } from '@/components/ui/StatTile';
import { ConnectStepsBanner } from '@/features/today/connect-steps-banner';
import {
  useAutoSyncSteps,
  useDailyActivity,
  useHasStepsPermission,
  useSetManualSteps,
} from '@/features/today/hooks';
import { StepsModal } from '@/features/today/steps-modal';
import { localDateString, recentDays } from '@/lib/dates';
import { colors, fonts, radius, typeScale } from '@/theme';

const RANGE_DAYS = 30;
const CHART_DAYS = 14;

const narrowWeekday = (dateIso: string): string => {
  const [y, m, d] = dateIso.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(new Date(y, m - 1, d));
};

const shortDay = (dateIso: string): string => {
  const [y, m, d] = dateIso.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(
    new Date(y, m - 1, d),
  );
};

export default function StepsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const today = localDateString(new Date());

  const granted = useHasStepsPermission();
  useAutoSyncSteps(granted.data === true, 60_000, RANGE_DAYS);
  const activity = useDailyActivity(RANGE_DAYS);
  const setManualSteps = useSetManualSteps();

  const [stepsOpen, setStepsOpen] = useState(false);

  const series = useMemo(() => {
    const byDay = new Map((activity.data ?? []).map((row) => [row.activity_date, row]));
    return recentDays(RANGE_DAYS).map((day) => ({
      date: day,
      steps: byDay.get(day)?.steps ?? 0,
      bonus: byDay.get(day)?.step_bonus_kcal ?? 0,
    }));
  }, [activity.data]);

  const todayEntry = series[series.length - 1];
  const completed = series.slice(0, -1).slice(-7);
  const avg7 =
    completed.length > 0
      ? Math.round(completed.reduce((sum, day) => sum + day.steps, 0) / completed.length)
      : 0;
  const best = series.reduce((max, day) => Math.max(max, day.steps), 0);
  const chartData = series.slice(-CHART_DAYS).map((day) => ({
    value: day.steps,
    label: narrowWeekday(day.date),
    frontColor: day.date === today ? colors.accent.ember500 : colors.steps,
  }));

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>Today</Text>
        </Pressable>
        <Text style={styles.navTitle}>Steps</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroCaption}>Today</Text>
          <Text style={styles.heroValue}>{(todayEntry?.steps ?? 0).toLocaleString()}</Text>
          <Text style={styles.heroUnit}>steps</Text>
          {todayEntry && todayEntry.bonus > 0 ? (
            <Text style={styles.heroBonus}>+{todayEntry.bonus} kcal towards your budget</Text>
          ) : null}
        </View>

        <ConnectStepsBanner onManualEntry={() => setStepsOpen(true)} />

        <View style={styles.grid}>
          <StatTile label="7-day avg" value={avg7.toLocaleString()} />
          <StatTile label="Best" value={best.toLocaleString()} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Last {CHART_DAYS} days</Text>
          {best > 0 ? (
            <BarChart
              data={chartData}
              width={width - 64}
              height={150}
              barWidth={12}
              spacing={(width - 96) / CHART_DAYS - 12}
              initialSpacing={8}
              barBorderRadius={4}
              hideRules
              hideYAxisText
              yAxisColor="transparent"
              xAxisColor={colors.border.hairline}
              xAxisLabelTextStyle={styles.axisLabel}
            />
          ) : (
            <Text style={styles.muted}>No steps recorded yet.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>History</Text>
          {series
            .slice()
            .reverse()
            .map((day) => (
              <View key={day.date} style={styles.row}>
                <Text style={styles.rowLabel}>{shortDay(day.date)}</Text>
                <Text style={styles.rowValue}>{day.steps.toLocaleString()}</Text>
                <Text style={styles.rowBonus}>{day.bonus > 0 ? `+${day.bonus} kcal` : '—'}</Text>
              </View>
            ))}
        </View>
      </ScrollView>

      <StepsModal
        visible={stepsOpen}
        steps={todayEntry?.steps ?? 0}
        saving={setManualSteps.isPending}
        onClose={() => setStepsOpen(false)}
        onSave={(steps) => {
          setManualSteps.mutate(
            { date: today, steps },
            { onSuccess: () => setStepsOpen(false) },
          );
        }}
      />
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
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, minWidth: 72 },
  backLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  navTitle: { color: colors.text.primary, fontFamily: fonts.display.bold, fontSize: typeScale.h2.size },
  navSpacer: { minWidth: 72 },
  body: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  hero: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 20,
    alignItems: 'center',
  },
  heroCaption: {
    color: colors.text.secondary,
    fontSize: typeScale.caption.size,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroValue: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.display.size,
    lineHeight: typeScale.display.lineHeight,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  heroUnit: { color: colors.text.muted, fontSize: typeScale.label.size },
  heroBonus: { color: colors.steps, fontSize: typeScale.caption.size, marginTop: 8 },
  grid: { flexDirection: 'row', gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 16,
    gap: 12,
  },
  cardLabel: {
    color: colors.text.secondary,
    fontSize: typeScale.label.size,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  axisLabel: { color: colors.text.muted, fontSize: 10 },
  muted: { color: colors.text.muted, fontSize: typeScale.caption.size },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  rowLabel: { flex: 1, color: colors.text.secondary, fontSize: typeScale.label.size },
  rowValue: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.body.size,
    fontVariant: ['tabular-nums'],
    minWidth: 64,
    textAlign: 'right',
  },
  rowBonus: { color: colors.text.muted, fontSize: typeScale.caption.size, minWidth: 72, textAlign: 'right' },
});
