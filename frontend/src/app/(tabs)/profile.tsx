import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { ArrowLeftIcon, PencilIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { goalChipLabel } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/lib/use-profile';
import { colors, fonts, radius, typeScale } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { data: profile, isPending } = useProfile();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/welcome');
  };

  if (isPending) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent.ember500} />
        </View>
      </Screen>
    );
  }

  const initial = (profile?.displayName ?? '?').trim().charAt(0).toUpperCase() || '?';
  const chip = goalChipLabel(profile?.goal ?? null, profile?.paceKgWk ?? 0);

  const openEdit = () => router.push('/edit-profile');

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Forged for you</Text>
      </View>

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.identityText}>
          <Text style={styles.name}>{profile?.displayName || 'Athlete'}</Text>
          {chip ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.card}>
        <Pressable onPress={openEdit} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <PencilIcon size={20} color={colors.text.secondary} />
          <Text style={styles.rowLabel}>Edit profile</Text>
          <View style={{ marginLeft: 'auto', transform: [{ rotate: '180deg' }] }}>
            <ArrowLeftIcon size={18} color={colors.text.muted} />
          </View>
        </Pressable>
        <View style={styles.divider} />
        <Button label="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 24 },
  title: {
    fontFamily: fonts.display.bold,
    fontSize: typeScale.title.size,
    lineHeight: typeScale.title.lineHeight,
    color: colors.text.primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: typeScale.caption.size,
    color: colors.text.muted,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.accent.ember500,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
  },
  identityText: { gap: 6 },
  name: {
    color: colors.text.primary,
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.bg.overlay,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { color: colors.text.primary, fontSize: typeScale.caption.size, fontWeight: '600' },
  card: {
    margin: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.hairline,
    backgroundColor: colors.bg.card,
    padding: 8,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  pressed: { opacity: 0.7 },
  rowLabel: { color: colors.text.primary, fontSize: typeScale.body.size, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border.hairline, marginHorizontal: 8 },
});