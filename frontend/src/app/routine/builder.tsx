import { useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ReorderableList, { useReorderableDrag } from 'react-native-reorderable-list';

import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  GripIcon,
  PlusIcon,
} from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { SectionLabel } from '@/features/train/components';
import { toDraft, useBuilderStore, type BuilderItem } from '@/features/train/builder-store';
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

function BuilderRow({
  item,
  index,
  total,
  onRemove,
  onUpdate,
  onMove,
  onToggleSuperset,
}: {
  item: BuilderItem;
  index: number;
  total: number;
  onRemove: () => void;
  onUpdate: (patch: Partial<Pick<BuilderItem, 'targetSets' | 'targetReps' | 'targetRpe' | 'restSeconds'>>) => void;
  onMove: (delta: -1 | 1) => void;
  onToggleSuperset: () => void;
}) {
  const drag = useReorderableDrag();
  const last = index === total - 1;

  return (
    <View style={[styles.card, item.supersetWithNext && styles.cardSuperset]}>
      <View style={styles.cardHead}>
        <Pressable onLongPress={drag} delayLongPress={150} hitSlop={8} style={styles.dragHandle}>
          <GripIcon size={20} color={colors.text.muted} />
        </Pressable>
        <Text style={styles.exName} numberOfLines={1}>
          {item.exercise.name}
        </Text>
        <Pressable onPress={() => onMove(-1)} disabled={index === 0} hitSlop={6} style={[styles.iconBtn, index === 0 && styles.disabled]}>
          <ChevronUpIcon size={16} color={colors.text.muted} />
        </Pressable>
        <Pressable onPress={() => onMove(1)} disabled={last} hitSlop={6} style={[styles.iconBtn, last && styles.disabled]}>
          <ChevronDownIcon size={16} color={colors.text.muted} />
        </Pressable>
        <Pressable onPress={onRemove} hitSlop={8} style={styles.iconBtn}>
          <CloseIcon size={18} color={colors.text.muted} />
        </Pressable>
      </View>

      <View style={styles.miniRow}>
        <Text style={styles.miniLabel}>Sets</Text>
        <MiniField value={item.targetSets} onChangeText={(v) => onUpdate({ targetSets: v })} />
        <Text style={styles.miniLabel}>Reps</Text>
        <MiniField value={item.targetReps} onChangeText={(v) => onUpdate({ targetReps: v })} width={64} placeholder="8-12" />
        <Text style={styles.miniLabel}>RPE</Text>
        <MiniField value={item.targetRpe} onChangeText={(v) => onUpdate({ targetRpe: v })} width={48} />
      </View>

      <View style={styles.cardFoot}>
        <View style={styles.restRow}>
          <Text style={styles.miniLabel}>Rest</Text>
          <MiniField value={item.restSeconds} onChangeText={(v) => onUpdate({ restSeconds: v })} width={56} />
          <Text style={styles.miniLabel}>sec</Text>
        </View>
        <Pressable
          onPress={onToggleSuperset}
          disabled={last}
          hitSlop={6}
          style={[styles.supBtn, last && styles.disabled]}
        >
          {item.supersetWithNext ? (
            <CheckIcon size={13} color={colors.charts[1]} />
          ) : (
            <PlusIcon size={13} color={colors.text.secondary} />
          )}
          <Text style={[styles.supLabel, item.supersetWithNext && { color: colors.charts[1] }]}>Superset</Text>
        </Pressable>
      </View>
    </View>
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
  const reorder = useBuilderStore((s) => s.reorder);
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

      <View style={styles.headerArea}>
        <TextField label="Routine name" placeholder="Push · A" value={name} onChangeText={setName} />
        <SectionLabel style={styles.sectionLabel}>Exercises</SectionLabel>
      </View>

      <ReorderableList
        data={items}
        keyExtractor={(item) => item.key}
        onReorder={({ from, to }) => reorder(from, to)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No exercises yet. Add some below.</Text>}
        renderItem={({ item, index }) => (
          <BuilderRow
            item={item}
            index={index}
            total={items.length}
            onRemove={() => remove(item.key)}
            onUpdate={(patch) => update(item.key, patch)}
            onMove={(delta) => move(item.key, delta)}
            onToggleSuperset={() => toggleSuperset(item.key)}
          />
        )}
      />

      <View style={styles.footerBar}>
        <Button label="Add exercise" variant="ghost" onPress={() => router.push('/exercise-picker')} />
        <Button
          label={saveRoutine.isPending ? 'Saving…' : 'Save routine'}
          onPress={onSave}
          disabled={saveRoutine.isPending}
        />
        {routineId ? <Button label="Delete routine" variant="destructive" onPress={onDelete} /> : null}
      </View>
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
  headerArea: { paddingHorizontal: 16, paddingTop: 8, gap: 14 },
  sectionLabel: { marginTop: 2 },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 12, gap: 10 },
  empty: { color: colors.text.muted, fontSize: typeScale.label.size, paddingVertical: 8 },
  card: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 12,
    gap: 10,
  },
  cardSuperset: { borderLeftWidth: 3, borderLeftColor: colors.charts[1] },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dragHandle: { width: 28, height: 32, alignItems: 'center', justifyContent: 'center' },
  exName: { flex: 1, color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '600' },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.25 },
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
  supLabel: { color: colors.text.secondary, fontSize: typeScale.caption.size, fontWeight: '600' },
  footerBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 8 },
});
