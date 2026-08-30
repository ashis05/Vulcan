import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { AnvilIcon } from '@/components/icons';
import { colors, fonts, typeScale } from '@/theme';

export default function TrainScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Train</Text>
        <Text style={styles.subtitle}>Workout core lands in Phase 2.</Text>
      </View>
      <View style={styles.empty}>
        <AnvilIcon size={28} color="#FF6A00" />
        <Text style={styles.emptyText}>No sessions yet.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 24 },
  title: {
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    lineHeight: typeScale.title.lineHeight,
    color: colors.text.primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: typeScale.caption.size,
    lineHeight: typeScale.caption.lineHeight,
    color: colors.text.muted,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.4,
  },
  emptyText: { fontSize: typeScale.label.size, color: colors.text.secondary },
});