import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useColors } from '../../hooks/useColors'
import { useIsRTL } from '../../i18n/locale'

interface DirIconProps {
  name: string   // Always the LTR icon name (e.g. 'arrow-left', 'chevron-right')
  size?: number
  color?: string
  style?: any
}

// Directional icon that mirrors itself for RTL and smoothly animates the flip
// whenever the language switches between RTL (Arabic) and LTR (French / English).
// Always pass the LTR version of the icon name; scaleX: -1 handles the mirror.
export function DirIcon({ name, size = 22, color, style }: DirIconProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const scaleX = useRef(new Animated.Value(isRTL ? -1 : 1)).current

  useEffect(() => {
    Animated.spring(scaleX, {
      toValue: isRTL ? -1 : 1,
      useNativeDriver: true,
      bounciness: 5,
      speed: 18,
    }).start()
  }, [isRTL, scaleX])

  return (
    <Animated.View style={[{ transform: [{ scaleX }] }, style]}>
      <MaterialCommunityIcons
        name={name as any}
        size={size}
        color={color ?? Colors.white}
      />
    </Animated.View>
  )
}
