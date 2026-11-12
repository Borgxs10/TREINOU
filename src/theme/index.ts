import type { TextStyle } from 'react-native';

export const colors = {
  background: '#0B0B0C',
  surface: '#141416',
  surfaceAlt: '#1C1C1F',
  border: '#2A2A2E',
  borderStrong: '#3A3A40',
  text: '#F4F4F5',
  textMuted: '#A1A1AA',
  textDim: '#6B6B73',
  accent: '#FF5A1F',
  accentSoft: 'rgba(255, 90, 31, 0.14)',
  danger: '#EF4444',
  success: '#34D399',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  title: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  subtitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metric: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
