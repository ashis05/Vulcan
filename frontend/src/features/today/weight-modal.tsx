import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import type { WeightUnit } from '@/engine/types';
import { kgToLb, lbToKg } from '@/engine/units';
import { colors, typeScale } from '@/theme';

import { NumberStepper, SheetAction, SheetModal } from './components';

function WeightForm({
  weightKg,
  unit,
  saving,
  onSave,
}: {
  weightKg: number;
  unit: WeightUnit;
  saving?: boolean;
  onSave: (kg: number) => void;
}) {
  const [display, setDisplay] = useState(
    unit === 'lb' ? Math.round(kgToLb(weightKg)) : Math.round(weightKg * 10) / 10,
  );
  const decimals = unit === 'lb' ? 0 : 1;
  const step = unit === 'lb' ? 1 : 0.5;

  return (
    <>
      <NumberStepper
        value={display}
        step={step}
        min={unit === 'lb' ? 88 : 40}
        max={unit === 'lb' ? 551 : 250}
        decimals={decimals}
        onChange={setDisplay}
      />
      <Text style={styles.hint}>{unit} · today · feeds the weight trend</Text>
      <SheetAction
        label={saving ? 'Saving…' : 'Save'}
        onPress={() => onSave(unit === 'lb' ? lbToKg(display) : display)}
        disabled={saving}
      />
    </>
  );
}

export function WeightModal({
  visible,
  weightKg,
  unit,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  weightKg: number;
  unit: WeightUnit;
  saving?: boolean;
  onClose: () => void;
  onSave: (kg: number) => void;
}) {
  return (
    <SheetModal visible={visible} title="Log weight" onClose={onClose}>
      {visible ? (
        <WeightForm weightKg={weightKg} unit={unit} saving={saving} onSave={onSave} />
      ) : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: colors.text.muted,
    fontSize: typeScale.caption.size,
    textAlign: 'center',
    marginBottom: 12,
  },
});
