import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AnvilIcon, ChartIcon, FlameIcon, SparkIcon } from '@/components/icons';
import { TextField } from '@/components/ui/TextField';
import { ageFromBirthDate, cmToFtIn, formatFtIn, kgToLb } from '@/engine/units';
import { DEFAULT_PACE_KG_WK, computeTargets, paceToKcalDelta } from '@/engine/targets';
import type { ActivityLevel, Experience, Goal, Sex } from '@/engine/types';
import { colors, fonts, radius, typeScale } from '@/theme';

import { Chip, OptionCard, PaceSlider, Segmented, Stepper } from './controls';
import { useWizardStore } from './wizard-store';

const HEIGHT_MIN = 140;
const HEIGHT_MAX = 220;
const WEIGHT_MIN = 40;
const WEIGHT_MAX = 250;

function StepShell({
  kick,
  title,
  subtitle,
  children,
}: {
  kick: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.step}>
      <Text style={styles.kick}>{kick}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.stepBody}>{children}</View>
    </View>
  );
}

export function WelcomeStep() {
  return (
    <StepShell kick="Welcome" title="Answer a few questions. The forge does the rest.">
      <Text style={styles.subtitle}>
        Your training split, meals, and targets come out of these answers — not the other way around.
      </Text>
    </StepShell>
  );
}

export function NameStep() {
  const displayName = useWizardStore((s) => s.displayName);
  const set = useWizardStore((s) => s.set);
  return (
    <StepShell kick="You" title="What do we call you?">
      <TextField
        label="Name"
        placeholder="Marcus"
        autoFocus
        autoComplete="name"
        value={displayName}
        onChangeText={(v) => set({ displayName: v })}
      />
    </StepShell>
  );
}

export function SexStep() {
  const sex = useWizardStore((s) => s.sex);
  const set = useWizardStore((s) => s.set);
  const options: { value: Sex; label: string }[] = [
    { value: 'male', label: 'Man' },
    { value: 'female', label: 'Woman' },
  ];
  return (
    <StepShell kick="You" title="Your sex at birth">
      <View style={styles.stack}>
        {options.map((o) => (
          <OptionCard
            key={o.value}
            title={o.label}
            selected={sex === o.value}
            onPress={() => set({ sex: o.value })}
          />
        ))}
      </View>
    </StepShell>
  );
}

export function BirthDateStep() {
  const birthDate = useWizardStore((s) => s.birthDate);
  const set = useWizardStore((s) => s.set);
  const [y, m, d] = birthDate.split('-').map(Number);

  const update = (part: 'y' | 'm' | 'd', value: number) => {
    const next = { y, m, d };
    next[part] = value;
    const pad = (n: number) => `${n}`.padStart(2, '0');
    set({ birthDate: `${next.y}-${pad(next.m)}-${pad(next.d)}` });
  };

  return (
    <StepShell kick="You" title="When were you hammered out?">
      <Stepper label="Day" value={`${d}`} onDecrement={() => update('d', Math.max(1, d - 1))} onIncrement={() => update('d', Math.min(31, d + 1))} />
      <Stepper label="Month" value={`${m}`} onDecrement={() => update('m', Math.max(1, m - 1))} onIncrement={() => update('m', Math.min(12, m + 1))} />
      <Stepper label="Year" value={`${y}`} onDecrement={() => update('y', Math.max(1950, y - 1))} onIncrement={() => update('y', Math.min(2010, y + 1))} />
    </StepShell>
  );
}

