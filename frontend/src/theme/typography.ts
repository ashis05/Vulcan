export const fonts = {
  display: {
    medium: 'SpaceGrotesk_500Medium',
    bold: 'SpaceGrotesk_700Bold',
  },
  body: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
} as const;

export const typeScale = {
  display: { size: 44, lineHeight: 48, weight: '700', letterSpacing: -0.02 },
  title: { size: 28, lineHeight: 34, weight: '700', letterSpacing: -0.01 },
  h2: { size: 22, lineHeight: 28, weight: '600', letterSpacing: 0 },
  h3: { size: 17, lineHeight: 24, weight: '600', letterSpacing: 0 },
  body: { size: 15, lineHeight: 22, weight: '400', letterSpacing: 0 },
  label: { size: 13, lineHeight: 18, weight: '500', letterSpacing: 0 },
  caption: { size: 11, lineHeight: 16, weight: '500', letterSpacing: 0 },
} as const;

export type TypeScale = typeof typeScale;
export type TypeVariant = keyof TypeScale;