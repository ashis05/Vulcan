import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ArrowLeftIcon, SparkIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { ActiveProgramCard, ProgramQuotaMeter } from '@/features/programs/components';
import { useActiveProgram, useGenerateProgram, useLastForgedDate } from '@/features/programs/hooks';
import { PROGRAM_WINDOW_DAYS } from '@/features/programs/types';
import { useProgressPhotos } from '@/features/progress/hooks';
import { AI_QUOTA_ENABLED } from '@/features/nutrition/ai';
import { ApiError } from '@/lib/api';
import { pacificDateString } from '@/lib/dates';
import { useProfile } from '@/lib/use-profile';
import { colors, fonts, radius, typeScale } from '@/theme';

const STATUS_LINES = [
  'Reading your history…',
  'Balancing volume…',
  'Tempering the split…',
  'Weighing RPE drift…',
  'Forging the program…',
];

const GOAL_LABELS: Record<string, string> = {
  cut: 'Cut',
  recomp: 'Recomp',
  maintain: 'Maintain',
  bulk: 'Bulk',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'barbell',
  dumbbell: 'dumbbells',
  machine: 'machines',
  cable: 'cables',
  bodyweight: 'bodyweight',
  other: 'other',
};

function ForgingOverlay() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const scale = useMemo(() => new Animated.Value(1), []);
  const glow = useMemo(() => new Animated.Value(0.25), []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLineIndex((index) => Math.min(index + 1, STATUS_LINES.length - 1));
    }, 850);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.12,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glow, { toValue: 0.7, duration: 800, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.25, duration: 800, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, scale, glow]);

  return (
    <View style={styles.overlay}>
      <View style={styles.forgeMark}>
        <Animated.View style={[styles.forgePulse, { opacity: glow, transform: [{ scale }] }]} />
        <SparkIcon size={96} color={colors.accent.ember500} filled />
      </View>
      <Text style={styles.statusLine}>{STATUS_LINES[lineIndex]}</Text>
      <Text style={styles.statusCaption}>usually 3–15 seconds</Text>
    </View>
  );
}