export function HeightStep() {
  const heightCm = useWizardStore((s) => s.heightCm);
  const heightUnit = useWizardStore((s) => s.heightUnit);
  const set = useWizardStore((s) => s.set);

  const step = heightUnit === 'cm' ? 1 : 2.54;
  const display = heightUnit === 'cm' ? `${Math.round(heightCm)}` : formatFtIn(cmToFtIn(heightCm));
  const unitLabel = heightUnit === 'cm' ? 'centimeters' : 'feet · inches';

  return (
    <StepShell kick="Build" title="How tall are you?">
      <View style={styles.valueRow}>
        <Text style={styles.valueNum}>{display}</Text>
        <Text style={styles.unitSub}>{unitLabel}</Text>
      </View>
      <Stepper
        value={display}
        valueStyle={styles.valueNum}
        onDecrement={() => set({ heightCm: Math.max(HEIGHT_MIN, heightCm - step) })}
        onIncrement={() => set({ heightCm: Math.min(HEIGHT_MAX, heightCm + step) })}
      />
      <Segmented
        options={[
          { label: 'cm', value: 'cm' },
          { label: 'ft / in', value: 'ft' },
        ]}
        value={heightUnit}
        onChange={(heightUnit) => set({ heightUnit })}
      />
    </StepShell>
  );
}

export function WeightStep() {
  const weightKg = useWizardStore((s) => s.weightKg);
  const weightUnit = useWizardStore((s) => s.weightUnit);
  const set = useWizardStore((s) => s.set);

  const stepKg = weightUnit === 'kg' ? 0.5 : 0.4536;
  const display = weightUnit === 'kg' ? `${weightKg}` : `${Math.round(kgToLb(weightKg))}`;
  const unitLabel = weightUnit === 'kg' ? 'kilograms' : 'pounds';

  return (
    <StepShell kick="Build" title="And your starting weight?">
      <View style={styles.valueRow}>
        <Text style={styles.valueNum}>{display}</Text>
        <Text style={styles.unitSub}>{unitLabel}</Text>
      </View>
      <Stepper
        value={display}
        valueStyle={styles.valueNum}
        onDecrement={() => set({ weightKg: Math.max(WEIGHT_MIN, weightKg - stepKg) })}
        onIncrement={() => set({ weightKg: Math.min(WEIGHT_MAX, weightKg + stepKg) })}
      />
      <Segmented
        options={[
          { label: 'kg', value: 'kg' },
          { label: 'lb', value: 'lb' },
        ]}
        value={weightUnit}
        onChange={(weightUnit) => set({ weightUnit })}
      />
    </StepShell>
  );
}

export const GOAL_OPTIONS: { value: Goal; label: string; subtitle: string; icon: ReactNode }[] = [
  { value: 'cut', label: 'Cut', subtitle: 'Drop fat, keep the muscle.', icon: <SparkIcon size={18} color={colors.accent.ember500} filled /> },
  { value: 'recomp', label: 'Recomp', subtitle: 'Build and burn at once.', icon: <FlameIcon size={18} color={colors.accent.ember500} /> },
  { value: 'maintain', label: 'Maintain', subtitle: 'Hold. Grind. Stay sharp.', icon: <ChartIcon size={18} color={colors.accent.ember500} /> },
  { value: 'bulk', label: 'Bulk', subtitle: 'Add mass to the stock.', icon: <AnvilIcon size={18} color={colors.accent.ember500} /> },
];

export function GoalStep() {
  const goal = useWizardStore((s) => s.goal);
  const set = useWizardStore((s) => s.set);
  return (
    <StepShell kick="Direction" title="What is your goal?">
      <View style={styles.stack}>
        {GOAL_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            title={o.label}
            subtitle={o.subtitle}
            leading={o.icon}
            selected={goal === o.value}
            onPress={() => set({ goal: o.value, paceKgWk: DEFAULT_PACE_KG_WK[o.value] })}
          />
        ))}
      </View>
    </StepShell>
  );
}

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; subtitle: string }[] = [
  { value: 'sedentary', label: 'Sedentary', subtitle: 'Desk job, little daily movement' },
  { value: 'light', label: 'Light', subtitle: 'Some walking or 1–2 light workouts a week' },
  { value: 'moderate', label: 'Moderate', subtitle: 'Active job, or 3–5 workouts a week' },
  { value: 'very_active', label: 'Very active', subtitle: 'Physical job, or 6–7 workouts a week' },
];

