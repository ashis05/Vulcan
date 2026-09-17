import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MacroBar, MacroLegend } from '@/components/ui/MacroBar';
import { CoachNote } from '@/components/ui/CoachNote';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { RingProgress } from '@/components/ui/RingProgress';
import { Screen } from '@/components/ui/Screen';
import { StatTile } from '@/components/ui/StatTile';
import { ActiveSessionBanner } from '@/features/train/components';
import { useDayMeals, useMealsRange } from '@/features/nutrition/hooks';
import { currentStreak, mealTotals } from '@/features/nutrition/types';
import { ConnectStepsBanner } from '@/features/today/connect-steps-banner';
import { StepsTile, StreakFlame } from '@/features/today/components';
import {
  useAutoSyncSteps,
  useDailyActivity,
  useHasStepsPermission,
  useSetManualSteps,
} from '@/features/today/hooks';
import { useDailyTargets, useTrendSuggestion } from '@/features/today/targets';
import { useTargetOffsetStore } from '@/features/today/target-offset';
import { useLogWeight, useWeights, weightDelta } from '@/features/today/weight';
import { StepsModal } from '@/features/today/steps-modal';
import { WeightModal } from '@/features/today/weight-modal';
import { TrendAdjustCard } from '@/features/today/trend-card';
import { addDays, dayRangeIso, formatLongDay, localDateString, recentDays } from '@/lib/dates';
import { useAuth } from '@/lib/use-auth';
import { colors, fonts, radius, typeScale } from '@/theme';

