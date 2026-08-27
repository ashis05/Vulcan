export const colors = {
  bg: {
    base: '#0B0B0D',
    elevated: '#141417',
    card: '#1B1B20',
    overlay: '#232329',
  },
  border: {
    hairline: '#2A2A31',
    focus: '#FF6A00',
  },
  text: {
    primary: '#F5F2EC',
    secondary: '#A6A29B',
    muted: '#6E6A64',
    onAccent: '#0B0B0D',
  },
  accent: {
    ember300: '#FFB347',
    ember400: '#FF8A3D',
    ember500: '#FF6A00',
    ember700: '#C2410C',
  },
  glow: 'rgba(255,106,0,0.45)',
  gradient: {
    flame: ['#FFB347', '#FF6A00', '#E63E00'],
    flameAngle: 135,
    chartFade: ['rgba(255,106,0,0.35)', 'rgba(255,106,0,0)'],
  },
  semantic: {
    success: '#3ECF8E',
    warning: '#FFB020',
    danger: '#F4502F',
  },
  macros: {
    protein: '#FF6A00',
    carbs: '#FFB020',
    fat: '#B08CF2',
  },
  charts: ['#FF6A00', '#FFB347', '#B08CF2', '#7DD3FC', '#3ECF8E'],
  steps: '#3ECF8E',
} as const;

export type ThemeColors = typeof colors;