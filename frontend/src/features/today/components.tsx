import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { FlameIcon, PlusIcon } from '@/components/icons';
import { StatTile } from '@/components/ui/StatTile';
import { colors, fonts, radius, typeScale } from '@/theme';

export function StreakFlame({ days }: { days: number }) {
  const lit = days > 0;
  return (
    <View style={styles.streak}>
      <FlameIcon size={20} color={lit ? colors.accent.ember400 : colors.text.muted} />
      <Text style={[styles.streakValue, lit && styles.streakLit]}>{days}</Text>
    </View>
  );
}

function MiniBars({ values, highlight }: { values: number[]; highlight: number }) {
  const max = Math.max(...values, 1);
  return (
    <View style={styles.bars}>
      {values.map((value, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            {
              height: Math.max(3, (value / max) * 30),
              backgroundColor: index === highlight ? colors.steps : 'rgba(62,207,142,0.35)',
            },
          ]}
        />
      ))}
    </View>
  );
}

/** Steps tile with a 7-day mini bar chart; last bar = today. */
export function StepsTile({
  steps,
  series,
  onPress,
}: {
  steps: number;
  series: number[];
  onPress?: () => void;
}) {
  return (
    <StatTile label="Steps" value={steps.toLocaleString()} onPress={onPress}>
      <View style={styles.barsWrap}>
        <MiniBars values={series} highlight={series.length - 1} />
      </View>
    </StatTile>
  );
}

export function SheetModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        {children}
      </View>
    </Modal>
  );
}

export function NumberStepper({
  value,
  step,
  min,
  max,
  decimals = 0,
  onChange,
}: {
  value: number;
  step: number;
  min: number;
  max: number;
  decimals?: number;
  onChange: (next: number) => void;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next * 100) / 100));
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(clamp(value - step))}
        style={styles.stepperBtn}
        accessibilityLabel="Decrease"
      >
        <Text style={styles.stepperSign}>−</Text>
      </Pressable>
      <Text style={styles.stepperValue}>{value.toFixed(decimals)}</Text>
      <Pressable
        onPress={() => onChange(clamp(value + step))}
        style={styles.stepperBtn}
        accessibilityLabel="Increase"
      >
        <Text style={styles.stepperSign}>+</Text>
      </Pressable>
    </View>
  );
}

export function SheetAction({
  label,
  onPress,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.action,
        variant === 'primary' ? styles.actionPrimary : styles.actionGhost,
        disabled && styles.actionDisabled,
      ]}
    >
      <Text style={variant === 'primary' ? styles.actionPrimaryText : styles.actionGhostText}>{label}</Text>
    </Pressable>
  );
}

/** Small "+" affordance used by the steps tile fallback. */
export function AddGlyph({ color = colors.accent.ember500 }: { color?: string }) {
  return <PlusIcon size={16} color={color} />;
}

const styles = StyleSheet.create({
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakValue: {
    color: colors.text.muted,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h3.size,
    fontVariant: ['tabular-nums'],
  },
  streakLit: { color: colors.accent.ember400 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 30, flex: 1 },
  bar: { flex: 1, borderRadius: 2 },
  barsWrap: { marginTop: 8 },
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
    padding: 16,
    paddingBottom: 32,
    gap: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.hairline,
    marginBottom: 8,
  },
  sheetTitle: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
    textAlign: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.elevated,
    padding: 3,
    marginVertical: 12,
  },
  stepperBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  stepperSign: { color: colors.text.primary, fontSize: 24, lineHeight: 28 },
  stepperValue: {
    minWidth: 88,
    textAlign: 'center',
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    fontVariant: ['tabular-nums'],
  },
  action: {
    height: 52,
    width: '100%',
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: { backgroundColor: colors.accent.ember500 },
  actionGhost: { borderWidth: 1, borderColor: colors.border.hairline, backgroundColor: colors.bg.card },
  actionDisabled: { opacity: 0.4 },
  actionPrimaryText: { color: colors.text.onAccent, fontSize: typeScale.body.size, fontWeight: '700' },
  actionGhostText: { color: colors.text.secondary, fontSize: typeScale.body.size, fontWeight: '600' },
});