export default function TodayScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const today = localDateString(new Date());

  const { targets, profile, isPending } = useDailyTargets();
  const trendSuggestion = useTrendSuggestion();
  const setTargetOffset = useTargetOffsetStore((s) => s.setOffset);

  const meals = useDayMeals(today);
  const activity = useDailyActivity(8);
  const weights = useWeights(8);
  const granted = useHasStepsPermission();
  useAutoSyncSteps(granted.data === true);

  const logWeight = useLogWeight();
  const setManualSteps = useSetManualSteps();

  const [weightOpen, setWeightOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [trendDismissed, setTrendDismissed] = useState(false);

  const streakWindow = useMemo(
    () => ({
      start: dayRangeIso(localDateString(addDays(new Date(), -29))).start,
      end: dayRangeIso(today).end,
    }),
    [today],
  );
  const streakMeals = useMealsRange(streakWindow.start, streakWindow.end);

  const consumed = mealTotals(meals.data ?? []);
  const streak = currentStreak(streakMeals.data ?? [], today);

  const activityRows = activity.data ?? [];
  const stepSeries = recentDays(7).map(
    (day) => activityRows.find((row) => row.activity_date === day)?.steps ?? 0,
  );
  const todaySteps = stepSeries[stepSeries.length - 1] ?? 0;

  const weightEntries = weights.data ?? [];
  const latestWeight = weightEntries[weightEntries.length - 1]?.weightKg ?? profile?.weightKg ?? 0;
  const delta = weightDelta(weightEntries);
  const weightUnit = profile?.weightUnit ?? 'kg';

  const targetKcal = targets?.targetKcal ?? 0;
  const remaining = Math.max(0, Math.round(targetKcal - consumed.kcal));
  const progress = targetKcal > 0 ? consumed.kcal / targetKcal : 0;
  const macroTargets = {
    protein: targets?.proteinG ?? 0,
    carbs: targets?.carbsG ?? 0,
    fat: targets?.fatG ?? 0,
  };
  const showTrend =
    !trendDismissed && trendSuggestion !== 0 && (targets?.offsetKcal ?? 0) === 0;

  return (
    <Screen>
      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        <OfflineBanner />

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              Today, <Text style={styles.titleName}>{profile?.displayName || 'athlete'}</Text>
            </Text>
            <Text style={styles.date}>{formatLongDay(today)}</Text>
          </View>
          <StreakFlame days={streak} />
        </View>

        <ActiveSessionBanner />

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>Calories</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{remaining.toLocaleString()}</Text>
              <Text style={styles.badgeCaption}>left</Text>
            </View>
          </View>
          <View style={styles.ringWrap}>
            {isPending ? (
              <Text style={styles.muted}>Computing targets…</Text>
            ) : targets ? (
              <RingProgress size={176} progress={progress}>
                <Text style={styles.ringValue} numberOfLines={1}>
                  {remaining.toLocaleString()}
                </Text>
                <Text style={styles.ringCaption} numberOfLines={1}>
                  kcal remaining
                </Text>
              </RingProgress>
            ) : (
              <Text style={styles.muted}>Finish onboarding to see your targets.</Text>
            )}
          </View>
          <View style={styles.macroBar}>
            <MacroBar consumed={consumed} targets={macroTargets} />
          </View>
          <View style={styles.macroLegend}>
            <MacroLegend consumed={consumed} targets={macroTargets} />
          </View>
          {targets && targets.stepBonusKcal > 0 ? (
            <Text style={styles.muted}>+{targets.stepBonusKcal} kcal from steps today</Text>
          ) : null}
        </View>

        <ConnectStepsBanner onManualEntry={() => setStepsOpen(true)} />

        <View style={styles.grid}>
          <StepsTile
            steps={todaySteps}
            series={stepSeries}
            onPress={() => router.push('/steps')}
          />
          <StatTile
            label="Weight"
            value={latestWeight ? latestWeight.toFixed(1) : '—'}
            unit={weightUnit}
            delta={
              delta == null
                ? undefined
                : `${delta <= 0 ? '▼' : '▲'} ${Math.abs(delta).toFixed(1)} ${weightUnit} · 7d`
            }
            deltaDirection={delta != null && delta < 0 ? 'down' : 'up'}
            onPress={() => setWeightOpen(true)}
          />
        </View>

        {showTrend ? (
          <TrendAdjustCard
            suggestionKcal={trendSuggestion}
            onConfirm={() => {
              if (user) setTargetOffset(user.id, trendSuggestion);
              setTrendDismissed(true);
            }}
            onDismiss={() => setTrendDismissed(true)}
          />
        ) : null}

        <CoachNote body="Your coach reads your logs and steps. Personalized guidance lands with the AI features." />
      </ScrollView>

      <WeightModal
        visible={weightOpen}
        weightKg={latestWeight}
        unit={weightUnit}
        saving={logWeight.isPending}
        onClose={() => setWeightOpen(false)}
        onSave={(kg) => {
          logWeight.mutate(
            { date: today, weightKg: kg },
            { onSuccess: () => setWeightOpen(false) },
          );
        }}
      />

      <StepsModal
        visible={stepsOpen}
        steps={todaySteps}
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
  body: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headerText: { flex: 1 },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    lineHeight: typeScale.title.lineHeight,
  },
  titleName: { color: colors.accent.ember400 },
  date: { color: colors.text.muted, fontSize: typeScale.caption.size, marginTop: 2 },
  hero: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 16,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  badge: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  badgeText: {
    color: colors.accent.ember500,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.label.size,
    fontVariant: ['tabular-nums'],
  },
  badgeCaption: {
    color: colors.accent.ember500,
    fontSize: typeScale.caption.size,
    fontWeight: '600',
  },
  ringWrap: { alignItems: 'center', justifyContent: 'center', minHeight: 176, marginTop: 8 },
  ringValue: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: 34,
    lineHeight: 38,
    fontVariant: ['tabular-nums'],
  },
  ringCaption: { color: colors.text.secondary, fontSize: typeScale.caption.size, marginTop: 4 },
  macroBar: { marginTop: 16 },
  macroLegend: { marginTop: 10 },
  grid: { flexDirection: 'row', gap: 12 },
  muted: { color: colors.text.muted, fontSize: typeScale.caption.size },
});