export default function GenerateProgramScreen() {
  const router = useRouter();
  const profile = useProfile();
  const lastForged = useLastForgedDate();
  const active = useActiveProgram();
  const photos = useProgressPhotos();
  const generate = useGenerateProgram();
  const [focus, setFocus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const latestAnalysis = (photos.data ?? []).find((p) => p.analysis)?.analysis ?? null;
  const physiqueFocus = latestAnalysis?.focus_areas ?? [];
  // The physique analysis (Phase 6) seeds the focus field until the user edits it.
  const focusText = focus || physiqueFocus.join(', ');

  const today = pacificDateString();
  const elapsedUsed = (() => {
    if (!AI_QUOTA_ENABLED) return false;
    const last = lastForged.data;
    if (!last) return false;
    const days = Math.round(
      (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${last}T00:00:00Z`)) / 86_400_000,
    );
    return days < PROGRAM_WINDOW_DAYS;
  })();

  const onForge = () => {
    setError(null);
    generate.mutate(
      {
        notes: focusText.trim() ? focusText.trim() : undefined,
        focusAreas: physiqueFocus,
      },
      {
        onSuccess: () => router.replace('/program/review'),
        onError: (err) => {
          if (err instanceof ApiError && err.status === 429) {
            setError('You’ve already forged a program recently. The forge cools for 7 days.');
          } else {
            setError('The forge sputtered. Please try again.');
          }
        },
      },
    );
  };

  const p = profile.data;
  const weightLabel = p?.weightKg ? `${p.weightKg.toFixed(1)} kg · ${p.paceKgWk} kg/wk` : null;
  const goalLabel = p?.goal ? GOAL_LABELS[p.goal] : null;
  const equipment = (p?.equipment ?? []).map((e) => EQUIPMENT_LABELS[e] ?? e);

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.navTitle}>Forge</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        {active.data ? (
          <ActiveProgramCard
            name={active.data.program.name}
            dayCount={active.data.program.weeks[0]?.sessions.length ?? 0}
            onPress={() => router.push('/program/review')}
          />
        ) : null}

        <Card>
          <View style={styles.introHead}>
            <Text style={styles.introTitle}>Forge a program</Text>
            <View style={styles.aiBadge}>
              <SparkIcon size={12} color={colors.accent.ember500} filled />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>
          <Text style={styles.introBody}>
            VULCAN builds your split from every set you’ve logged — volume, RPE drift, recovery,
            and your goal. Nothing is guessed.
          </Text>
        </Card>

        <Card>
          <Text style={styles.overline}>Current snapshot</Text>
          {weightLabel || goalLabel ? (
            <View style={styles.snapRow}>
              {p?.weightKg ? (
                <Text style={styles.snapNumber}>{p.weightKg.toFixed(1)}</Text>
              ) : null}
              <Text style={styles.snapText}>
                {[weightLabel ? 'kg' : null, goalLabel].filter(Boolean).join(' · ')}
              </Text>
            </View>
          ) : null}
          <View style={styles.snapRow}>
            <Text style={styles.snapNumber}>{p?.daysPerWeek ?? '—'}</Text>
            <Text style={styles.snapText}>
              sessions / week · {p?.sessionLenMin ?? '—'} min
              {equipment.length ? ` · ${equipment.join(', ')}` : ''}
            </Text>
          </View>
          <View style={styles.snapRow}>
            <Text style={styles.snapText}>
              {p?.experience ? `${p.experience} experience` : 'Add your experience in profile'}
            </Text>
          </View>
        </Card>

        {latestAnalysis ? (
          <Card style={styles.physiqueCard}>
            <View style={styles.physiqueHead}>
              <SparkIcon size={13} color={colors.accent.ember500} filled />
              <Text style={styles.physiqueLabel}>From your physique check-in</Text>
            </View>
            <Text style={styles.physiqueBody} numberOfLines={3}>
              {latestAnalysis.summary}
            </Text>
          </Card>
        ) : null}

        <TextField
          label="Training request (optional)"
          value={focusText}
          onChangeText={setFocus}
          placeholder="e.g. focus on chest, more back volume, 4 short sessions"
          hint="Your physique focus areas are prefilled — edit anything you want changed."
          multiline
        />

        {AI_QUOTA_ENABLED ? (
          <ProgramQuotaMeter lastForged={lastForged.data ?? null} today={today} />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label={generate.isPending ? 'Forging…' : 'Forge my program'}
          onPress={onForge}
          disabled={generate.isPending || elapsedUsed}
        />
        {elapsedUsed ? (
          <Text style={styles.disclaimer}>
            You’ve used this week’s forging. It resets 7 days after your last program.
          </Text>
        ) : null}

        <Text style={styles.disclaimer}>
          AI-generated training guidance, not medical advice.
        </Text>
      </ScrollView>

      {generate.isPending ? <ForgingOverlay /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, minWidth: 72 },
  backLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  navTitle: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
  },
  navSpacer: { minWidth: 72 },
  body: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  introHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  introTitle: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    lineHeight: typeScale.title.lineHeight,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.accent.ember500,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiBadgeText: { color: colors.accent.ember500, fontSize: typeScale.caption.size, fontWeight: '700' },
  introBody: {
    marginTop: 8,
    color: colors.text.secondary,
    fontSize: typeScale.body.size,
    lineHeight: typeScale.body.lineHeight,
  },
  overline: {
    color: colors.text.secondary,
    fontSize: typeScale.label.size,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  snapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  snapNumber: {
    color: colors.accent.ember500,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
    fontVariant: ['tabular-nums'],
  },
  snapText: { flex: 1, color: colors.text.secondary, fontSize: typeScale.body.size },
  physiqueCard: { borderLeftWidth: 3, borderLeftColor: colors.accent.ember500, gap: 6 },
  physiqueHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  physiqueLabel: {
    color: colors.accent.ember500,
    fontSize: typeScale.caption.size,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  physiqueBody: {
    color: colors.text.secondary,
    fontSize: typeScale.body.size,
    lineHeight: typeScale.body.lineHeight,
  },
  error: { color: colors.semantic.danger, fontSize: typeScale.label.size },
  disclaimer: { color: colors.text.muted, fontSize: typeScale.caption.size, lineHeight: 16 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  forgeMark: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  forgePulse: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.glow,
  },
  statusLine: { color: colors.accent.ember400, fontSize: typeScale.label.size, fontWeight: '600' },
  statusCaption: { color: colors.text.muted, fontSize: typeScale.caption.size },
});
