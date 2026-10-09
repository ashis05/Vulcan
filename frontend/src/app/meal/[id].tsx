import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { MacroEdit, SlotPicker } from '@/features/nutrition/components';
import { useDeleteMeal, useMeal, useUpdateMeal } from '@/features/nutrition/hooks';
import type { Meal, MealSlot } from '@/features/nutrition/types';
import { formatClock } from '@/lib/dates';
import { colors, typeScale } from '@/theme';

function MealEditor({ meal }: { meal: Meal }) {
  const router = useRouter();
  const updateMeal = useUpdateMeal(meal.id);
  const deleteMeal = useDeleteMeal();

  const [name, setName] = useState(meal.name);
  const [slot, setSlot] = useState<MealSlot>(meal.mealSlot);
  const [kcal, setKcal] = useState(meal.calories);
  const [protein, setProtein] = useState(meal.proteinG);
  const [carbs, setCarbs] = useState(meal.carbsG);
  const [fat, setFat] = useState(meal.fatG);

  const save = () => {
    updateMeal.mutate(
      { name, mealSlot: slot, calories: kcal, proteinG: protein, carbsG: carbs, fatG: fat },
      { onSuccess: () => router.back() },
    );
  };

  const confirmDelete = () => {
    Alert.alert('Delete meal?', 'This removes it from the diary.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMeal.mutate(meal.id, { onSuccess: () => router.back() }),
      },
    ]);
  };

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.content}>
      <TextField label="Name" value={name} onChangeText={setName} />

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Meal</Text>
        <SlotPicker value={slot} onChange={setSlot} />
      </View>

      <View style={styles.grid}>
        <MacroEdit label="kcal" value={kcal} step={10} onChange={setKcal} />
        <MacroEdit label="protein g" value={protein} step={1} onChange={setProtein} />
        <MacroEdit label="carbs g" value={carbs} step={1} onChange={setCarbs} />
        <MacroEdit label="fat g" value={fat} step={1} onChange={setFat} />
      </View>

      <Button
        label={updateMeal.isPending ? 'Saving…' : 'Save changes'}
        onPress={save}
        disabled={updateMeal.isPending}
      />
      <Button label="Delete meal" variant="destructive" onPress={confirmDelete} />
    </ScrollView>
  );
}

export default function MealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meal = useMeal(id);

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <Text style={styles.backLabel}>Diary</Text>
        </Pressable>
        {meal.data ? <Text style={styles.time}>Logged {formatClock(meal.data.loggedAt)}</Text> : null}
      </View>

      {meal.isPending ? (
        <ActivityIndicator color={colors.accent.ember500} style={styles.loading} />
      ) : meal.isError || !meal.data ? (
        <Text style={styles.error}>Could not load this meal.</Text>
      ) : (
        <MealEditor meal={meal.data} />
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
  back: { height: 44, justifyContent: 'center' },
  backLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  time: { color: colors.text.muted, fontSize: typeScale.caption.size },
  loading: { marginTop: 48 },
  error: { color: colors.semantic.danger, fontSize: typeScale.label.size, padding: 16 },
  body: { flex: 1 },
  content: { padding: 16, gap: 18, paddingBottom: 40 },
  field: { gap: 6 },
  fieldLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