export function ActivityStep() {
  const activityLevel = useWizardStore((s) => s.activityLevel);
  const set = useWizardStore((s) => s.set);
  return (
    <StepShell
      kick="Direction"
      title="How active is your day-to-day?"
      subtitle="Separate from your workouts — it sets your base burn."
    >
      <View style={styles.stack}>
        {ACTIVITY_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            title={o.label}
            subtitle={o.subtitle}
            selected={activityLevel === o.value}
            onPress={() => set({ activityLevel: o.value })}
          />
        ))}
      </View>
    </StepShell>
  );
}

export function PaceStep() {
  const paceKgWk = useWizardStore((s) => s.paceKgWk);
  const set = useWizardStore((s) => s.set);
  const fields = useWizardStore();

  const preview = useMemo(() => {
    if (!fields.sex || !fields.goal) return null;
    return computeTargets({
      sex: fields.sex,
      weightKg: fields.weightKg,
      heightCm: fields.heightCm,
      ageYears: ageFromBirthDate(fields.birthDate),
      activityLevel: fields.activityLevel,
      goal: fields.goal,
      paceKgWk: fields.paceKgWk,
    });
  }, [fields.sex, fields.weightKg, fields.heightCm, fields.birthDate, fields.activityLevel, fields.goal, fields.paceKgWk]);

  const effectivePace = preview?.effectivePaceKgWk ?? paceKgWk;
  const delta = preview?.paceDeltaKcal ?? paceToKcalDelta(paceKgWk);
  const deltaLabel = `${delta >= 0 ? '+' : '−'}${Math.abs(delta)} kcal daily`;
  const capped = Math.abs(effectivePace - paceKgWk) > 0.001;

  return (
    <StepShell kick="Direction" title="How fast?" subtitle="Pick your weekly rate. Targets update live.">
      <PaceSlider value={paceKgWk} onChange={(paceKgWk) => set({ paceKgWk })} />
      <View style={styles.spreadRow}>
        <Text style={styles.rateLabel}>Rate</Text>
        <Text style={styles.rateValue}>{effectivePace.toFixed(2)} kg/wk · {deltaLabel}</Text>
      </View>
      {capped ? <Text style={styles.hint}>Capped at a safe rate for your bodyweight.</Text> : null}
      {preview ? (
        <View style={styles.previewCard}>
          <Text style={styles.previewKcal}>≈ {preview.targetKcal.toLocaleString()} kcal</Text>
          <Text style={styles.previewSub}>P · {preview.proteinG}g   C · {preview.carbsG}g   F · {preview.fatG}g</Text>
        </View>
      ) : null}
    </StepShell>
  );
}

export const EXP_OPTIONS: { value: Experience; label: string; subtitle: string }[] = [
  { value: 'beginner', label: 'Beginner', subtitle: 'Under 1 year of lifting' },
  { value: 'intermediate', label: 'Intermediate', subtitle: '1 to 3 years' },
  { value: 'advanced', label: 'Advanced', subtitle: '3 years and up' },
];

export function ExperienceStep() {
  const experience = useWizardStore((s) => s.experience);
  const set = useWizardStore((s) => s.set);
  return (
    <StepShell kick="Training" title="How long at the anvil?">
      <View style={styles.stack}>
        {EXP_OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            title={o.label}
            subtitle={o.subtitle}
            selected={experience === o.value}
            onPress={() => set({ experience: o.value })}
          />
        ))}
      </View>
    </StepShell>
  );
}

