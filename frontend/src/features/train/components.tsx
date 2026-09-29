import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { CheckIcon, ChevronRightIcon, TrashIcon } from '@/components/icons';
import { colors, fonts, radius, typeScale } from '@/theme';

import { useActiveSession } from './session-store';
import type { Exercise, Routine } from './types';
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from './types';

export function SectionLabel({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return <Text style={[styles.sectionLabel, style]}>{children}</Text>;
}

/** Shown on Today/Train when an in-progress session is persisted. */
export function ActiveSessionBanner() {
  const router = useRouter();
  const session = useActiveSession();
  if (!session.active) return null;

  return (
    <Pressable onPress={() => router.push('/workout/active')} style={styles.resumeBanner}>
      <View style={styles.resumeDot} />
      <View style={styles.resumeText}>
        <Text style={styles.resumeTitle}>Resume workout</Text>
        <Text style={styles.resumeMeta}>
          {session.routineName ?? 'Workout'} · {session.doneSets}/{session.totalSets} sets
        </Text>
      </View>
      <Text style={styles.resumeCta}>Resume</Text>
    </Pressable>
  );
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

export function RoutineCard({
  routine,
  onPress,
  onDelete,
}: {
  routine: Routine;
  onPress: () => void;
  onDelete?: () => void;
}) {
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
        {onDelete ? (
          <Pressable
            onPress={onDelete}
            style={styles.deleteBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${routine.name}`}
          >
            <TrashIcon size={17} color={colors.text.muted} />
          </Pressable>
        ) : null}
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

export function ExerciseThumb({ uri, size = 44 }: { uri?: string | null; size?: number }) {
  const base = { width: size, height: size, borderRadius: radius.sm, backgroundColor: colors.bg.elevated };
  if (!uri) {
    return <View style={[base, styles.thumbEmpty]} />;
  }
  return <Image source={{ uri }} style={base} contentFit="cover" transition={150} />;
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
      <ExerciseThumb uri={exercise.mediaUrl} size={44} />
      <View style={styles.pickerText}>
        <Text style={styles.pickerName}>{exercise.name}</Text>
        <Text style={styles.pickerMeta}>
          {MUSCLE_LABELS[exercise.primaryMuscle]} · {EQUIPMENT_LABELS[exercise.equipment]}
        </Text>
      </View>
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
  resumeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent.ember500,
    backgroundColor: colors.bg.card,
  },
  resumeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent.ember500 },
  resumeText: { flex: 1, gap: 2 },
  resumeTitle: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '600' },
  resumeMeta: { color: colors.text.muted, fontSize: typeScale.caption.size },
  resumeCta: { color: colors.accent.ember500, fontSize: typeScale.label.size, fontWeight: '700' },
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
  deleteBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
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
  thumbEmpty: { borderWidth: 1, borderColor: colors.border.hairline },
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
