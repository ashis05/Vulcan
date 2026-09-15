import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { FlameIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { ActiveSessionBanner } from '@/features/train/components';
import { ConnectStepsCard } from '@/features/today/connect-steps-card';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { colors, fonts, typeScale } from '@/theme';

export default function TodayScreen() {
  const [proof, setProof] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const verifyBackend = async () => {
    setError(null);
    setProof(null);
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError('Not signed in.');
        return;
      }
      const res = await apiFetch<{ user_id: string }>('/health/protected', {
        token: data.session.access_token,
      });
      setProof(`JWT verified server-side — user_id ${res.user_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Backend unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.subtitle}>Dashboard lands in Phase 3.</Text>
      </View>
      <View style={styles.bannerWrap}>
        <ActiveSessionBanner />
      </View>
      <View style={styles.bannerWrap}>
        <ConnectStepsCard />
      </View>
      <View style={styles.empty}>
        <FlameIcon size={28} color="#FF6A00" />
        <Text style={styles.emptyText}>Nothing forged yet.</Text>
      </View>
      <View style={styles.footer}>
        <Button
          label={loading ? 'Checking…' : 'Verify FastAPI (Phase 0 proof)'}
          variant="secondary"
          onPress={verifyBackend}
          disabled={loading}
        />
        {proof ? <Text style={styles.proofText}>{proof}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  bannerWrap: { paddingHorizontal: 16, paddingTop: 12 },
  emptyText: { fontSize: typeScale.label.size, color: colors.text.secondary },
  footer: { gap: 12, paddingHorizontal: 16, paddingBottom: 32 },
  proofText: { fontSize: typeScale.label.size, color: colors.semantic.success },
  errorText: { fontSize: typeScale.label.size, color: colors.semantic.danger },
});