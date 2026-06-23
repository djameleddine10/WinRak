import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useColors } from '../../hooks/useColors'

interface IconProps {
  name: string
  size?: number
  color?: string
  style?: any
  onPress?: () => void
}

// Thin wrapper around MaterialCommunityIcons that accepts a plain string name.
export function Icon({ name, size = 22, color, style, onPress }: IconProps) {
  const Colors = useColors()
  return <MaterialCommunityIcons name={name as any} size={size} color={color ?? Colors.white} style={style} onPress={onPress} />
}