export function WeekStep() {
  const daysPerWeek = useWizardStore((s) => s.daysPerWeek);
  const sessionLenMin = useWizardStore((s) => s.sessionLenMin);
  const set = useWizardStore((s) => s.set);
  return (
    <StepShell kick="Training" title="Your week">
      <Stepper
        value={`${daysPerWeek}`}
        label="Sessions"
        onDecrement={() => set({ daysPerWeek: Math.max(3, daysPerWeek - 1) })}
        onIncrement={() => set({ daysPerWeek: Math.min(6, daysPerWeek + 1) })}
      />
      <Text style={styles.hint}>sessions per week</Text>
      <View style={styles.chipRow}>
        {[45, 60, 90].map((len) => (
          <Chip
            key={len}
            label={`${len} min`}
            selected={sessionLenMin === len}
            onPress={() => set({ sessionLenMin: len })}
          />
        ))}
      </View>
    </StepShell>
  );
}

export const EQUIPMENT_OPTIONS = ['Full gym', 'Dumbbells', 'Barbell + rack', 'Machines', 'Bands', 'Bodyweight'];

export function EquipmentStep() {
  const equipment = useWizardStore((s) => s.equipment);
  const set = useWizardStore((s) => s.set);
  const toggle = (label: string) => {
    set({ equipment: equipment.includes(label) ? equipment.filter((e) => e !== label) : [...equipment, label] });
  };
  return (
    <StepShell kick="Training" title="What do you have?">
      <View style={styles.chipRow}>
        {EQUIPMENT_OPTIONS.map((label) => (
          <Chip key={label} label={label} selected={equipment.includes(label)} onPress={() => toggle(label)} />
        ))}
      </View>
      <Text style={styles.hint}>Pick at least one.</Text>
    </StepShell>
  );
}

export const INJURY_OPTIONS = ['Lower back', 'Shoulder', 'Knee', 'Wrist'];

export function LimitationsStep() {
  const injuries = useWizardStore((s) => s.injuries);
  const injuriesNote = useWizardStore((s) => s.injuriesNote);
  const set = useWizardStore((s) => s.set);
  const toggle = (label: string) => {
    set({ injuries: injuries.includes(label) ? injuries.filter((e) => e !== label) : [...injuries, label] });
  };
  return (
    <StepShell kick="Training" title="Any limitations we should work around?">
      <View style={styles.chipRow}>
        {INJURY_OPTIONS.map((label) => (
          <Chip key={label} label={label} selected={injuries.includes(label)} onPress={() => toggle(label)} />
        ))}
      </View>
      <TextField
        label="Anything else (optional)"
        placeholder="e.g. recovering from a sprained ankle"
        multiline
        style={styles.textarea}
        value={injuriesNote}
        onChangeText={(injuriesNote) => set({ injuriesNote })}
      />
    </StepShell>
  );
}

