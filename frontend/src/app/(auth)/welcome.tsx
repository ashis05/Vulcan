import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { GoogleIcon, SparkIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { signInWithGoogle } from '@/lib/oauth';
import { colors, fonts, typeScale } from '@/theme';

export default function WelcomeScreen() {
  const [submitting, setSubmitting] = useState(false);

  const onGoogle = async () => {
    setSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert('Google sign-in', error);
      }
    } catch (e) {
      Alert.alert('Google sign-in', e instanceof Error ? e.message : 'Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <LinearGradient
        colors={['rgba(255,106,0,0)', 'rgba(255,106,0,0.28)']}
        style={styles.glow}
      />
      <View style={styles.root}>
        <View style={styles.wordRow}>
          <SparkIcon size={22} color={colors.accent.ember500} filled />
          <Text style={styles.word}>VULCAN</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Forge your{'\n'}physique.</Text>
          <Text style={styles.heroCaption}>
            AI coaching. Training. Nutrition.{'\n'}One forge.
          </Text>
        </View>

        <View style={styles.ctas}>
          <Button
            label={submitting ? 'Connecting…' : 'Continue with Google'}
            leading={<GoogleIcon size={20} />}
            onPress={onGoogle}
            disabled={submitting}
          />
          <Text style={styles.terms}>
            By continuing you agree to the Terms &amp; Privacy Policy.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 320,
    pointerEvents: 'none',
  },
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 40,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 40,
  },
  word: {
    fontFamily: fonts.display.bold,
    fontSize: typeScale.h2.size,
    color: colors.text.primary,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  heroTitle: {
    textAlign: 'center',
    fontFamily: fonts.display.bold,
    fontSize: typeScale.display.size,
    lineHeight: typeScale.display.lineHeight,
    letterSpacing: typeScale.display.letterSpacing,
    color: colors.text.primary,
  },
  heroCaption: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: typeScale.body.size,
    lineHeight: typeScale.body.lineHeight,
  },
  ctas: {
    gap: 12,
  },
  terms: {
    marginTop: 8,
    textAlign: 'center',
    color: colors.text.muted,
    fontSize: typeScale.caption.size,
  },
});