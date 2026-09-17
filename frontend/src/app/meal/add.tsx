import { useMemo, useState, type ReactNode } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CameraIcon, ChevronRightIcon, PencilIcon, SearchIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { SlotPicker } from '@/features/nutrition/components';
import type { FoodItem } from '@/features/nutrition/foods-api';
import { useCreateMeal, useFoodSearch, useRecentMeals } from '@/features/nutrition/hooks';
import { slotForTime, type MealSlot } from '@/features/nutrition/types';
import { localDateString } from '@/lib/dates';
import { colors, fonts, radius, typeScale } from '@/theme';

function AddOption({
  icon,
  title,
  subtitle,
  primary,
  onPress,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  primary?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.option, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <View style={[styles.optionIcon, primary && styles.optionIconPrimary]}>
        {icon}
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSub}>{subtitle}</Text>
      </View>
      <ChevronRightIcon size={18} color={colors.text.muted} />
    </Pressable>
  );
}

export default function AddMealScreen() {
  const router = useRouter();
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const date = dateParam ?? localDateString(new Date());
  const createMeal = useCreateMeal();
  const recent = useRecentMeals();

  const [showQuick, setShowQuick] = useState(true);
  const [showRecent, setShowRecent] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [servingHint, setServingHint] = useState('');
  const [name, setName] = useState('');
  const [slot, setSlot] = useState<MealSlot>(slotForTime(new Date()));
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const search = useFoodSearch(query);

  const applyFood = (food: FoodItem) => {
    setName(food.name);
    setKcal(String(food.kcal));
    setProtein(String(food.proteinG));
    setCarbs(String(food.carbsG));
    setFat(String(food.fatG));
    setServingHint(food.servingDescription);
    setShowSearch(false);
    setShowQuick(true);
  };

  const recents = useMemo(() => {
    const seen = new Set<string>();
    return (recent.data ?? [])
      .filter((meal) => {
        const key = meal.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
  }, [recent.data]);

  const loggedAt = () =>
    date === localDateString(new Date())
      ? new Date().toISOString()
      : new Date(`${date}T12:00:00`).toISOString();

  const log = (input: {
    name: string;
    mealSlot: MealSlot;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }) => {
    createMeal.mutate({ ...input, loggedAt: loggedAt() }, { onSuccess: () => router.back() });
  };

  const submitQuick = () => {
    if (!name.trim()) return;
    log({
      name,
      mealSlot: slot,
      calories: Number(kcal) || 0,
      proteinG: Number(protein) || 0,
      carbsG: Number(carbs) || 0,
      fatG: Number(fat) || 0,
    });
  };

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <Text style={styles.backLabel}>Diary</Text>
        </Pressable>
        <Text style={styles.navTitle}>Add to {date === localDateString(new Date()) ? 'today' : 'day'}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        <AddOption
          icon={<CameraIcon size={22} color={colors.text.onAccent} />}
          title="Scan food"
          subtitle="Photo → AI macros · adjust before logging"
          primary
          onPress={() => router.push({ pathname: '/meal/scan', params: { date } })}
        />
        <AddOption
          icon={<SearchIcon size={22} color={colors.accent.ember400} />}
          title="Search foods"
          subtitle="Indian recipes & dishes · autofill macros"
          onPress={() => setShowSearch((v) => !v)}
        />
        <AddOption
          icon={<PencilIcon size={22} color={colors.accent.ember400} />}
          title="Quick add"
          subtitle="Manual kcal + macros"
          onPress={() => setShowQuick((v) => !v)}
        />
        <AddOption
          icon={<CameraIcon size={22} color={colors.accent.ember400} />}
          title="Recent meals"
          subtitle="Re-log something you've eaten"
          onPress={() => setShowRecent((v) => !v)}
        />

        {showSearch ? (
          <View style={styles.searchPanel}>
            <TextField
              label="Search foods"
              placeholder="e.g. biryani, dal, roti, paneer"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {search.data && search.data.length > 0 ? (
              <View style={styles.results}>
                {search.data.map((food) => (
                  <Pressable
                    key={food.id}
                    onPress={() => applyFood(food)}
                    style={({ pressed }) => [styles.resultItem, pressed && styles.pressed]}
                  >
                    <View style={styles.resultText}>
                      <Text style={styles.resultName} numberOfLines={1}>
                        {food.name}
                      </Text>
                      <Text style={styles.resultMeta} numberOfLines={1}>
                        {food.servingDescription} · P {Math.round(food.proteinG)} · C{' '}
                        {Math.round(food.carbsG)} · F {Math.round(food.fatG)}
                      </Text>
                    </View>
                    <Text style={styles.resultKcal}>{food.kcal}</Text>
                  </Pressable>
                ))}
              </View>
            ) : query.trim().length >= 2 && !search.isFetching ? (
              <Text style={styles.muted}>No matches — try another name or Quick add.</Text>
            ) : null}
          </View>
        ) : null}

        {showQuick ? (
          <View style={styles.form}>
            <TextField
              label="Name"
              placeholder="e.g. Protein shake"
              value={name}
              onChangeText={setName}
            />
            {servingHint ? <Text style={styles.servingHint}>Per {servingHint}</Text> : null}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Meal</Text>
              <SlotPicker value={slot} onChange={setSlot} />
            </View>
            <View style={styles.inlineGrid}>
              <View style={styles.half}>
                <TextField
                  label="kcal"
                  placeholder="0"
                  keyboardType="number-pad"
                  value={kcal}
                  onChangeText={setKcal}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  label="protein g"
                  placeholder="0"
                  keyboardType="numeric"
                  value={protein}
                  onChangeText={setProtein}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  label="carbs g"
                  placeholder="0"
                  keyboardType="numeric"
                  value={carbs}
                  onChangeText={setCarbs}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  label="fat g"
                  placeholder="0"
                  keyboardType="numeric"
                  value={fat}
                  onChangeText={setFat}
                />
              </View>
            </View>
            <Button
              label={createMeal.isPending ? 'Logging…' : 'Log meal'}
              onPress={submitQuick}
              disabled={createMeal.isPending || !name.trim()}
            />
          </View>
        ) : null}

        {showRecent ? (
          <View style={styles.recentList}>
            <Text style={styles.sectionLabel}>Recent</Text>
            {recents.length === 0 ? (
              <Text style={styles.muted}>No meals logged yet.</Text>
            ) : (
              recents.map((meal) => (
                <Pressable
                  key={meal.id}
                  onPress={() =>
                    log({
                      name: meal.name,
                      mealSlot: slot,
                      calories: meal.calories,
                      proteinG: meal.proteinG,
                      carbsG: meal.carbsG,
                      fatG: meal.fatG,
                    })
                  }
                  style={({ pressed }) => [styles.recentItem, pressed && styles.pressed]}
                >
                  <View style={styles.recentText}>
                    <Text style={styles.recentName}>{meal.name}</Text>
                    <Text style={styles.recentMeta}>
                      P {Math.round(meal.proteinG)}g · C {Math.round(meal.carbsG)}g · F{' '}
                      {Math.round(meal.fatG)}g
                    </Text>
                  </View>
                  <Text style={styles.recentKcal}>{meal.calories.toLocaleString()}</Text>
                </Pressable>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  back: { height: 44, justifyContent: 'center' },
  backLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  navTitle: { color: colors.text.primary, fontFamily: fonts.display.bold, fontSize: typeScale.h2.size },
  body: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.card,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.overlay,
  },
  optionIconPrimary: { backgroundColor: colors.accent.ember500 },
  optionText: { flex: 1, gap: 2 },
  optionTitle: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '600' },
  optionSub: { color: colors.text.muted, fontSize: typeScale.caption.size },
  searchPanel: { gap: 12, borderTopWidth: 1, borderTopColor: colors.border.hairline, paddingTop: 18 },
  results: { gap: 8 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.card,
  },
  resultText: { flex: 1, minWidth: 0, gap: 2 },
  resultName: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '600' },
  resultMeta: { color: colors.text.muted, fontSize: typeScale.caption.size },
  resultKcal: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h3.size,
    fontVariant: ['tabular-nums'],
  },
  servingHint: { color: colors.accent.ember500, fontSize: typeScale.caption.size, marginTop: -8 },
  form: {
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border.hairline,
    paddingTop: 18,
  },
  field: { gap: 6 },
  fieldLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '500' },
  inlineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  half: { flexBasis: '47%', flexGrow: 1 },
  recentList: { gap: 8, borderTopWidth: 1, borderTopColor: colors.border.hairline, paddingTop: 18 },
  sectionLabel: {
    color: colors.text.secondary,
    fontSize: typeScale.label.size,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.card,
  },
  recentText: { flex: 1, gap: 2 },
  recentName: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '600' },
  recentMeta: { color: colors.text.muted, fontSize: typeScale.caption.size },
  recentKcal: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h3.size,
    fontVariant: ['tabular-nums'],
  },
  muted: { color: colors.text.muted, fontSize: typeScale.caption.size },
});
