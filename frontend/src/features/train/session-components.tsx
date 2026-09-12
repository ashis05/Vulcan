import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

import { CheckIcon, MoreIcon, PlusIcon } from '@/components/icons';
import type { SetType } from '@/engine/strength';
import { colors, fonts, radius, typeScale } from '@/theme';

import type { SessionExercise, SessionSet } from './session-store';
import { MUSCLE_LABELS } from './types';

function setTypeColor(type: SetType): string {
  if (type === 'warmup') return colors.text.muted;
  if (type === 'drop') return colors.charts[1];
  if (type === 'failure') return colors.semantic.danger;
  return colors.text.primary;
}

function setTypeBadge(type: SetType): string {
  if (type === 'warmup') return 'W';
  if (type === 'drop') return 'D';
  if (type === 'failure') return 'F';
  return '';
}

function SetField({
  value,
  onChangeText,
  placeholder,
  width,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  width: number;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.text.muted}
      keyboardType="numeric"
      style={[styles.setField, { width }]}
    />
  );
}

function SetRow({
  set,
  prev,
  onChange,
  onToggle,
  onOptions,
}: {
  set: SessionSet;
  prev?: { weightKg: number; reps: number };
  onChange: (patch: Partial<Pick<SessionSet, 'weightKg' | 'reps' | 'rpe'>>) => void;
  onToggle: () => void;
  onOptions: () => void;
}) {
  const [flash] = useState(() => new Animated.Value(set.completed ? 1 : 0));

  useEffect(() => {
    Animated.timing(flash, {
      toValue: set.completed ? 1 : 0,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [set.completed, flash]);

  const backgroundColor = flash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,106,0,0)', 'rgba(255,106,0,0.10)'],
  });

  return (
    <Animated.View style={[styles.setRow, { backgroundColor }]}>
      <Pressable onLongPress={onOptions} delayLongPress={300} style={styles.setNumBtn}>
        <Text style={[styles.setNum, { color: set.completed ? colors.accent.ember400 : setTypeColor(set.type) }]}>
          {set.setNumber}
          {setTypeBadge(set.type) ? <Text style={styles.setTypeBadge}>{setTypeBadge(set.type)}</Text> : null}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => prev && onChange({ weightKg: String(prev.weightKg), reps: String(prev.reps) })}
        disabled={!prev}
        style={styles.prevBtn}
      >
        <Text style={[styles.prevText, !prev && styles.prevEmpty]} numberOfLines={1}>
          {prev ? `${prev.weightKg} × ${prev.reps}` : '—'}
        </Text>
      </Pressable>
      <SetField value={set.weightKg} onChangeText={(v) => onChange({ weightKg: v })} placeholder="kg" width={54} />
      <SetField value={set.reps} onChangeText={(v) => onChange({ reps: v })} placeholder="reps" width={50} />
      <SetField value={set.rpe} onChangeText={(v) => onChange({ rpe: v })} placeholder="RPE" width={44} />
      <Pressable
        onPress={onToggle}
        onLongPress={onOptions}
        accessibilityLabel={`Complete set ${set.setNumber}`}
        style={[styles.check, set.completed && styles.checkLit]}
      >
        <CheckIcon size={18} color={set.completed ? colors.text.onAccent : colors.text.muted} />
      </Pressable>
    </Animated.View>
  );
}

