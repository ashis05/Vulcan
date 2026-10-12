import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ArrowLeftIcon } from '@/components/icons';
import { Screen } from '@/components/ui/Screen';
import { EditProfileForm } from '@/features/profile/edit-form';
import { useProfile } from '@/lib/use-profile';
import { colors, fonts, typeScale } from '@/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { data: profile, isPending } = useProfile();

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <ArrowLeftIcon size={18} color={colors.text.primary} />
          <Text style={styles.backLabel}>Profile</Text>
        </Pressable>
        <Text style={styles.navTitle}>Edit profile</Text>
        <View style={styles.navSpacer} />
      </View>

      {isPending || !profile ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent.ember500} />
        </View>
      ) : (
        <EditProfileForm initial={profile} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, minWidth: 72 },
  backLabel: { color: colors.text.secondary, fontSize: typeScale.label.size, fontWeight: '600' },
  navTitle: { color: colors.text.primary, fontFamily: fonts.display.bold, fontSize: typeScale.h2.size },
  navSpacer: { minWidth: 72 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
