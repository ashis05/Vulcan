import { useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  PlusIcon,
} from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { SectionLabel } from '@/features/train/components';
import { toDraft, useBuilderStore } from '@/features/train/builder-store';
import { useDeleteRoutine, useRoutine, useSaveRoutine } from '@/features/train/hooks';
import { colors, fonts, radius, typeScale } from '@/theme';

function MiniField({
  value,
  onChangeText,
  width = 56,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  width?: number;
  placeholder?: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType="numeric"
      placeholder={placeholder}
      placeholderTextColor={colors.text.muted}
      style={[styles.miniInput, { width }]}
    />
  );
}

export default function RoutineBuilderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const routine = useRoutine(id);

  const routineId = useBuilderStore((s) => s.routineId);
  const name = useBuilderStore((s) => s.name);
  const items = useBuilderStore((s) => s.items);
  const setName = useBuilderStore((s) => s.setName);
  const reset = useBuilderStore((s) => s.reset);
  const load = useBuilderStore((s) => s.load);
  const remove = useBuilderStore((s) => s.remove);
  const update = useBuilderStore((s) => s.update);
  const move = useBuilderStore((s) => s.move);
  const toggleSuperset = useBuilderStore((s) => s.toggleSuperset);

  const saveRoutine = useSaveRoutine();
  const deleteRoutine = useDeleteRoutine();

  const initialized = useRef<string | null>(null);
  useEffect(() => {
    if (initialized.current === (id ?? 'new')) return;
    if (!id) {
      reset();
      initialized.current = 'new';
    } else if (routine.data) {
      load(routine.data);
      initialized.current = id;
    }
  }, [id, routine.data, reset, load]);

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name your routine', 'Give it a name before saving.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Add exercises', 'Add at least one exercise before saving.');
      return;
    }
    try {
      await saveRoutine.mutateAsync({ id: routineId, name, exercises: toDraft(items) });
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const onDelete = () => {
    if (!routineId) return;
    Alert.alert('Delete routine', 'This routine will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRoutine.mutateAsync(routineId);
            router.replace('/train');
          } catch (e) {
            Alert.alert('Could not delete', e instanceof Error ? e.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>Train</Text>
        </Pressable>
        <Text style={styles.navTitle}>{id ? 'Builder' : 'New routine'}</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        <TextField label="Routine name" placeholder="Push · A" value={name} onChangeText={setName} />

        <View style={styles.section}>
          <SectionLabel>Exercises</SectionLabel>
          {items.length === 0 ? (
            <Text style={styles.empty}>No exercises yet. Add some below.</Text>
          ) : (
            <View style={styles.list}>
              {items.map((item, index) => (
                <View
                  key={item.key}
                  style={[styles.card, item.supersetWithNext && styles.cardSuperset]}
                >
                  <View style={styles.cardHead}>
                    <View style={styles.reorder}>
                      <Pressable
                        onPress={() => move(item.key, -1)}
                        disabled={index === 0}
                        hitSlop={6}
                        style={[styles.moveBtn, index === 0 && styles.moveDisabled]}
                      >
                        <ChevronUpIcon size={16} color={colors.text.muted} />
                      </Pressable>
                      <Pressable
                        onPress={() => move(item.key, 1)}
                        disabled={index === items.length - 1}
                        hitSlop={6}
                        style={[styles.moveBtn, index === items.length - 1 && styles.moveDisabled]}
                      >
                        <ChevronDownIcon size={16} color={colors.text.muted} />
                      </Pressable>
                    </View>
                    <Text style={styles.exName} numberOfLines={1}>
                      {item.exercise.name}
                    </Text>
                    <Pressable onPress={() => remove(item.key)} hitSlop={8} style={styles.removeBtn}>
                      <CloseIcon size={18} color={colors.text.muted} />
                    </Pressable>
                  </View>

                  <View style={styles.miniRow}>
                    <Text style={styles.miniLabel}>Sets</Text>
                    <MiniField value={item.targetSets} onChangeText={(v) => update(item.key, { targetSets: v })} />
                    <Text style={styles.miniLabel}>Reps</Text>
                    <MiniField
                      value={item.targetReps}
                      onChangeText={(v) => update(item.key, { targetReps: v })}
                      width={64}
                      placeholder="8-12"
                    />
                    <Text style={styles.miniLabel}>RPE</Text>
                    <MiniField value={item.targetRpe} onChangeText={(v) => update(item.key, { targetRpe: v })} width={48} />
                  </View>

                  <View style={styles.cardFoot}>
                    <View style={styles.restRow}>
                      <Text style={styles.miniLabel}>Rest</Text>
                      <MiniField
                        value={item.restSeconds}
                        onChangeText={(v) => update(item.key, { restSeconds: v })}
                        width={56}
                      />
                      <Text style={styles.miniLabel}>sec</Text>
                    </View>
                    <Pressable
                      onPress={() => toggleSuperset(item.key)}
                      disabled={index === items.length - 1}
                      hitSlop={6}
                      style={[
                        styles.supBtn,
                        item.supersetWithNext && styles.supBtnOn,
                        index === items.length - 1 && styles.moveDisabled,
                      ]}
                    >
                      {item.supersetWithNext ? (
                        <CheckIcon size={13} color={colors.charts[1]} />
                      ) : (
                        <PlusIcon size={13} color={colors.text.secondary} />
                      )}
                      <Text
                        style={[styles.supLabel, item.supersetWithNext && { color: colors.charts[1] }]}
                      >
                        Superset
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <Button
          label="Add exercise"
          variant="ghost"
          onPress={() => router.push('/exercise-picker')}
        />

        <Button
          label={saveRoutine.isPending ? 'Saving…' : 'Save routine'}
          onPress={onSave}
          disabled={saveRoutine.isPending}
        />

        {routineId ? (
          <Button label="Delete routine" variant="destructive" onPress={onDelete} />
        ) : null}
      </ScrollView>
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
  navTitle: { color: colors.text.primary, fontFamily: fonts.display.bold, fontSize: typeScale.h2.size },
  navSpacer: { width: 60 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 32, gap: 18 },
  section: { gap: 10 },
  empty: { color: colors.text.muted, fontSize: typeScale.label.size, paddingVertical: 8 },
  list: { gap: 10 },
  card: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 12,
    gap: 10,
  },
  cardSuperset: { borderLeftWidth: 3, borderLeftColor: colors.charts[1] },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reorder: { gap: 0 },
  moveBtn: { height: 20, justifyContent: 'center' },
  moveDisabled: { opacity: 0.25 },
  exName: { flex: 1, color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '600' },
  removeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  miniLabel: { color: colors.text.muted, fontSize: typeScale.caption.size },
  miniInput: {
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    color: colors.text.primary,
    textAlign: 'center',
    fontFamily: fonts.display.bold,
    fontSize: typeScale.body.size,
  },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  restRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  supBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, paddingHorizontal: 8 },
  supBtnOn: {},
  supLabel: { color: colors.text.secondary, fontSize: typeScale.caption.size, fontWeight: '600' },
});
