import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { colors, fonts, radius, typeScale } from '@/theme';

import { NumberStepper, SheetAction, SheetModal } from './components';

function StepsForm({
  steps,
  saving,
  onSave,
}: {
  steps: number;
  saving?: boolean;
  onSave: (steps: number) => void;
}) {
  const [value, setValue] = useState(steps);
  const [text, setText] = useState(String(steps));

  const commit = (next: number) => {
    setValue(next);
    setText(String(next));
  };

  return (
    <>
      <NumberStepper value={value} step={500} min={0} max={100000} onChange={commit} />
      <TextInput
        value={text}
        onChangeText={(next) => {
          setText(next);
          setValue(Number(next) || 0);
        }}
        keyboardType="number-pad"
        placeholder="Steps"
        placeholderTextColor={colors.text.muted}
        style={styles.input}
      />
      <Text style={styles.hint}>Manual entry · today · Health Connect can take over later</Text>
      <SheetAction
        label={saving ? 'Saving…' : 'Save steps'}
        onPress={() => onSave(Math.max(0, Math.round(value)))}
        disabled={saving}
      />
    </>
  );
}

export function StepsModal({
  visible,
  steps,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  steps: number;
  saving?: boolean;
  onClose: () => void;
  onSave: (steps: number) => void;
}) {
  return (
    <SheetModal visible={visible} title="Enter steps" onClose={onClose}>
      {visible ? <StepsForm steps={steps} saving={saving} onSave={onSave} /> : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.elevated,
    color: colors.text.primary,
    paddingHorizontal: 14,
    textAlign: 'center',
    fontFamily: fonts.display.bold,
    fontSize: typeScale.body.size,
    marginBottom: 8,
  },
  hint: {
    color: colors.text.muted,
    fontSize: typeScale.caption.size,
    textAlign: 'center',
    marginBottom: 12,
  },
});
