import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { AppleIcon } from '@/components/icons';
import { colors, fonts, typeScale } from '@/theme';

export default function NutritionScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition</Text>
        <Text style={styles.subtitle}>Diary lands in Phase 3.</Text>
      </View>
      <View style={styles.empty}>
        <AppleIcon size={28} color="#FF6A00" />
        <Text style={styles.emptyText}>Nothing logged yet.</Text>
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