import { useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, targetMin, typeScale } from '@/theme';

export function Stepper({
  value,
  onDecrement,
  onIncrement,
  label,
  disabled,
  valueStyle,
}: {
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
  label?: string;
  disabled?: boolean;
  valueStyle?: object;
}) {
  return (
    <View style={styles.stepperRow}>
      {label ? <Text style={styles.stepperLabel}>{label}</Text> : null}
      <View style={styles.stepper}>
        <Pressable
          onPress={onDecrement}
          disabled={disabled}
          style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Text style={styles.stepperSign}>−</Text>
        </Pressable>
        <Text style={[styles.stepperValue, valueStyle]}>{value}</Text>
        <Pressable
          onPress={onIncrement}
          disabled={disabled}
          style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Text style={styles.stepperSign}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function OptionCard({
  title,
  subtitle,
  selected,
  onPress,
  leading,
}: {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress: () => void;
  leading?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        selected && styles.optionCardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.optionRow}>
        {leading ? <View style={styles.optionLeading}>{leading}</View> : null}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.optionTitle, selected && { color: colors.accent.ember500 }]}>{title}</Text>
          {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
        </View>
        <Text style={styles.optionCheck}>{selected ? '✓' : ''}</Text>
      </View>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipLabel, selected && { color: colors.text.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segBtn, active && styles.segBtnActive]}
          >
            <Text style={[styles.segLabel, active && { color: colors.text.onAccent }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PaceSlider({
  value,
  min = -1,
  max = 0.5,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  const trackRef = useRef<View>(null);
  const [track, setTrack] = useState({ x: 0, width: 0 });
  const thumb = 28;

  const measure = () => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      setTrack((prev) => (prev.x === x && prev.width === width ? prev : { x, width }));
    });
  };

  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const usable = Math.max(0, track.width - thumb);
  const thumbX = pct * usable;

  // pageX is stable across targets; locationX jumps between the track and the
  // thumb as the finger moves, which made the slider glitch back and forth.
  const setFromPageX = (pageX: number) => {
    if (usable <= 0) return;
    const ratio = Math.max(0, Math.min(1, (pageX - track.x - thumb / 2) / usable));
    const next = min + ratio * (max - min);
    onChange(Math.round(next * 100) / 100);
  };

  return (
    <View>
      <View
        ref={trackRef}
        style={styles.sliderTicks}
        onLayout={measure}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => setFromPageX(e.nativeEvent.pageX)}
        onResponderMove={(e) => setFromPageX(e.nativeEvent.pageX)}
      >
        <View pointerEvents="none" style={styles.sliderTrack} />
        <View pointerEvents="none" style={[styles.sliderFill, { width: thumbX + thumb / 2 }]} />
        <View pointerEvents="none" style={[styles.sliderThumb, { left: thumbX }]} />
        {[0.125, 0.375, 0.625, 0.875].map((t) => (
          <View key={t} pointerEvents="none" style={[styles.sliderTick, { left: `${t * 100}%` }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  stepperLabel: {
    color: colors.text.secondary,
    fontSize: typeScale.label.size,
    fontWeight: '500',
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  stepperBtn: {
    width: targetMin,
    height: targetMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.elevated,
  },
  stepperSign: {
    color: colors.text.primary,
    fontSize: typeScale.h2.size,
    fontFamily: fonts.display.medium,
    lineHeight: undefined,
  },
  stepperValue: {
    minWidth: 44,
    textAlign: 'center',
    color: colors.text.primary,
    fontSize: typeScale.title.size,
    fontFamily: fonts.display.bold,
    fontVariant: ['tabular-nums'],
  },
  optionCard: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionCardSelected: {
    borderColor: colors.accent.ember500,
    backgroundColor: colors.bg.overlay,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionLeading: { width: 24, alignItems: 'center' },
  optionTitle: {
    color: colors.text.primary,
    fontSize: typeScale.body.size,
    fontWeight: '600',
  },
  optionSubtitle: { color: colors.text.secondary, fontSize: typeScale.caption.size },
  optionCheck: {
    color: colors.accent.ember500,
    fontSize: typeScale.body.size,
    fontWeight: '700',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.card,
  },
  chipSelected: {
    borderColor: colors.accent.ember500,
    backgroundColor: colors.accent.ember500,
  },
  chipLabel: { color: colors.text.primary, fontSize: typeScale.label.size, fontWeight: '600' },
  segmented: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  segBtn: {
    paddingHorizontal: 20,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segBtnActive: { backgroundColor: colors.accent.ember500 },
  segLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  sliderTicks: {
    height: 44,
    justifyContent: 'center',
  },
  sliderTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bg.overlay,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.ember500,
  },
  sliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.ember500,
    shadowColor: colors.accent.ember500,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  sliderTick: {
    position: 'absolute',
    width: 1,
    height: 8,
    backgroundColor: colors.border.hairline,
  },
});