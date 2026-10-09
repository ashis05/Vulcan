import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SparkIcon } from '@/components/icons';
import { colors, fonts, radius, typeScale } from '@/theme';

import { PROGRAM_WINDOW_DAYS, type ProgramExercise, type ProgramSession } from './types';

function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

export function ProgramQuotaMeter({
  lastForged,
  today,
}: {
  lastForged: string | null;
  today: string;
}) {
  const elapsed = lastForged ? daysBetween(lastForged, today) : PROGRAM_WINDOW_DAYS;
  const used = elapsed < PROGRAM_WINDOW_DAYS;
  const remaining = Math.max(0, PROGRAM_WINDOW_DAYS - elapsed);

  return (
    <View style={styles.quota}>
      <View style={styles.quotaTop}>
        <Text style={styles.quotaLabel}>Program forgings</Text>
        <Text style={styles.quotaCount}>{used ? '0 of 1' : '1 of 1'}</Text>
      </View>
      <View style={styles.quotaTrack}>
        <View style={[styles.quotaFill, { width: used ? '0%' : '100%' }]} />
      </View>
      <Text style={styles.quotaFoot}>
        {used
          ? `The forge cools — next program in ${remaining} day${remaining === 1 ? '' : 's'}.`
          : 'One forging available. Resets 7 days after each use.'}
      </Text>
    </View>
  );
}

export function WeekTabs({
  weeks,
  selected,
  onSelect,
}: {
  weeks: number;
  selected: number;
  onSelect: (index: number) => void;
}) {
  return (
    <View style={styles.tabs}>
      {Array.from({ length: weeks }, (_, index) => {
        const active = index === selected;
        return (
          <Pressable
            key={index}
            onPress={() => onSelect(index)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>W{index + 1}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function exerciseDetail(exercise: ProgramExercise): string {
  const parts = [`${exercise.sets}×${exercise.reps}`];
  if (exercise.rpe != null) parts.push(`RPE ${exercise.rpe}`);
  if (exercise.rest_seconds != null) parts.push(`${exercise.rest_seconds}s`);
  return parts.join(' · ');
}

export function DayCard({ session }: { session: ProgramSession }) {
  return (
    <View style={styles.dayCard}>
      <View style={styles.dayHead}>
        <Text style={styles.dayName}>{session.day_label}</Text>
        <Text style={styles.dayMeta}>{session.exercises.length} ex</Text>
      </View>
      {session.exercises.map((exercise, index) => (
        <View
          key={`${exercise.name}-${index}`}
          style={[styles.exRow, index === session.exercises.length - 1 && styles.exLast]}
        >
          <Text style={styles.exName} numberOfLines={1}>
            {exercise.name}
          </Text>
          <Text style={styles.exDetail}>{exerciseDetail(exercise)}</Text>
        </View>
      ))}
    </View>
  );
}

export function ActiveProgramCard({
  name,
  dayCount,
  onPress,
}: {
  name: string;
  dayCount: number;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.activeCard, pressed && styles.pressed]}>
      <View style={styles.activeHead}>
        <SparkIcon size={14} color={colors.accent.ember500} filled />
        <Text style={styles.activeLabel}>Active program</Text>
        <Text style={styles.activeCta}>Review</Text>
      </View>
      <Text style={styles.activeName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.activeMeta}>
        {dayCount} day{dayCount === 1 ? '' : 's'} / week · tap to review or forge a new one
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeCard: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.ember500,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 16,
    gap: 6,
  },
  pressed: { opacity: 0.7 },
  activeHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeLabel: {
    flex: 1,
    color: colors.accent.ember500,
    fontSize: typeScale.caption.size,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  activeCta: { color: colors.accent.ember500, fontSize: typeScale.label.size, fontWeight: '700' },
  activeName: { color: colors.text.primary, fontSize: typeScale.h2.size, fontWeight: '700' },
  activeMeta: { color: colors.text.muted, fontSize: typeScale.caption.size },
  quota: { gap: 6 },
  quotaTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quotaLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  quotaCount: { color: colors.accent.ember500, fontSize: typeScale.label.size, fontWeight: '700' },
  quotaTrack: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.overlay,
    overflow: 'hidden',
  },
  quotaFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent.ember500 },
  quotaFoot: { color: colors.text.muted, fontSize: typeScale.caption.size },
  tabs: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tab: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { borderColor: colors.accent.ember500, backgroundColor: colors.accent.ember500 },
  tabText: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  tabTextActive: { color: colors.text.onAccent },
  dayCard: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dayName: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
  },
  dayMeta: { color: colors.text.muted, fontSize: typeScale.caption.size },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.hairline,
  },
  exLast: { borderBottomWidth: 0 },
  exName: { flex: 1, minWidth: 0, color: colors.text.primary, fontSize: typeScale.body.size },
  exDetail: {
    color: colors.text.secondary,
    fontSize: typeScale.caption.size,
    fontVariant: ['tabular-nums'],
  },
});
