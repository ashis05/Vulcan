import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radius, typeScale } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type Props = {
  label: string;
  variant?: ButtonVariant;
  leading?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: object;
};

export function Button({
  label,
  variant = 'primary',
  leading,
  onPress,
  disabled,
  fullWidth = true,
  style,
}: Props) {
  const base: ViewStyle = {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: 24,
    ...(fullWidth ? { width: '100%' } : {}),
    ...(disabled ? { opacity: 0.4 } : {}),
  };

  const textColor: Record<ButtonVariant, string> = {
    primary: colors.text.onAccent,
    secondary: colors.text.primary,
    ghost: colors.text.secondary,
    destructive: colors.semantic.danger,
  };

  if (variant === 'primary') {
    return (
      <Pressable onPress={onPress} disabled={disabled} style={[base, style]}>
        {({ pressed }) => (
          <>
            <LinearGradient
              colors={[...colors.gradient.flame]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: radius.pill, opacity: pressed ? 0.9 : 1 }]}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {leading ? leading : null}
              <Text style={{ fontSize: typeScale.body.size, fontWeight: '600', color: textColor.primary }}>
                {label}
              </Text>
            </View>
          </>
        )}
      </Pressable>
    );
  }

  const surface =
    variant === 'secondary'
      ? { borderWidth: 1, borderColor: colors.border.hairline, backgroundColor: colors.bg.card }
      : {};

  return (
    <Pressable onPress={onPress} disabled={disabled} style={[base, surface, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {leading ? leading : null}
        <Text style={{ fontSize: typeScale.body.size, fontWeight: '600', color: textColor[variant] }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}