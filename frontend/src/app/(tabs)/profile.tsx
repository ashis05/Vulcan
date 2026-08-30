import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { PersonIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { colors, fonts, typeScale } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/welcome');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Onboarding lands in Phase 1.</Text>
      </View>
      <View style={styles.empty}>
        <PersonIcon size={28} color="#FF6A00" />
        <Text style={styles.emptyText}>Profile setup coming soon.</Text>
      </View>
      <View style={styles.footer}>
        <Button label="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    lineHeight: typeScale.caption.lineHeight,
    color: colors.text.muted,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.4,
  },
  emptyText: { fontSize: typeScale.label.size, color: colors.text.secondary },
  footer: { paddingHorizontal: 16, paddingBottom: 32 },
});