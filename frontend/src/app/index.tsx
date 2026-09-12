import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { SparkIcon } from '@/components/icons';
import { useAuth } from '@/lib/use-auth';
import { useProfile } from '@/lib/use-profile';
import { colors, fonts, motion } from '@/theme';

const IGNITE_MS = 720;
const WORD_DELAY = 280;
const ROUTE_DELAY = 1250;
const ROUTE_DELAY_REDUCED = 450;

export default function SplashScreen() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const profileQuery = useProfile();
  const [reduceMotion, setReduceMotion] = useState(false);

  const scale = useMemo(() => new Animated.Value(0.4), []);
  const markOpacity = useMemo(() => new Animated.Value(0), []);
  const glowOpacity = useMemo(() => new Animated.Value(0), []);
  const wordOpacity = useMemo(() => new Animated.Value(0), []);
  const wordY = useMemo(() => new Animated.Value(10), []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
      if (enabled) {
        scale.setValue(1);
        markOpacity.setValue(1);
        glowOpacity.setValue(1);
        wordOpacity.setValue(1);
        wordY.setValue(0);
      }
    });
  }, [scale, markOpacity, glowOpacity, wordOpacity, wordY]);

  useEffect(() => {
    if (reduceMotion) return;

    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: motion.spring.damping, stiffness: motion.spring.stiffness, useNativeDriver: true }),
      Animated.timing(markOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: IGNITE_MS,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(WORD_DELAY),
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(wordY, { toValue: 0, damping: motion.spring.damping, stiffness: motion.spring.stiffness, useNativeDriver: true }),
      ]),
    ]).start();
  }, [reduceMotion, scale, markOpacity, glowOpacity, wordOpacity, wordY]);

  useEffect(() => {
    if (isLoading || (session && profileQuery.isPending)) return;
    const dest = !session
      ? '/welcome'
      : profileQuery.data?.onboardingCompleted
        ? '/today'
        : '/onboarding';
    const timer = setTimeout(
      () => router.replace(dest),
      reduceMotion ? ROUTE_DELAY_REDUCED : ROUTE_DELAY,
    );
    return () => clearTimeout(timer);
  }, [isLoading, session, reduceMotion, router, profileQuery.data, profileQuery.isPending]);

  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.stack}>
          <View style={styles.markWrap}>
            <Animated.View
              style={[
                styles.glow,
                {
                  backgroundColor: colors.glow,
                  opacity: glowOpacity,
                  transform: [{ scale }],
                },
              ]}
            />
            <Animated.View style={{ opacity: markOpacity, transform: [{ scale }] }}>
              <SparkIcon size={100} color={colors.accent.ember500} filled />
            </Animated.View>
          </View>
          <Animated.Text
            style={[
              styles.word,
              {
                opacity: wordOpacity,
                transform: [{ translateY: wordY }],
              },
            ]}
          >
            VULCAN
          </Animated.Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { alignItems: 'center', gap: 22 },
  markWrap: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 150, height: 150, borderRadius: 75 },
  word: {
    fontFamily: fonts.display.bold,
    fontSize: 34,
    letterSpacing: 5.4,
    color: colors.text.primary,
  },
});