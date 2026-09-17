import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlateIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { localDateString } from '@/lib/dates';
import { colors, fonts, radius, typeScale } from '@/theme';

import type { Meal, MealSlot } from './types';
import { MEAL_SLOTS, MEAL_SLOT_LABELS } from './types';

const weekday = (dateIso: string): string => {
  const [y, m, d] = dateIso.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(y, m - 1, d));
};

export function DayStrip({
  days,
  selected,
  onSelect,
}: {
  days: string[];
  selected: string;
  onSelect: (day: string) => void;
}) {
  const today = localDateString(new Date());
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
    >
      {days.map((day) => {
        const isSelected = day === selected;
        const isToday = day === today;
        return (
          <Pressable
            key={day}
            onPress={() => onSelect(day)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.dayCell,
              isToday && styles.dayCellToday,
              isSelected && styles.dayCellSelected,
            ]}
          >
            <Text style={[styles.dayNum, isSelected && styles.daySelectedText]}>
              {Number(day.slice(8, 10))}
            </Text>
            <Text style={[styles.dayWeekday, isSelected && styles.daySelectedText]}>
              {weekday(day)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SlotPicker({
  value,
  onChange,
}: {
  value: MealSlot;
  onChange: (slot: MealSlot) => void;
}) {
  return (
    <View style={styles.slots}>
      {MEAL_SLOTS.map((slot) => {
        const selected = slot === value;
        return (
          <Pressable
            key={slot}
            onPress={() => onChange(slot)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.slot, selected && styles.slotSelected]}
          >
            <Text style={[styles.slotText, selected && styles.slotTextSelected]}>
              {MEAL_SLOT_LABELS[slot]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MacroEdit({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (next: number) => void;
}) {
  return (
    <View style={styles.macroEdit}>
      <Pressable
        onPress={() => onChange(Math.max(0, value - step))}
        style={styles.macroBtn}
        accessibilityLabel={`Decrease ${label}`}
      >
        <Text style={styles.macroSign}>−</Text>
      </Pressable>
      <View style={styles.macroVal}>
        <Text style={styles.macroValue}>{Math.round(value)}</Text>
        <Text style={styles.macroUnit}>{label}</Text>
      </View>
      <Pressable
        onPress={() => onChange(value + step)}
        style={styles.macroBtn}
        accessibilityLabel={`Increase ${label}`}
      >
        <Text style={styles.macroSign}>+</Text>
      </Pressable>
    </View>
  );
}

const CONFIDENCE_STYLES = {
  high: { color: colors.semantic.success, border: 'rgba(62,207,142,0.35)', bg: 'rgba(62,207,142,0.08)' },
  medium: { color: colors.semantic.warning, border: 'rgba(255,176,32,0.35)', bg: 'rgba(255,176,32,0.08)' },
  low: { color: colors.semantic.danger, border: 'rgba(244,80,47,0.35)', bg: 'rgba(244,80,47,0.08)' },
} as const;

export function ConfidenceChip({ confidence }: { confidence: 'low' | 'medium' | 'high' }) {
  const tone = CONFIDENCE_STYLES[confidence];
  return (
    <View style={[styles.confidence, { borderColor: tone.border, backgroundColor: tone.bg }]}>
      <Text style={[styles.confidenceText, { color: tone.color }]}>{confidence} AI estimate</Text>
    </View>
  );
}

export function MealCard({
  meal,
  onPress,
  onDelete,
}: {
  meal: Meal;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.meal, pressed && styles.pressed]}>
      <View style={styles.mealThumb}>
        <PlateIcon size={26} color="rgba(255,106,0,0.45)" />
      </View>
      <View style={styles.mealBody}>
        <Text style={styles.mealName} numberOfLines={1}>
          {meal.name}
        </Text>
        <Text style={styles.mealMeta} numberOfLines={1}>
          P {Math.round(meal.proteinG)}g · C {Math.round(meal.carbsG)}g · F {Math.round(meal.fatG)}g
        </Text>
      </View>
      <View style={styles.mealKcal}>
        <Text style={styles.kcalValue}>{meal.calories.toLocaleString()}</Text>
        <Text style={styles.kcalUnit}>kcal</Text>
      </View>
      {onDelete ? (
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          accessibilityLabel={`Delete ${meal.name}`}
          style={styles.deleteBtn}
        >
          <TrashIcon size={18} color={colors.text.muted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export function Fab({ onPress, label = 'Add meal' }: { onPress: () => void; label?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 16 }]}
    >
      <PlusIcon size={26} color={colors.text.onAccent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  dayCell: {
    width: 46,
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayCellToday: { borderColor: colors.accent.ember500 },
  dayCellSelected: { backgroundColor: colors.bg.overlay, borderColor: colors.accent.ember500 },
  dayNum: {
    color: colors.text.muted,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.body.size,
    fontVariant: ['tabular-nums'],
  },
  dayWeekday: { color: colors.text.muted, fontSize: 10 },
  daySelectedText: { color: colors.accent.ember400 },
  slots: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  slot: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotSelected: { borderColor: colors.accent.ember500, backgroundColor: colors.accent.ember500 },
  slotText: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  slotTextSelected: { color: colors.text.onAccent },
  meal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.card,
    padding: 10,
  },
  pressed: { opacity: 0.7 },
  mealThumb: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.overlay,
  },
  mealBody: { flex: 1, minWidth: 0, gap: 2 },
  mealName: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '600' },
  mealMeta: { color: colors.text.muted, fontSize: typeScale.caption.size },
  mealKcal: { alignItems: 'flex-end', gap: 2 },
  kcalValue: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h3.size,
    fontVariant: ['tabular-nums'],
  },
  kcalUnit: { color: colors.text.muted, fontSize: typeScale.caption.size },
  deleteBtn: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center' },
  macroEdit: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.card,
    padding: 8,
  },
  macroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.overlay,
  },
  macroSign: { color: colors.text.secondary, fontSize: 18, lineHeight: 22 },
  macroVal: { flex: 1, alignItems: 'center', gap: 2 },
  macroValue: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
    lineHeight: typeScale.h2.lineHeight,
    fontVariant: ['tabular-nums'],
  },
  macroUnit: { color: colors.text.muted, fontSize: typeScale.caption.size },
  confidence: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  confidenceText: {
    fontSize: typeScale.caption.size,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.ember500,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.glow,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
});
