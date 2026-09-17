import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { ArrowLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { ConfidenceChip, MacroEdit, SlotPicker } from '@/features/nutrition/components';
import { FOOD_SCAN_LIMIT, type FoodEstimate } from '@/features/nutrition/ai';
import { useCreateMeal, useFoodScansToday } from '@/features/nutrition/hooks';
import { slotForTime, type MealSlot } from '@/features/nutrition/types';
import { localDateString } from '@/lib/dates';
import { colors, fonts, radius, typeScale } from '@/theme';

function ServingStepper({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  return (
    <View style={styles.serving}>
      <Pressable onPress={() => onChange(Math.max(1, value - 1))} style={styles.servingBtn} accessibilityLabel="Fewer servings">
        <Text style={styles.servingSign}>−</Text>
      </Pressable>
      <Text style={styles.servingValue}>{value}×</Text>
      <Pressable onPress={() => onChange(Math.min(5, value + 1))} style={styles.servingBtn} accessibilityLabel="More servings">
        <Text style={styles.servingSign}>+</Text>
      </Pressable>
    </View>
  );
}

function ConfirmForm({
  estimate,
  photoPath,
  localUri,
  date,
  scansToday,
}: {
  estimate: FoodEstimate;
  photoPath: string;
  localUri: string;
  date: string;
  scansToday: number;
}) {
  const router = useRouter();
  const createMeal = useCreateMeal();
  const [name, setName] = useState(estimate.name);
  const [slot, setSlot] = useState<MealSlot>(slotForTime(new Date()));
  const [serving, setServing] = useState(1);
  const [kcal, setKcal] = useState(estimate.calories);
  const [protein, setProtein] = useState(estimate.protein_g);
  const [carbs, setCarbs] = useState(estimate.carbs_g);
  const [fat, setFat] = useState(estimate.fat_g);

  const remaining = Math.max(0, FOOD_SCAN_LIMIT - scansToday);
  const usedPct = Math.min(1, scansToday / FOOD_SCAN_LIMIT);

  const applyServing = (next: number) => {
    setServing(next);
    setKcal(Math.round(estimate.calories * next));
    setProtein(Math.round(estimate.protein_g * next));
    setCarbs(Math.round(estimate.carbs_g * next));
    setFat(Math.round(estimate.fat_g * next));
  };

  const log = () => {
    const isToday = date === localDateString(new Date());
    createMeal.mutate(
      {
        name,
        mealSlot: slot,
        calories: kcal,
        proteinG: protein,
        carbsG: carbs,
        fatG: fat,
        source: 'photo',
        photoPath,
        aiRaw: estimate,
        loggedAt: isToday || !date ? undefined : new Date(`${date}T12:00:00`).toISOString(),
      },
      { onSuccess: () => router.dismissAll() },
    );
  };

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.content}>
      <View style={styles.photoBand}>
        {localUri ? (
          <Image source={{ uri: localUri }} style={styles.photo} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.photo, styles.photoEmpty]} />
        )}
        <View style={styles.chipOverlay}>
          <ConfidenceChip confidence={estimate.confidence} />
        </View>
      </View>

      <TextField label="What is it?" value={name} onChangeText={setName} />
      {estimate.serving_description ? (
        <Text style={styles.servingNote}>{estimate.serving_description}</Text>
      ) : null}

      <View style={styles.servingRow}>
        <Text style={styles.overline}>Servings</Text>
        <ServingStepper value={serving} onChange={applyServing} />
      </View>

      <View style={styles.grid}>
        <MacroEdit label="kcal" value={kcal} step={10} onChange={setKcal} />
        <MacroEdit label="protein g" value={protein} step={1} onChange={setProtein} />
        <MacroEdit label="carbs g" value={carbs} step={1} onChange={setCarbs} />
        <MacroEdit label="fat g" value={fat} step={1} onChange={setFat} />
      </View>

      <Text style={styles.disclaimer}>AI estimate — adjust before logging. Small edits happen in grams, not guesses.</Text>
      {estimate.notes ? <Text style={styles.notes}>{estimate.notes}</Text> : null}

      <View style={styles.field}>
        <Text style={styles.overline}>Meal</Text>
        <SlotPicker value={slot} onChange={setSlot} />
      </View>

      <View style={styles.quota}>
        <View style={styles.quotaTop}>
          <Text style={styles.quotaLabel}>Food scans today</Text>
          <Text style={styles.quotaCount}>
            {scansToday} of {FOOD_SCAN_LIMIT}
          </Text>
        </View>
        <View style={styles.quotaTrack}>
          <View style={[styles.quotaFill, { width: `${usedPct * 100}%` }]} />
        </View>
        <Text style={styles.quotaFoot}>
          {remaining} scan{remaining === 1 ? '' : 's'} left · resets at midnight
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={() => router.back()} style={styles.retake}>
          <Text style={styles.retakeText}>Retake</Text>
        </Pressable>
        <View style={styles.logWrap}>
          <Button
            label={createMeal.isPending ? 'Logging…' : 'Log meal'}
            onPress={log}
            disabled={createMeal.isPending || !name.trim()}
          />
        </View>
      </View>
    </ScrollView>
  );
}

