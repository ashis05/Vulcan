import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { SparkIcon } from '@/components/icons';
import { useAuth } from '@/lib/use-auth';
import { useProfile } from '@/lib/use-profile';
import { colors, fonts, motion } from '@/theme';

const SPARK_SIZE = 40;
const GAP = 12;
const SPARK_MS = 520;
const WORD_DELAY = 360;
const WORD_MS = 460;
const ROUTE_DELAY = 1350;
const ROUTE_DELAY_REDUCED = 450;

export default function SplashScreen() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const profileQuery = useProfile();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const wordWidth = useRef(0);

  const sparkScale = useMemo(() => new Animated.Value(0.5), []);
  const sparkOpacity = useMemo(() => new Animated.Value(0), []);
  const sparkY = useMemo(() => new Animated.Value(12), []);
  const rowX = useMemo(() => new Animated.Value(0), []);
  const wordOpacity = useMemo(() => new Animated.Value(0), []);
  const wordX = useMemo(() => new Animated.Value(14), []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Reduce-motion users get the final lockup immediately.
  useEffect(() => {
    if (!reduceMotion) return;
    sparkScale.setValue(1);
    sparkOpacity.setValue(1);
    sparkY.setValue(0);
    rowX.setValue(0);
    wordOpacity.setValue(1);
    wordX.setValue(0);
  }, [reduceMotion, sparkScale, sparkOpacity, sparkY, rowX, wordOpacity, wordX]);

  // Ignite the spark at centre, then slide it to the left of the word. The
  // distance is measured so the spark lands exactly beside VULCAN.
  useEffect(() => {
    if (reduceMotion || !ready) return;
    rowX.setValue((wordWidth.current + GAP) / 2);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(sparkScale, {
          toValue: 1,
          damping: motion.spring.damping,
          stiffness: motion.spring.stiffness,
          useNativeDriver: true,
        }),
        Animated.timing(sparkOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(sparkY, {
          toValue: 0,
          duration: SPARK_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(WORD_DELAY),
      Animated.parallel([
        Animated.timing(rowX, {
          toValue: 0,
          duration: WORD_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(wordOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(wordX, {
          toValue: 0,
          duration: WORD_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [reduceMotion, ready, rowX, sparkScale, sparkOpacity, sparkY, wordOpacity, wordX]);

  const onWordLayout = (event: LayoutChangeEvent) => {
    if (ready) return;
    wordWidth.current = event.nativeEvent.layout.width;
    setReady(true);
  };

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
        <Animated.View style={[styles.row, { transform: [{ translateX: rowX }] }]}>
          <Animated.View
            style={{
              opacity: sparkOpacity,
              transform: [{ translateY: sparkY }, { scale: sparkScale }],
            }}
          >
            <SparkIcon size={SPARK_SIZE} color={colors.accent.ember500} filled />
          </Animated.View>
          <Animated.Text
            onLayout={onWordLayout}
            style={[styles.word, { opacity: wordOpacity, transform: [{ translateX: wordX }] }]}
          >
            VULCAN
          </Animated.Text>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: GAP },
  word: {
    fontFamily: fonts.display.bold,
    fontSize: 34,
    letterSpacing: 5.4,
    color: colors.text.primary,
  },
});
