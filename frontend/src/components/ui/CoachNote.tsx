import { StyleSheet, Text, View } from 'react-native';

import { SparkIcon } from '@/components/icons';
import { colors, radius, typeScale } from '@/theme';

type Props = {
  body: string;
  foot?: string;
  title?: string;
};

export function CoachNote({ body, foot = 'AI guidance · review before logging', title = 'VULCAN coach' }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.meta}>
        <SparkIcon size={13} color={colors.accent.ember500} filled />
        <Text style={styles.metaText}>{title}</Text>
      </View>
      <Text style={styles.body}>{body}</Text>
      {foot ? <Text style={styles.foot}>{foot}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border.hairline,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.ember500,
    borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
    padding: 16,
    gap: 6,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: {
    color: colors.accent.ember500,
    fontSize: typeScale.caption.size,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  body: { color: colors.text.secondary, fontSize: typeScale.body.size, lineHeight: typeScale.body.lineHeight },
  foot: { color: colors.text.muted, fontSize: typeScale.caption.size },
});
