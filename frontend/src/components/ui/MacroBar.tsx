import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, typeScale } from '@/theme';

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

type MacroKey = keyof Macros;

const MACROS: { key: MacroKey; label: string; color: string }[] = [
  { key: 'protein', label: 'Protein', color: colors.macros.protein },
  { key: 'carbs', label: 'Carbs', color: colors.macros.carbs },
  { key: 'fat', label: 'Fat', color: colors.macros.fat },
];

function fillPct(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(1, value / target));
}

export function MacroBar({
  consumed,
  targets,
  height = 8,
}: {
  consumed: Macros;
  targets: Macros;
  height?: number;
}) {
  return (
    <View style={[styles.bar, { height }]}>
      {MACROS.map(({ key, color }) => (
        <View key={key} style={{ flex: Math.max(targets[key], 1), justifyContent: 'center' }}>
          <View
            style={{
              height,
              width: `${fillPct(consumed[key], targets[key]) * 100}%`,
              backgroundColor: color,
              borderRadius: radius.pill,
            }}
          />
        </View>
      ))}
    </View>
  );
}

export function MacroLegend({
  consumed,
  targets,
}: {
  consumed: Macros;
  targets: Macros;
}) {
  return (
    <View style={styles.legend}>
      {MACROS.map(({ key, label, color }) => (
        <View key={key} style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.legendLabel}>{label}</Text>
          <Text style={styles.legendValue}>
            {Math.round(consumed[key])}/{Math.round(targets[key])}g
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 2, borderRadius: radius.pill, overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, columnGap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { color: colors.text.secondary, fontSize: typeScale.caption.size },
  legendValue: {
    color: colors.text.primary,
    fontSize: typeScale.caption.size,
    fontFamily: fonts.display.bold,
    fontVariant: ['tabular-nums'],
  },
});
