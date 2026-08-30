export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const targetMin = 44;

export const shadows = {
  glow: { color: 'rgba(255,106,0,0.35)', radius: 24, offset: { width: 0, height: 0 } },
  glowSoft: { color: 'rgba(255,106,0,0.18)', radius: 16, offset: { width: 0, height: 0 } },
  card: { color: 'rgba(0,0,0,0.4)', radius: 12, offset: { width: 0, height: 2 } },
} as const;

export const motion = {
  spring: { damping: 20, stiffness: 200 },
  ringFill: { duration: 800, easing: 'easeOut' },
  ignite: { duration: 350, easing: 'easeOut' },
  sheet: { duration: 280, easing: 'easeOut' },
} as const;