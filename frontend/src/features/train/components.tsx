import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { CheckIcon, ChevronRightIcon } from '@/components/icons';
import { colors, fonts, radius, typeScale } from '@/theme';

import type { Exercise, Routine } from './types';
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from './types';

export function SectionLabel({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return <Text style={[styles.sectionLabel, style]}>{children}</Text>;
}

export function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

export function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function summarizeMuscles(routine: Routine): string {
  const seen: string[] = [];
  for (const item of routine.exercises) {
    const label = MUSCLE_LABELS[item.exercise.primaryMuscle];
    if (!seen.includes(label)) seen.push(label);
    if (seen.length === 3) break;
  }
  return seen.join(' · ');
}

export function RoutineCard({ routine, onPress }: { routine: Routine; onPress: () => void }) {
  const preview = routine.exercises.slice(0, 3).map((e) => e.exercise.name);
  const summary = summarizeMuscles(routine);
  const meta = [summary, `${routine.exercises.length} exercises`].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.routineCard, pressed && styles.pressed]}
    >
      <View style={styles.routineTop}>
        <View style={styles.routineText}>
          <Text style={styles.routineName}>{routine.name}</Text>
          <Text style={styles.routineSub}>{meta}</Text>
        </View>
        <ChevronRightIcon size={18} color={colors.text.muted} />
      </View>
      {preview.length > 0 ? (
        <View style={styles.tagRow}>
          {preview.map((name) => (
            <Tag key={name} label={name} />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

export function PickerRow({
  exercise,
  selected,
  onPress,
}: {
  exercise: Exercise;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.pickerRow} accessibilityState={{ selected }}>
      <View style={styles.pickerText}>
        <Text style={styles.pickerName}>{exercise.name}</Text>
      </View>
      <Text style={styles.pickerMeta}>
        {MUSCLE_LABELS[exercise.primaryMuscle]} · {EQUIPMENT_LABELS[exercise.equipment]}
      </Text>
      <View style={[styles.pickerCheck, selected && styles.pickerCheckOn]}>
        {selected ? <CheckIcon size={14} color={colors.text.onAccent} /> : null}
      </View>
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.empty}>
      {icon}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: colors.text.secondary,
    fontSize: typeScale.label.size,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tag: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.elevated,
    paddingHorizontal: 10,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: { color: colors.text.secondary, fontSize: typeScale.caption.size, fontWeight: '600' },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { borderColor: colors.accent.ember500, backgroundColor: colors.accent.ember500 },
  chipText: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  chipTextSelected: { color: colors.text.onAccent },
  routineCard: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 16,
    gap: 10,
  },
  pressed: { opacity: 0.7 },
  routineTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  routineText: { flex: 1, gap: 4 },
  routineName: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '600' },
  routineSub: { color: colors.text.muted, fontSize: typeScale.caption.size },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  pickerText: { flex: 1, minWidth: 0 },
  pickerName: { color: colors.text.primary, fontSize: typeScale.body.size, fontFamily: fonts.body.medium },
  pickerMeta: { color: colors.text.secondary, fontSize: typeScale.caption.size },
  pickerCheck: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCheckOn: { backgroundColor: colors.accent.ember500, borderColor: colors.accent.ember500 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 32 },
  emptyTitle: { color: colors.text.secondary, fontSize: typeScale.label.size },
  emptySub: { color: colors.text.muted, fontSize: typeScale.caption.size },
});
