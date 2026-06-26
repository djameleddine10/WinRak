import { memo, useMemo } from 'react'
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useIsRTL } from '../../i18n/locale'
import { Spacing } from '../../constants/spacing'
import { Shadows } from '../../constants/shadows'

interface CardProps {
  children: React.ReactNode
  padding?: number
  radius?: number
  border?: boolean
  leftAccent?: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

// Dark card. leftAccent renders a 4px colored bar on the RIGHT side (RTL "leading" edge).
export const Card = memo(function Card({
  children, padding = Spacing.cardPadding, radius = Spacing.radiusMd,
  border, leftAccent, onPress, style,
}: CardProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const content = (
    <View
      style={[
        styles.base,
        {
          padding,
          borderRadius: radius,
          borderWidth: border ? 1 : 0,
        },
        style,
      ]}
    >
      {leftAccent && <View style={[styles.accent, isRTL
          ? { backgroundColor: leftAccent, borderTopRightRadius: radius, borderBottomRightRadius: radius }
          : { backgroundColor: leftAccent, borderTopLeftRadius: radius, borderBottomLeftRadius: radius, right: undefined, left: 0 }]} />}
      {children}
    </View>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
        {content}
      </Pressable>
    )
  }
  return content
})

function makeStyles(Colors: Palette, isRTL: boolean) {
  return StyleSheet.create({
    base: {
      backgroundColor: Colors.dark2,
      borderColor: Colors.border,
      overflow: 'hidden',
      ...Shadows.sm,
    },
    accent: { position: 'absolute', top: 0, bottom: 0, width: 4 },
  })
}
