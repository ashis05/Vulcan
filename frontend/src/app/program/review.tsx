import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AnvilIcon, ArrowLeftIcon, SparkIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { CoachNote } from '@/components/ui/CoachNote';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { DayCard, WeekTabs } from '@/features/programs/components';
import { useActiveProgram, useRenameProgram } from '@/features/programs/hooks';
import type { ActiveProgram } from '@/features/programs/types';
import { colors, fonts, radius, typeScale } from '@/theme';

function ProgramReview({ record }: { record: ActiveProgram }) {
  const router = useRouter();
  const rename = useRenameProgram();
  const program = record.program;
  const [name, setName] = useState(program.name);
  const [week, setWeek] = useState(0);

  const commitName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(program.name);
    } else if (trimmed !== program.name) {
      rename.mutate({ id: record.id, payload: program, name: trimmed });
    }
  };

  const onRegenerate = () => {
    Alert.alert(
      'Forge again?',
      'Regenerating uses a new forging and archives the current program. This review is discarded.',
      [
        { text: 'Keep this', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: () => router.replace('/program/generate'),
        },
      ],
    );
  };

  const sessions = program.weeks[week]?.sessions ?? [];

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.content}>
      <TextField
        label="Program name"
        value={name}
        onChangeText={setName}
        onEndEditing={commitName}
        returnKeyType="done"
      />

      <WeekTabs weeks={program.weeks.length} selected={week} onSelect={setWeek} />

      <View style={styles.days}>
        {sessions.map((session, index) => (
          <DayCard key={`${session.day_label}-${index}`} session={session} />
        ))}
      </View>

      {program.progression_notes ? (
        <View style={styles.progression}>
          <Text style={styles.overline}>Progression</Text>
          <Text style={styles.progressionBody}>{program.progression_notes}</Text>
        </View>
      ) : null}

      <CoachNote
        title="Why this split"
        body={program.rationale}
        foot="AI-generated training guidance, not medical advice"
      />

      <View style={styles.actions}>
        <Button label="Regenerate" variant="ghost" fullWidth={false} onPress={onRegenerate} />
        <View style={styles.applyWrap}>
          <Button label="Apply program" onPress={() => router.replace('/train')} />
        </View>
      </View>
    </ScrollView>
  );
}

export default function ProgramReviewScreen() {
  const router = useRouter();
  const active = useActiveProgram();
  const record = active.data;

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <View style={styles.aiBadge}>
          <SparkIcon size={12} color={colors.accent.ember500} filled />
          <Text style={styles.aiBadgeText}>AI program</Text>
        </View>
      </View>

      {active.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.ember500} />
        </View>
      ) : !record ? (
        <View style={styles.center}>
          <AnvilIcon size={30} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No program yet</Text>
          <Text style={styles.emptyBody}>Forge one from your logged training.</Text>
          <Button label="Forge a program" onPress={() => router.replace('/program/generate')} />
        </View>
      ) : (
        <ProgramReview key={record.id} record={record} />
      )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyTitle: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
  },
  emptyBody: { color: colors.text.secondary, fontSize: typeScale.body.size, textAlign: 'center' },
  body: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  days: { gap: 14 },
  progression: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
    padding: 16,
    gap: 6,
  },
  overline: {
    color: colors.text.secondary,
    fontSize: typeScale.label.size,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  progressionBody: {
    color: colors.text.secondary,
    fontSize: typeScale.body.size,
    lineHeight: typeScale.body.lineHeight,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  applyWrap: { flex: 1 },
});
