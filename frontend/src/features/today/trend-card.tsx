import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { colors, radius, typeScale } from '@/theme';

export function TrendAdjustCard({
  suggestionKcal,
  onConfirm,
  onDismiss,
}: {
  suggestionKcal: number;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const trim = suggestionKcal < 0;
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Adjust target?</Text>
      <Text style={styles.body}>
        Your 14-day weight trend contradicts your goal. {trim ? 'Trim' : 'Add'}{' '}
        {Math.abs(suggestionKcal)} kcal/day?
      </Text>
      <View style={styles.actions}>
        <Pressable onPress={onDismiss} style={[styles.btn, styles.ghost]}>
          <Text style={styles.ghostText}>Not now</Text>
        </Pressable>
        <Pressable onPress={onConfirm} style={[styles.btn, styles.primary]}>
          <Text style={styles.primaryText}>Apply</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  title: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '700' },
  body: { color: colors.text.secondary, fontSize: typeScale.label.size, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: { borderWidth: 1, borderColor: colors.border.hairline },
  ghostText: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  primary: { backgroundColor: colors.accent.ember500 },
  primaryText: { color: colors.text.onAccent, fontSize: typeScale.label.size, fontWeight: '700' },
});
