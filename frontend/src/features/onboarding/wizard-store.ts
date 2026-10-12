import { create } from 'zustand';

import type { Profile } from '@/engine/types';

export type WizardFields = Omit<Profile, 'onboardingCompleted'>;

export const WIZARD_DEFAULTS: WizardFields = {
  displayName: '',
  sex: null,
  birthDate: '1998-08-01',
  heightCm: 175,
  heightUnit: 'cm',
  weightKg: 82,
  weightUnit: 'kg',
  goal: null,
  paceKgWk: -0.5,
  activityLevel: 'moderate',
  experience: null,
  daysPerWeek: 4,
  sessionLenMin: 60,
  equipment: [],
  injuries: [],
  injuriesNote: '',
};

interface WizardStore extends WizardFields {
  step: number;
  /** True once the Reveal step has shown the targets card. */
  revealed: boolean;
  set: (patch: Partial<WizardFields>) => void;
  setStep: (step: number) => void;
  setRevealed: (revealed: boolean) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardStore>((set) => ({
  ...WIZARD_DEFAULTS,
  step: 0,
  revealed: false,
  set: (patch) => set(patch),
  setStep: (step) => set({ step }),
  setRevealed: (revealed) => set({ revealed }),
  reset: () => set({ ...WIZARD_DEFAULTS, step: 0, revealed: false }),
}));

export function wizardFieldsToProfile(fields: WizardFields): Profile {
  return { ...fields, onboardingCompleted: true };
}

export function canContinue(step: number, fields: WizardFields): boolean {
  switch (step) {
    case 1:
      return fields.displayName.trim().length > 0;
    case 2:
      return fields.sex !== null;
    case 6:
      return fields.goal !== null;
    case 9:
      return fields.experience !== null;
    case 11:
      return fields.equipment.length > 0;
    default:
      return true;
  }
}