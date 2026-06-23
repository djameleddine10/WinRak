import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { useColors } from '../../hooks/useColors'
import type { VehicleType } from '../../store/rideStore'

interface VehicleIconProps {
  type: VehicleType
  size?: number
  color?: string
}

// Outline vehicle silhouettes (side view) drawn with react-native-svg.
export function VehicleIcon({ type, size = 48, color }: VehicleIconProps) {
  const Colors = useColors()
  const c = color ?? Colors.white
  const w = size
  const h = size * 0.6
  const sw = 2

  if (type === 'suv') {
    return (
      <Svg width={w} height={h} viewBox="0 0 80 48">
        <Path d="M8 34 L8 22 L22 14 L58 14 L70 24 L72 34" stroke={c} strokeWidth={sw} fill="none" />
        <Path d="M6 34 L74 34" stroke={c} strokeWidth={sw} />
        <Path d="M22 14 L22 24 L70 24" stroke={c} strokeWidth={sw} fill="none" />
        <Path d="M24 9 L56 9" stroke={c} strokeWidth={sw} />
        <Circle cx={24} cy={37} r={6} stroke={c} strokeWidth={sw} fill={Colors.dark3} />
        <Circle cx={58} cy={37} r={6} stroke={c} strokeWidth={sw} fill={Colors.dark3} />
      </Svg>
    )
  }
  if (type === 'van') {
    return (
      <Svg width={w} height={h} viewBox="0 0 80 48">
        <Rect x={8} y={12} width={64} height={24} rx={4} stroke={c} strokeWidth={sw} fill="none" />
        <Path d="M40 12 L40 36" stroke={c} strokeWidth={sw} />
        <Rect x={14} y={18} width={18} height={10} rx={2} stroke={c} strokeWidth={sw} fill="none" />
        <Circle cx={24} cy={38} r={6} stroke={c} strokeWidth={sw} fill={Colors.dark3} />
        <Circle cx={58} cy={38} r={6} stroke={c} strokeWidth={sw} fill={Colors.dark3} />
      </Svg>
    )
  }
  if (type === 'truck') {
    return (
      <Svg width={w} height={h} viewBox="0 0 80 48">
        <Rect x={6} y={10} width={40} height={26} rx={3} stroke={c} strokeWidth={sw} fill="none" />
        <Path d="M46 36 L46 20 L60 20 L72 28 L72 36" stroke={c} strokeWidth={sw} fill="none" />
        <Rect x={62} y={24} width={8} height={6} stroke={c} strokeWidth={sw} fill="none" />
        <Circle cx={20} cy={38} r={6} stroke={c} strokeWidth={sw} fill={Colors.dark3} />
        <Circle cx={36} cy={38} r={6} stroke={c} strokeWidth={sw} fill={Colors.dark3} />
        <Circle cx={62} cy={38} r={6} stroke={c} strokeWidth={sw} fill={Colors.dark3} />
      </Svg>
    )
  }
  // sedan & she share the sedan body; "she" gets a purple tint + flower handled by caller color.
  return (
    <Svg width={w} height={h} viewBox="0 0 80 48">
      <Path d="M8 34 L12 24 L26 16 L52 16 L66 24 L72 34" stroke={c} strokeWidth={sw} fill="none" />
      <Path d="M6 34 L74 34" stroke={c} strokeWidth={sw} />
      <Path d="M26 16 L30 24 L62 24 L52 16" stroke={c} strokeWidth={sw} fill="none" />
      <Circle cx={24} cy={37} r={6} stroke={c} strokeWidth={sw} fill={Colors.dark3} />
      <Circle cx={56} cy={37} r={6} stroke={c} strokeWidth={sw} fill={Colors.dark3} />
      {type === 'she' && <Circle cx={40} cy={11} r={3.5} fill={Colors.purple} />}
    </Svg>
  )
}
