import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ArrowLeftIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { ChoiceChip, PickerRow } from '@/features/train/components';
import { useBuilderStore } from '@/features/train/builder-store';
import { useCreateExercise, useExercises } from '@/features/train/hooks';
import type { Equipment, Exercise, MuscleGroup } from '@/features/train/types';
import { EQUIPMENT_LABELS, MUSCLE_FILTERS, MUSCLE_LABELS } from '@/features/train/types';
import { colors, fonts, radius, typeScale } from '@/theme';

const MUSCLE_OPTIONS = Object.keys(MUSCLE_LABELS) as MuscleGroup[];
const EQUIPMENT_OPTIONS = Object.keys(EQUIPMENT_LABELS) as Equipment[];

export default function ExercisePickerScreen() {
  const router = useRouter();
  const exercises = useExercises();
  const addExercises = useBuilderStore((s) => s.addExercises);
  const createExercise = useCreateExercise();

  const [query, setQuery] = useState('');
  const [filterIndex, setFilterIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, Exercise>>({});
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('chest');
  const [customEquipment, setCustomEquipment] = useState<Equipment>('barbell');

  const filtered = useMemo(() => {
    const list = exercises.data ?? [];
    const q = query.trim().toLowerCase();
    const muscles = MUSCLE_FILTERS[filterIndex].muscles;
    return list.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q)) return false;
      if (muscles && !muscles.includes(e.primaryMuscle)) return false;
      return true;
    });
  }, [exercises.data, query, filterIndex]);

  const selectedCount = Object.keys(selected).length;

  const toggle = (exercise: Exercise) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[exercise.id]) delete next[exercise.id];
      else next[exercise.id] = exercise;
      return next;
    });
  };

  const onDone = () => {
    addExercises(Object.values(selected));
    router.back();
  };

  const onSaveCustom = async () => {
    if (!customName.trim()) return;
    try {
      const created = await createExercise.mutateAsync({
        name: customName,
        primaryMuscle: customMuscle,
        equipment: customEquipment,
      });
      setSelected((prev) => ({ ...prev, [created.id]: created }));
      setCustomOpen(false);
      setCustomName('');
      setCustomMuscle('chest');
      setCustomEquipment('barbell');
    } catch {
      // keep the sheet open so the user can retry
    }
  };

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>Builder</Text>
        </Pressable>
        <Text style={styles.count}>{selectedCount} selected</Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchIcon size={16} color={colors.text.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          placeholderTextColor={colors.text.muted}
          style={styles.search}
          autoCorrect={false}
        />
      </View>

      <View style={styles.filters}>
        {MUSCLE_FILTERS.map((f, i) => (
          <ChoiceChip key={f.label} label={f.label} selected={filterIndex === i} onPress={() => setFilterIndex(i)} />
        ))}
      </View>

      {exercises.isPending ? (
        <ActivityIndicator color={colors.accent.ember500} style={styles.loading} />
      ) : exercises.isError ? (
        <Text style={styles.error}>Could not load exercises.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Pressable onPress={() => setCustomOpen(true)} style={styles.customRow}>
              <PlusIcon size={18} color={colors.accent.ember500} />
              <Text style={styles.customLabel}>Create custom exercise</Text>
            </Pressable>
          }
          renderItem={({ item }) => (
            <PickerRow
              exercise={item}
              selected={!!selected[item.id]}
              onPress={() => toggle(item)}
            />
          )}
        />
      )}

      <View style={styles.footer}>
        <Button label="Done" onPress={onDone} disabled={selectedCount < 1} />
      </View>

      <Modal visible={customOpen} transparent animationType="slide" onRequestClose={() => setCustomOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCustomOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Custom exercise</Text>
          <TextField
            label="Name"
            placeholder="e.g. Landmine press"
            value={customName}
            onChangeText={setCustomName}
            autoFocus
          />
          <Text style={styles.fieldLabel}>Primary muscle</Text>
          <View style={styles.chipWrap}>
            {MUSCLE_OPTIONS.map((m) => (
              <ChoiceChip
                key={m}
                label={MUSCLE_LABELS[m]}
                selected={customMuscle === m}
                onPress={() => setCustomMuscle(m)}
              />
            ))}
          </View>
          <Text style={styles.fieldLabel}>Equipment</Text>
          <View style={styles.chipWrap}>
            {EQUIPMENT_OPTIONS.map((e) => (
              <ChoiceChip
                key={e}
                label={EQUIPMENT_LABELS[e]}
                selected={customEquipment === e}
                onPress={() => setCustomEquipment(e)}
              />
            ))}
          </View>
          <View style={styles.sheetActions}>
            <Button label="Cancel" variant="ghost" fullWidth={false} onPress={() => setCustomOpen(false)} />
            <Button
              label={createExercise.isPending ? 'Saving…' : 'Save exercise'}
              fullWidth={false}
              onPress={onSaveCustom}
              disabled={createExercise.isPending || !customName.trim()}
            />
          </View>
        </View>
      </Modal>
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
  count: { color: colors.text.muted, fontSize: typeScale.caption.size },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.elevated,
  },
  search: { flex: 1, color: colors.text.primary, fontSize: typeScale.body.size },
  filters: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loading: { marginTop: 32 },
  error: { color: colors.semantic.danger, fontSize: typeScale.label.size, padding: 16 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  customLabel: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '600' },
  footer: { paddingHorizontal: 16, paddingBottom: 12 },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: colors.border.hairline,
    padding: 20,
    paddingBottom: 28,
    gap: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.hairline,
    marginBottom: 4,
  },
  sheetTitle: { color: colors.text.primary, fontFamily: fonts.display.bold, fontSize: typeScale.h2.size },
  fieldLabel: {
    color: colors.text.secondary,
    fontSize: typeScale.label.size,
    fontWeight: '600',
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sheetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
});
