import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  AccessibilityInfo,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SparkIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useResultStore } from '@/features/train/result-store';
import { enqueueNotes, flushQueue } from '@/features/train/sync';
import { colors, fonts, radius, typeScale } from '@/theme';

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const result = useResultStore((s) => s.result);
  const clearResult = useResultStore((s) => s.clearResult);
  const [notes, setNotes] = useState('');
  const [showBurst, setShowBurst] = useState(true);

  const scale = useMemo(() => new Animated.Value(0.2), []);
  const opacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        setShowBurst(false);
        return;
      }
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scale, { toValue: 1.15, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => {
        if (!cancelled) setShowBurst(false);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [scale, opacity]);

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
    [],
  );

  const onDone = async () => {
    if (result && notes.trim()) {
      await enqueueNotes(result.workoutId, notes.trim());
      flushQueue().catch(() => {});
    }
    clearResult();
    router.replace('/train');
  };

  const mm = result ? Math.floor(result.durationSec / 60) : 0;
  const ss = result ? String(result.durationSec % 60).padStart(2, '0') : '00';

  return (
    <Screen>
      {showBurst ? (
        <View style={styles.burst} pointerEvents="none">
          <Animated.View style={{ opacity, transform: [{ scale }] }}>
            <SparkIcon size={120} color={colors.accent.ember500} filled />
          </Animated.View>
        </View>
      ) : null}

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.head}>
          <View style={styles.kickRow}>
            <SparkIcon size={14} color={colors.accent.ember500} filled />
            <Text style={styles.kick}>Session forged</Text>
          </View>
          <Text style={styles.title}>{result?.routineName ?? 'Workout'} — done.</Text>
          <Text style={styles.date}>{dateLabel}</Text>
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
            <Text style={styles.tileValue}>{(result?.volume ?? 0).toLocaleString()}</Text>
            <Text style={styles.tileUnit}>kg</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Sets</Text>
            <Text style={styles.tileValue}>{result?.completedSets ?? 0}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>New PRs</Text>
          {result && result.prs.length > 0 ? (
            <View style={styles.prList}>
              {result.prs.map((pr, i) => (
                <View key={`${pr.exerciseId}-${pr.reps}-${i}`} style={styles.prRow}>
                  <Text style={styles.prName}>{pr.exerciseName}</Text>
                  <View style={styles.prBadge}>
                    <SparkIcon size={12} color={colors.accent.ember500} filled />
                    <Text style={styles.prText}>
                      {pr.weightKg} kg × {pr.reps} · e1RM {pr.e1rm}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>No PRs this session — solid work.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="How did it feel? Save it for the coach."
            placeholderTextColor={colors.text.muted}
            multiline
            style={styles.notes}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Done" onPress={onDone} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  burst: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 24, gap: 16 },
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
  date: { color: colors.text.muted, fontSize: typeScale.caption.size },
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
  card: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 16,
    gap: 12,
  },
  cardLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  prList: { gap: 10 },
  prRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  prName: { color: colors.text.primary, fontSize: typeScale.body.size, flex: 1 },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.elevated,
  },
  prText: { color: colors.text.primary, fontSize: typeScale.caption.size, fontVariant: ['tabular-nums'] },
  empty: { color: colors.text.muted, fontSize: typeScale.label.size },
  notes: {
    minHeight: 88,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.elevated,
    color: colors.text.primary,
    padding: 12,
    fontSize: typeScale.body.size,
    textAlignVertical: 'top',
  },
  footer: { paddingHorizontal: 16, paddingBottom: 16 },
});
