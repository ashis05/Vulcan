import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { DEFAULT_PACE_KG_WK, computeTargets, paceToKcalDelta } from '@/engine/targets';
import type { Profile } from '@/engine/types';
import { ageFromBirthDate, cmToFtIn, formatFtIn, kgToLb } from '@/engine/units';
import { Chip, PaceSlider, Segmented, Stepper } from '@/features/onboarding/controls';
import {
  ACTIVITY_OPTIONS,
  EQUIPMENT_OPTIONS,
  EXP_OPTIONS,
  GOAL_OPTIONS,
  INJURY_OPTIONS,
} from '@/features/onboarding/steps';
import { saveProfileAndFirstMetric } from '@/lib/profile';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/lib/use-auth';
import { colors, fonts, radius, typeScale } from '@/theme';

const HEIGHT_MIN = 140;
const HEIGHT_MAX = 220;
const WEIGHT_MIN = 40;
const WEIGHT_MAX = 250;

type Draft = Omit<Profile, 'onboardingCompleted'>;

export function EditProfileForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const { user } = useAuth();
  const [draft, setDraft] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);

  const patch = (next: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...next }));

  const [by, bm, bd] = draft.birthDate.split('-').map(Number);
  const updateBirth = (part: 'y' | 'm' | 'd', value: number) => {
    const next = { y: by, m: bm, d: bd };
    next[part] = value;
    const pad = (n: number) => `${n}`.padStart(2, '0');
    patch({ birthDate: `${next.y}-${pad(next.m)}-${pad(next.d)}` });
  };

  const heightStep = draft.heightUnit === 'cm' ? 1 : 2.54;
  const heightDisplay =
    draft.heightUnit === 'cm' ? `${Math.round(draft.heightCm)}` : formatFtIn(cmToFtIn(draft.heightCm));
  const weightStepKg = draft.weightUnit === 'kg' ? 0.5 : 0.4536;
  const weightDisplay =
    draft.weightUnit === 'kg' ? `${draft.weightKg}` : `${Math.round(kgToLb(draft.weightKg))}`;

  const toggleEquipment = (label: string) =>
    patch({
      equipment: draft.equipment.includes(label)
        ? draft.equipment.filter((e) => e !== label)
        : [...draft.equipment, label],
    });

  const toggleInjury = (label: string) =>
    patch({
      injuries: draft.injuries.includes(label)
        ? draft.injuries.filter((e) => e !== label)
        : [...draft.injuries, label],
    });

  const preview = useMemo(() => {
    if (!draft.sex || !draft.goal) return null;
    return computeTargets({
      sex: draft.sex,
      weightKg: draft.weightKg,
      heightCm: draft.heightCm,
      ageYears: ageFromBirthDate(draft.birthDate),
      activityLevel: draft.activityLevel,
      goal: draft.goal,
      paceKgWk: draft.paceKgWk,
    });
  }, [
    draft.sex,
    draft.weightKg,
    draft.heightCm,
    draft.birthDate,
    draft.activityLevel,
    draft.goal,
    draft.paceKgWk,
  ]);

  const effectivePace = preview?.effectivePaceKgWk ?? draft.paceKgWk;
  const delta = preview?.paceDeltaKcal ?? paceToKcalDelta(draft.paceKgWk);
  const deltaLabel = `${delta >= 0 ? '+' : '−'}${Math.abs(delta)} kcal`;
  const capped = Math.abs(effectivePace - draft.paceKgWk) > 0.001;

  const valid =
    draft.displayName.trim().length > 0 &&
    draft.sex !== null &&
    draft.goal !== null &&
    draft.experience !== null &&
    draft.equipment.length > 0;

  const onSave = async () => {
    if (!user || saving || !valid) return;
    setSaving(true);
    try {
      const next: Profile = { ...draft, onboardingCompleted: true };
      await saveProfileAndFirstMetric(user.id, next);
      queryClient.setQueryData(['profile', user.id], next);
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>You</Text>
          <TextField
            label="Name"
            placeholder="Marcus"
            autoComplete="name"
            value={draft.displayName}
            onChangeText={(displayName) => patch({ displayName })}
          />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Sex</Text>
            <Segmented
              options={[
                { label: 'Man', value: 'male' },
                { label: 'Woman', value: 'female' },
              ]}
              value={draft.sex ?? 'male'}
              onChange={(sex) => patch({ sex })}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Date of birth</Text>
            <Stepper
              label="Day"
              value={`${bd}`}
              onDecrement={() => updateBirth('d', Math.max(1, bd - 1))}
              onIncrement={() => updateBirth('d', Math.min(31, bd + 1))}
            />
            <Stepper
              label="Month"
              value={`${bm}`}
              onDecrement={() => updateBirth('m', Math.max(1, bm - 1))}
              onIncrement={() => updateBirth('m', Math.min(12, bm + 1))}
            />
            <Stepper
              label="Year"
              value={`${by}`}
              onDecrement={() => updateBirth('y', Math.max(1950, by - 1))}
              onIncrement={() => updateBirth('y', Math.min(2010, by + 1))}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Body</Text>
          <View style={styles.field}>
            <Stepper
              label="Height"
              value={heightDisplay}
              onDecrement={() => patch({ heightCm: Math.max(HEIGHT_MIN, draft.heightCm - heightStep) })}
              onIncrement={() => patch({ heightCm: Math.min(HEIGHT_MAX, draft.heightCm + heightStep) })}
            />
            <Segmented
              options={[
                { label: 'cm', value: 'cm' },
                { label: 'ft / in', value: 'ft' },
              ]}
              value={draft.heightUnit}
              onChange={(heightUnit) => patch({ heightUnit })}
            />
          </View>
          <View style={styles.field}>
            <Stepper
              label="Weight"
              value={weightDisplay}
              onDecrement={() => patch({ weightKg: Math.max(WEIGHT_MIN, draft.weightKg - weightStepKg) })}
              onIncrement={() => patch({ weightKg: Math.min(WEIGHT_MAX, draft.weightKg + weightStepKg) })}
            />
            <Segmented
              options={[
                { label: 'kg', value: 'kg' },
                { label: 'lb', value: 'lb' },
              ]}
              value={draft.weightUnit}
              onChange={(weightUnit) => patch({ weightUnit })}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Goal</Text>
          <View style={styles.chipRow}>
            {GOAL_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                selected={draft.goal === o.value}
                onPress={() => patch({ goal: o.value, paceKgWk: DEFAULT_PACE_KG_WK[o.value] })}
              />
            ))}
          </View>
          <View style={styles.field}>
            <View style={styles.spreadRow}>
              <Text style={styles.fieldLabel}>Pace</Text>
              <Text style={styles.rateValue}>
                {effectivePace.toFixed(2)} kg/wk · {deltaLabel}
              </Text>
            </View>
            <PaceSlider value={draft.paceKgWk} onChange={(paceKgWk) => patch({ paceKgWk })} />
            {capped ? (
              <Text style={styles.hint}>Capped at a safe rate for your bodyweight.</Text>
            ) : null}
          </View>
          {preview ? (
            <View style={styles.preview}>
              <Text style={styles.previewKcal}>≈ {preview.targetKcal.toLocaleString()} kcal</Text>
              <Text style={styles.previewSub}>
                P · {preview.proteinG}g   C · {preview.carbsG}g   F · {preview.fatG}g
              </Text>
            </View>
          ) : null}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Training</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Daily activity</Text>
            <View style={styles.chipRow}>
              {ACTIVITY_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={draft.activityLevel === o.value}
                  onPress={() => patch({ activityLevel: o.value })}
                />
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Experience</Text>
            <View style={styles.chipRow}>
              {EXP_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={draft.experience === o.value}
                  onPress={() => patch({ experience: o.value })}
                />
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Stepper
              label="Sessions / week"
              value={`${draft.daysPerWeek}`}
              onDecrement={() => patch({ daysPerWeek: Math.max(3, draft.daysPerWeek - 1) })}
              onIncrement={() => patch({ daysPerWeek: Math.min(6, draft.daysPerWeek + 1) })}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Session length</Text>
            <View style={styles.chipRow}>
              {[45, 60, 90].map((len) => (
                <Chip
                  key={len}
                  label={`${len} min`}
                  selected={draft.sessionLenMin === len}
                  onPress={() => patch({ sessionLenMin: len })}
                />
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Equipment</Text>
            <View style={styles.chipRow}>
              {EQUIPMENT_OPTIONS.map((label) => (
                <Chip
                  key={label}
                  label={label}
                  selected={draft.equipment.includes(label)}
                  onPress={() => toggleEquipment(label)}
                />
              ))}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Limitations</Text>
            <View style={styles.chipRow}>
              {INJURY_OPTIONS.map((label) => (
                <Chip
                  key={label}
                  label={label}
                  selected={draft.injuries.includes(label)}
                  onPress={() => toggleInjury(label)}
                />
              ))}
            </View>
          </View>
          <TextField
            label="Anything else (optional)"
            placeholder="e.g. recovering from a sprained ankle"
            multiline
            style={styles.textarea}
            value={draft.injuriesNote}
            onChangeText={(injuriesNote) => patch({ injuriesNote })}
          />
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={saving ? 'Saving…' : 'Save changes'}
          onPress={onSave}
          disabled={!valid || saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  card: { gap: 16 },
  cardTitle: {
    color: colors.text.secondary,
    fontSize: typeScale.label.size,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  field: { gap: 10 },
  fieldLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  spreadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rateValue: { color: colors.accent.ember500, fontSize: typeScale.label.size, fontWeight: '600' },
  hint: { color: colors.text.muted, fontSize: typeScale.caption.size },
  preview: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
    padding: 14,
    gap: 2,
  },
  previewKcal: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
  },
  previewSub: { color: colors.text.secondary, fontSize: typeScale.caption.size },
  textarea: { height: 96, textAlignVertical: 'top', paddingTop: 12 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.hairline,
  },
});
