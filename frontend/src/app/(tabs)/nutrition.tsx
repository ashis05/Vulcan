import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MacroBar, MacroLegend } from '@/components/ui/MacroBar';
import { RingProgress } from '@/components/ui/RingProgress';
import { Screen } from '@/components/ui/Screen';
import { useDeleteMeal, useDayMeals } from '@/features/nutrition/hooks';
import { DayStrip, Fab, MealCard } from '@/features/nutrition/components';
import { groupBySlot, mealTotals, MEAL_SLOT_LABELS, MEAL_SLOTS } from '@/features/nutrition/types';
import { useDailyTargets } from '@/features/today/targets';
import { formatLongDay, localDateString, recentDays } from '@/lib/dates';
import { colors, fonts, radius, typeScale } from '@/theme';

export default function NutritionScreen() {
  const router = useRouter();
  const today = localDateString(new Date());
  const [selected, setSelected] = useState(today);

  const meals = useDayMeals(selected);
  const { targets } = useDailyTargets();
  const deleteMeal = useDeleteMeal();

  const days = useMemo(() => recentDays(7), []);
  const consumed = mealTotals(meals.data ?? []);
  const grouped = groupBySlot(meals.data ?? []);

  // One consistent daily goal across the strip — the base target (adaptive TDEE
  // + any confirmed offset). Step bonuses are a Today-ring concern only.
  const targetKcal = targets?.baseTargetKcal ?? 0;
  const remaining = Math.max(0, Math.round(targetKcal - consumed.kcal));
  const progress = targetKcal > 0 ? consumed.kcal / targetKcal : 0;
  const macroTargets = {
    protein: targets?.proteinG ?? 0,
    carbs: targets?.carbsG ?? 0,
    fat: targets?.fatG ?? 0,
  };

  return (
    <Screen>
      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Nutrition</Text>
          <Text style={styles.date}>
            {selected === today ? 'Today' : formatLongDay(selected)}
          </Text>
        </View>

        <DayStrip days={days} selected={selected} onSelect={setSelected} />

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>Calories eaten</Text>
            <Text style={styles.pct}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={styles.ringWrap}>
            <RingProgress size={150} progress={progress}>
              <Text style={styles.ringValue}>{consumed.kcal.toLocaleString()}</Text>
              <Text style={styles.ringCaption}>of {targetKcal.toLocaleString()} kcal</Text>
            </RingProgress>
          </View>
          <View style={styles.macroBar}>
            <MacroBar consumed={consumed} targets={macroTargets} />
          </View>
          <View style={styles.macroLegend}>
            <MacroLegend consumed={consumed} targets={macroTargets} />
          </View>
          <Text style={styles.remaining}>{remaining.toLocaleString()} kcal remaining</Text>
        </View>

        {MEAL_SLOTS.map((slot) => (
          <View key={slot} style={styles.section}>
            <Text style={styles.sectionLabel}>{MEAL_SLOT_LABELS[slot]}</Text>
            {grouped[slot].length > 0 ? (
              <View style={styles.list}>
                {grouped[slot].map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onPress={() => router.push({ pathname: '/meal/[id]', params: { id: meal.id } })}
                    onDelete={() => deleteMeal.mutate(meal.id)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Nothing here yet</Text>
                <Text style={styles.emptyHint}>Add a meal to keep the tally honest.</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <Fab onPress={() => router.push({ pathname: '/meal/add', params: { date: selected } })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  content: { padding: 16, gap: 18, paddingBottom: 104 },
  header: { gap: 2 },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    lineHeight: typeScale.title.lineHeight,
  },
  date: { color: colors.text.muted, fontSize: typeScale.caption.size },
  card: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 16,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  pct: { color: colors.accent.ember500, fontSize: typeScale.label.size, fontWeight: '700' },
  ringWrap: { alignItems: 'center', marginTop: 8 },
  ringValue: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    fontVariant: ['tabular-nums'],
  },
  ringCaption: { color: colors.text.secondary, fontSize: typeScale.caption.size, marginTop: 2 },
  macroBar: { marginTop: 14 },
  macroLegend: { marginTop: 10 },
  remaining: { color: colors.text.muted, fontSize: typeScale.caption.size, marginTop: 12 },
  section: { gap: 8 },
  sectionLabel: {
    color: colors.text.secondary,
    fontSize: typeScale.label.size,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  list: { gap: 8 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.hairline,
    borderRadius: radius.lg,
  },
  emptyTitle: { color: colors.text.secondary, fontSize: typeScale.label.size },
  emptyHint: { color: colors.text.muted, fontSize: typeScale.caption.size },
});
