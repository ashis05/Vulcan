import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, fonts, radius, typeScale } from '@/theme';

type Props = {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaDirection?: 'up' | 'down';
  onPress?: () => void;
  children?: ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export function StatTile({ label, value, unit, delta, deltaDirection, onPress, children, style }: Props) {
  const content = (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {delta ? (
        <Text style={[styles.delta, deltaDirection === 'down' ? styles.deltaDown : styles.deltaUp]}>
          {delta}
        </Text>
      ) : null}
      {children}
    </>
  );

  if (!onPress) {
    return <View style={[styles.tile, style]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 16,
    gap: 2,
  },
  pressed: { opacity: 0.7 },
  label: {
    color: colors.text.secondary,
    fontSize: typeScale.caption.size,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  value: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
    lineHeight: typeScale.h2.lineHeight,
    fontVariant: ['tabular-nums'],
  },
  unit: { color: colors.text.muted, fontSize: typeScale.caption.size },
  delta: { fontSize: typeScale.caption.size, fontWeight: '600', marginTop: 2 },
  deltaUp: { color: colors.semantic.success },
  deltaDown: { color: colors.semantic.danger },
});