export function RevealStep() {
  const fields = useWizardStore();
  const revealed = useWizardStore((s) => s.revealed);
  const setRevealed = useWizardStore((s) => s.setRevealed);
  const [reduceMotion, setReduceMotion] = useState(false);

  const targets = useMemo(
    () =>
      computeTargets({
        sex: fields.sex ?? 'male',
        weightKg: fields.weightKg,
        heightCm: fields.heightCm,
        ageYears: ageFromBirthDate(fields.birthDate),
        activityLevel: fields.activityLevel,
        goal: fields.goal ?? 'cut',
        paceKgWk: fields.paceKgWk,
      }),
    [fields],
  );

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
      if (enabled) setRevealed(true);
    });
  }, [setRevealed]);

  useEffect(() => {
    if (reduceMotion) return;
    const t = setTimeout(() => setRevealed(true), 900);
    return () => clearTimeout(t);
  }, [reduceMotion, setRevealed]);

  const proteinPct = Math.round((targets.proteinG * 4 * 100) / targets.targetKcal);
  const fatPct = Math.round((targets.fatG * 9 * 100) / targets.targetKcal);
  const carbsPct = Math.max(0, 100 - proteinPct - fatPct);

  return (
    <StepShell kick="The reveal" title="Forging your numbers…">
      <View style={styles.sealWrap}>
        <View style={styles.sealGlow} />
        <SparkIcon size={110} color={colors.accent.ember500} filled />
      </View>
      {revealed ? (
        <View style={styles.targetsCard}>
          <View style={styles.spreadRow}>
            <Text style={styles.rateLabel}>Daily targets</Text>
            <View style={styles.goalChip}>
              <Text style={styles.goalChipText}>{fields.goal ?? 'Cut'}</Text>
            </View>
          </View>
          <View style={styles.kcalBlock}>
            <Text style={styles.kcalNum}>{targets.targetKcal.toLocaleString()}</Text>
            <Text style={styles.unitSub}>kcal / day</Text>
          </View>
          <View style={styles.macroBar}>
            <View style={[styles.macroSeg, { width: `${proteinPct}%`, backgroundColor: colors.macros.protein }]} />
            <View style={[styles.macroSeg, { width: `${carbsPct}%`, backgroundColor: colors.macros.carbs }]} />
            <View style={[styles.macroSeg, { width: `${fatPct}%`, backgroundColor: colors.macros.fat }]} />
          </View>
          <View style={styles.targetsGrid}>
            <View style={styles.targetCell}>
              <Text style={styles.targetNum}>{targets.proteinG}</Text>
              <Text style={styles.targetLabel}>protein g</Text>
            </View>
            <View style={styles.targetCell}>
              <Text style={styles.targetNum}>{targets.carbsG}</Text>
              <Text style={styles.targetLabel}>carbs g</Text>
            </View>
            <View style={styles.targetCell}>
              <Text style={styles.targetNum}>{targets.fatG}</Text>
              <Text style={styles.targetLabel}>fat g</Text>
            </View>
          </View>
        </View>
      ) : null}
    </StepShell>
  );
}

const styles = StyleSheet.create({
  step: { gap: 8, width: '100%', maxWidth: 400, alignSelf: 'center' },
  kick: {
    color: colors.accent.ember500,
    fontSize: typeScale.caption.size,
    fontWeight: '700',
    letterSpacing: 0.08,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    lineHeight: typeScale.title.lineHeight,
    letterSpacing: -0.01,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typeScale.body.size,
    lineHeight: typeScale.body.lineHeight,
  },
  stepBody: { marginTop: 12, gap: 20 },
  stack: { gap: 10 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  valueNum: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.display.size,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.02,
  },
  unitSub: { color: colors.text.secondary, fontSize: typeScale.caption.size },
  spreadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rateLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '500' },
  rateValue: { color: colors.accent.ember500, fontSize: typeScale.label.size, fontWeight: '600' },
  hint: { color: colors.text.muted, fontSize: typeScale.caption.size },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  textarea: { height: 96, textAlignVertical: 'top', paddingTop: 12 },
  previewCard: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 16,
    gap: 2,
  },
  previewKcal: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
  },
  previewSub: { color: colors.text.secondary, fontSize: typeScale.caption.size },
  sealWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
  sealGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.glow,
    opacity: 0.35,
  },
  targetsCard: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderRadius: radius.md,
    backgroundColor: colors.bg.card,
    padding: 16,
    gap: 14,
  },
  goalChip: {
    borderRadius: radius.pill,
    backgroundColor: colors.bg.overlay,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  goalChipText: { color: colors.text.primary, fontSize: typeScale.caption.size, fontWeight: '600' },
  kcalBlock: { alignItems: 'center', gap: 2 },
  kcalNum: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: 56,
    lineHeight: 56,
    fontVariant: ['tabular-nums'],
  },
  macroBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.bg.overlay,
  },
  macroSeg: { height: 8 },
  targetsGrid: { flexDirection: 'row', gap: 10 },
  targetCell: { flex: 1, gap: 2 },
  targetNum: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
    fontVariant: ['tabular-nums'],
  },
  targetLabel: { color: colors.text.secondary, fontSize: typeScale.caption.size },
});