export default function ConfirmMealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    photoPath?: string;
    localUri?: string;
    estimate?: string;
    date?: string;
  }>();
  const scans = useFoodScansToday();

  const estimate = useMemo<FoodEstimate | null>(() => {
    if (!params.estimate) return null;
    try {
      return JSON.parse(params.estimate) as FoodEstimate;
    } catch {
      return null;
    }
  }, [params.estimate]);

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.navTitle}>Confirm</Text>
        <View style={styles.navSpacer} />
      </View>

      {!estimate || !params.photoPath ? (
        <View style={styles.center}>
          <Text style={styles.error}>Couldn’t load the estimate.</Text>
          <Button label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      ) : (
        <ConfirmForm
          estimate={estimate}
          photoPath={params.photoPath}
          localUri={params.localUri ?? ''}
          date={params.date ?? ''}
          scansToday={scans.data ?? 0}
        />
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
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, minWidth: 72 },
  backLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  navTitle: { color: colors.text.primary, fontFamily: fonts.display.bold, fontSize: typeScale.h2.size },
  navSpacer: { minWidth: 72 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  error: { color: colors.semantic.danger, fontSize: typeScale.label.size },
  body: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  photoBand: {
    position: 'relative',
    borderRadius: radius.lg,
    overflow: 'hidden',
    aspectRatio: 16 / 10,
    backgroundColor: colors.bg.elevated,
  },
  photo: { width: '100%', height: '100%' },
  photoEmpty: { backgroundColor: colors.bg.overlay },
  chipOverlay: { position: 'absolute', top: 12, right: 12 },
  servingNote: { color: colors.text.muted, fontSize: typeScale.caption.size, marginTop: -6 },
  servingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overline: {
    color: colors.text.secondary,
    fontSize: typeScale.label.size,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  serving: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.card,
    padding: 4,
  },
  servingBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  servingSign: { color: colors.text.primary, fontSize: 20, lineHeight: 24 },
  servingValue: {
    minWidth: 40,
    textAlign: 'center',
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.body.size,
    fontVariant: ['tabular-nums'],
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  disclaimer: { color: colors.text.secondary, fontSize: typeScale.caption.size, lineHeight: 18 },
  notes: { color: colors.text.muted, fontSize: typeScale.caption.size, marginTop: -8 },
  field: { gap: 8 },
  quota: { gap: 6 },
  quotaTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quotaLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  quotaCount: { color: colors.accent.ember500, fontSize: typeScale.label.size, fontWeight: '700' },
  quotaTrack: { height: 4, borderRadius: radius.pill, backgroundColor: colors.bg.overlay, overflow: 'hidden' },
  quotaFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent.ember500 },
  quotaFoot: { color: colors.text.muted, fontSize: typeScale.caption.size },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  retake: { height: 52, paddingHorizontal: 20, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  retakeText: { color: colors.text.secondary, fontSize: typeScale.body.size, fontWeight: '600' },
  logWrap: { flex: 1 },
});
