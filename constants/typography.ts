export const Typography = {
  fonts: {
    regular:  'Cairo_400Regular',
    semibold: 'Cairo_600SemiBold',
    bold:     'Cairo_700Bold',
    black:    'Cairo_900Black',
  },
  sizes: {
    xs:   11,
    sm:   12,
    md:   13,
    base: 14,
    lg:   16,
    xl:   18,
    xxl:  22,
    hero: 28,
    mega: 36,
  },
} as const

export type FontWeight = keyof typeof Typography.fonts
export type FontSize = keyof typeof Typography.sizes
