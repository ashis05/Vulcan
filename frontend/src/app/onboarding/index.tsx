import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import {
  ActivityStep,
  BirthDateStep,
  EquipmentStep,
  ExperienceStep,
  GoalStep,
  HeightStep,
  LimitationsStep,
  NameStep,
  PaceStep,
  RevealStep,
  SexStep,
  WeekStep,
  WeightStep,
  WelcomeStep,
} from '@/features/onboarding/steps';
import { canContinue, useWizardStore, wizardFieldsToProfile } from '@/features/onboarding/wizard-store';
import { queryClient } from '@/lib/query-client';
import { saveProfileAndFirstMetric } from '@/lib/profile';
import { useAuth } from '@/lib/use-auth';
import { useProfile } from '@/lib/use-profile';
import { colors, radius, typeScale } from '@/theme';

const STEPS = [
  WelcomeStep,
  NameStep,
  SexStep,
  BirthDateStep,
  HeightStep,
  WeightStep,
  GoalStep,
  ActivityStep,
  PaceStep,
  ExperienceStep,
  WeekStep,
  EquipmentStep,
  LimitationsStep,
  RevealStep,
];
const LAST = STEPS.length - 1;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user } = useAuth();
  const profileQuery = useProfile();
  const wizard = useWizardStore();
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    wizard.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOnboarded = !!profileQuery.data?.onboardingCompleted;

  // Navigate declaratively once the saved profile lands in the cache — doing it
  // inline raced the (tabs) guard, which was still false and dropped the route.
  useEffect(() => {
    if (isOnboarded) {
      router.replace('/today');
    }
  }, [isOnboarded, router]);

  const StepComponent = STEPS[wizard.step];
  const canProceed = wizard.step === LAST ? wizard.revealed : canContinue(wizard.step, wizard);

  const goBack = () => {
    if (wizard.step > 0) {
      wizard.setStep(wizard.step - 1);
    }
  };

  const onContinue = async () => {
    if (wizard.step < LAST) {
      wizard.setStep(wizard.step + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return;
    }
    if (!user || saving) return;
    setSaving(true);
    try {
      const saved = wizardFieldsToProfile(wizard);
      await saveProfileAndFirstMetric(user.id, saved);
      queryClient.setQueryData(['profile', user.id], saved);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
      setSaving(false);
    }
  };

  const nextLabel = wizard.step === LAST ? (saving ? 'Saving…' : 'Enter the forge') : 'Continue';

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {wizard.step > 0 ? (
            <Pressable onPress={goBack} hitSlop={8} style={styles.backBtn}>
              <ArrowLeftIcon size={18} color={colors.text.primary} />
              <Text style={styles.backLabel}>Back</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Text style={styles.count}>
            {wizard.step + 1} / {STEPS.length}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(wizard.step / LAST) * 100}%` }]} />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        <StepComponent />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          label={nextLabel}
          onPress={onContinue}
          disabled={!canProceed || saving}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44 },
  backLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  count: { color: colors.text.muted, fontSize: typeScale.caption.size, fontVariant: ['tabular-nums'] },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bg.overlay,
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.accent.ember500 },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 32 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.hairline,
    borderRadius: radius.md,
  },
});