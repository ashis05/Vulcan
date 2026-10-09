import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { colors } from '@/theme';

type Props = {
  /** Outer diameter in px. */
  size?: number;
  /** 0–1 progress around the ring (clamped). */
  progress: number;
  thickness?: number;
  children?: ReactNode;
};

const VIEW = 120;
const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RingProgress({ size = 168, progress, thickness = 10, children }: Props) {
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Defs>
          <LinearGradient id="ringProgressGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.gradient.flame[0]} />
            <Stop offset="0.5" stopColor={colors.gradient.flame[1]} />
            <Stop offset="1" stopColor={colors.gradient.flame[2]} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={VIEW / 2}
          cy={VIEW / 2}
          r={RADIUS}
          stroke={colors.bg.overlay}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
        />
        <Circle
          cx={VIEW / 2}
          cy={VIEW / 2}
          r={RADIUS}
          stroke="url(#ringProgressGrad)"
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
        />
      </Svg>
      {children ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: thickness * 2 + 8,
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}