export function ExerciseCard({
  index,
  item,
  prev,
  onAddSet,
  onSetChange,
  onToggleSet,
  onSetOptions,
  onExerciseOptions,
}: {
  index: number;
  item: SessionExercise;
  prev?: { weightKg: number; reps: number };
  onAddSet: () => void;
  onSetChange: (setKey: string, patch: Partial<Pick<SessionSet, 'weightKg' | 'reps' | 'rpe'>>) => void;
  onToggleSet: (set: SessionSet) => void;
  onSetOptions: (set: SessionSet) => void;
  onExerciseOptions: () => void;
}) {
  const done = item.sets.length > 0 && item.sets.every((s) => s.completed);
  const kicker = `${index + 1} · ${MUSCLE_LABELS[item.exercise.primaryMuscle]}${
    item.supersetGroup ? ' · superset' : ''
  }`;

  return (
    <View style={[styles.card, item.supersetGroup && styles.cardSuperset]}>
      <View style={styles.cardHead}>
        <View style={styles.cardHeadText}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.exName}>{item.exercise.name}</Text>
        </View>
        {done ? (
          <View style={styles.doneFlash}>
            <CheckIcon size={12} color={colors.accent.ember400} />
            <Text style={styles.doneText}>Done</Text>
          </View>
        ) : null}
        <Pressable onPress={onExerciseOptions} hitSlop={8} style={styles.moreBtn}>
          <MoreIcon size={18} color={colors.text.muted} />
        </Pressable>
      </View>

      {item.sets.map((set) => (
        <SetRow
          key={set.key}
          set={set}
          prev={prev}
          onChange={(patch) => onSetChange(set.key, patch)}
          onToggle={() => onToggleSet(set)}
          onOptions={() => onSetOptions(set)}
        />
      ))}

      <Pressable onPress={onAddSet} style={styles.addSet}>
        <PlusIcon size={14} color={colors.text.secondary} />
        <Text style={styles.addSetText}>Add set</Text>
      </Pressable>
    </View>
  );
}

export function RestTimerBar({
  remaining,
  total,
  onAdd,
  onSkip,
}: {
  remaining: number;
  total: number;
  onAdd: () => void;
  onSkip: () => void;
}) {
  const r = 24;
  const circumference = 2 * Math.PI * r;
  const progress = total > 0 ? Math.max(0, remaining) / total : 0;
  const mm = Math.floor(Math.max(0, remaining) / 60);
  const ss = String(Math.max(0, remaining) % 60).padStart(2, '0');
  const critical = remaining > 0 && remaining <= 10;

  return (
    <View style={styles.restBar}>
      <Svg width={56} height={56}>
        <Circle cx={28} cy={28} r={r} stroke={colors.bg.overlay} strokeWidth={4} fill="none" />
        <Circle
          cx={28}
          cy={28}
          r={r}
          stroke={critical ? colors.semantic.danger : colors.accent.ember500}
          strokeWidth={4}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
      </Svg>
      <View style={styles.restLabels}>
        <Text style={styles.restState}>Rest · auto</Text>
        <Text style={[styles.restTime, critical && { color: colors.semantic.danger }]}>
          {mm}:{ss}
        </Text>
      </View>
      <View style={styles.restActions}>
        <Pressable onPress={onAdd} hitSlop={6} style={styles.restBtn} accessibilityLabel="Add 30 seconds">
          <PlusIcon size={18} color={colors.text.primary} />
        </Pressable>
        <Pressable onPress={onSkip} hitSlop={6} style={styles.restSkip}>
          <Text style={styles.restSkipText}>Skip ×</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 14,
    gap: 8,
  },
  cardSuperset: { borderLeftWidth: 3, borderLeftColor: colors.charts[1] },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardHeadText: { flex: 1, gap: 2 },
  kicker: {
    color: colors.text.muted,
    fontSize: typeScale.caption.size,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  exName: { color: colors.text.primary, fontFamily: fonts.display.bold, fontSize: typeScale.h3.size },
  doneFlash: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText: { color: colors.accent.ember400, fontSize: typeScale.caption.size, fontWeight: '600' },
  moreBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    borderRadius: radius.sm,
    paddingHorizontal: 4,
  },
  setNumBtn: { width: 22, alignItems: 'center' },
  setNum: {
    fontFamily: fonts.display.bold,
    fontSize: typeScale.body.size,
    fontVariant: ['tabular-nums'],
  },
  setTypeBadge: { fontSize: 9 },
  prevBtn: {
    width: 56,
    height: 32,
    justifyContent: 'center',
  },
  prevText: { color: colors.text.secondary, fontSize: typeScale.caption.size, fontVariant: ['tabular-nums'] },
  prevEmpty: { color: colors.text.muted },
  setField: {
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
  check: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLit: { backgroundColor: colors.accent.ember500, borderColor: colors.accent.ember500 },
  addSet: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 4 },
  addSetText: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  restBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.elevated,
  },
  restLabels: { flex: 1, gap: 2 },
  restState: { color: colors.text.secondary, fontSize: typeScale.caption.size, fontWeight: '600' },
  restTime: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
    fontVariant: ['tabular-nums'],
  },
  restActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  restBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restSkip: { height: 40, justifyContent: 'center', paddingHorizontal: 8 },
  restSkipText: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
});
