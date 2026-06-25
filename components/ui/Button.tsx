import { memo } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native'
import * as Haptics from 'expo-haptics'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Typography } from '../../constants/typography'
import { Txt } from './Txt'
import { DirIcon } from './DirIcon'
import { useIsRTL } from '../../i18n/locale'

type Variant = 'primary' | 'outline' | 'danger' | 'ghost' | 'white'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  label: string
  onPress?: () => void
  variant?: Variant
  size?: Size
  icon?: string
  iconPosition?: 'left' | 'right'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  style?: ViewStyle
}

const HEIGHTS: Record<Size, number> = { sm: 40, md: 46, lg: 52 }

export const Button = memo(function Button({
  label, onPress, variant = 'primary', size = 'lg',
  icon, iconPosition = 'left', loading, disabled, fullWidth = true, style,
}: ButtonProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const v = makeVariants(Colors)[variant]
  const height = HEIGHTS[size]
  const isDisabled = disabled || loading

  function handlePress() {
    if (isDisabled || !onPress) return
    // Light haptic on every button tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onPress()
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: v.borderWidth,
          borderRadius: variant === 'white' ? height / 2 : Spacing.radiusMd,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {icon && iconPosition === 'left' && <DirIcon name={icon} size={20} color={v.text} />}
          <Txt weight="bold" size={Typography.sizes.lg} color={v.text}>{label}</Txt>
          {icon && iconPosition === 'right' && <DirIcon name={icon} size={20} color={v.text} />}
        </View>
      )}
    </Pressable>
  )
})

function makeVariants(Colors: Palette): Record<Variant, { bg: string; text: string; border: string; borderWidth: number }> {
  return {
    primary: { bg: Colors.gold,   text: Colors.dark1, border: 'transparent', borderWidth: 0   },
    outline: { bg: 'transparent', text: Colors.gold,  border: Colors.gold,   borderWidth: 1.5 },
    danger:  { bg: Colors.danger, text: Colors.pureWhite, border: 'transparent', borderWidth: 0   },
    ghost:   { bg: 'transparent', text: Colors.muted, border: 'transparent', borderWidth: 0   },
    white:   { bg: Colors.white,  text: Colors.dark1, border: 'transparent', borderWidth: 0   },
  }
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
  fullWidth: { width: '100%' },
  row: { alignItems: 'center', gap: Spacing.sm },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
})
