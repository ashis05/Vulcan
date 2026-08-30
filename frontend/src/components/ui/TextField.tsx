import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { colors, radius, typeScale } from '@/theme';

type Props = React.ComponentProps<typeof TextInput> & {
  label?: string;
  error?: string | null;
  hint?: string;
};

export function TextField({ label, error, hint, onFocus, onBlur, style, ...inputProps }: Props) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.semantic.danger
    : focused
      ? colors.border.focus
      : colors.border.hairline;

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text style={{ color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '500' }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.text.muted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          {
            height: 48,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor,
            backgroundColor: colors.bg.elevated,
            paddingHorizontal: 14,
            fontSize: typeScale.body.size,
            color: colors.text.primary,
          },
          style,
        ]}
        {...inputProps}
      />
      {error ? (
        <Text style={{ color: colors.semantic.danger, fontSize: typeScale.caption.size }}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={{ color: colors.text.muted, fontSize: typeScale.caption.size }}>{hint}</Text>
      ) : null}
    </View>
  );
}