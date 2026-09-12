import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ArrowLeftIcon } from '@/components/icons';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, typeScale } from '@/theme';

/** Scaffold only — the live session screen is built in the next wave. */
export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      </View>
      <View style={styles.center}>
        <Text style={styles.title}>Active session</Text>
        <Text style={styles.sub}>The live workout logging screen lands in the next step.</Text>
        {routineId ? <Text style={styles.sub}>Routine: {routineId}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: { paddingHorizontal: 16, paddingTop: 12 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44 },
  backLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  title: { color: colors.text.primary, fontFamily: fonts.display.bold, fontSize: typeScale.title.size },
  sub: { color: colors.text.muted, fontSize: typeScale.label.size, textAlign: 'center' },
});
