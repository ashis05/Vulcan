import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { SparkIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radius, typeScale } from '@/theme';

/** Wave C scaffold — PR detection, notes and the ember burst land in wave D. */
export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const { name, elapsed, vol, sets } = useLocalSearchParams<{
    name?: string;
    elapsed?: string;
    vol?: string;
    sets?: string;
  }>();

  const secs = parseInt(elapsed ?? '0', 10) || 0;
  const mm = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, '0');
  const volume = parseInt(vol ?? '0', 10) || 0;

  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.head}>
          <View style={styles.kickRow}>
            <SparkIcon size={14} color={colors.accent.ember500} filled />
            <Text style={styles.kick}>Session forged</Text>
          </View>
          <Text style={styles.title}>{name ?? 'Workout'} — done.</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Duration</Text>
            <Text style={styles.tileValue}>
              {mm}:{ss}
            </Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Volume</Text>
            <Text style={styles.tileValue}>{volume.toLocaleString()}</Text>
            <Text style={styles.tileUnit}>kg</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Sets</Text>
            <Text style={styles.tileValue}>{sets ?? '0'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="Done" onPress={() => router.replace('/train')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: 16, gap: 16 },
  head: { gap: 6, marginTop: 8 },
  kickRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kick: {
    color: colors.accent.ember500,
    fontSize: typeScale.caption.size,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    lineHeight: typeScale.title.lineHeight,
  },
  stats: { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 14,
    gap: 4,
  },
  tileLabel: { color: colors.text.secondary, fontSize: typeScale.caption.size, fontWeight: '600' },
  tileValue: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
    fontVariant: ['tabular-nums'],
  },
  tileUnit: { color: colors.text.muted, fontSize: typeScale.caption.size },
  footer: { paddingHorizontal: 16, paddingBottom: 16 },
});
