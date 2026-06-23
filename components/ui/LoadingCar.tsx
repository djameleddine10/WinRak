import { useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { useColors } from '../../hooks/useColors'
import { Txt } from './Txt'

interface LoadingCarProps {
  size?: number
  text?: string
}

const CAR = 40 // car sprite box

// Top-down car that travels along a 270° gold arc. The car is a plain
// Animated.View (array transform — safe on the new architecture) so we avoid
// string `transform` on SVG which crashes Fabric (String->ReadableArray).
export function LoadingCar({ size = 200, text }: LoadingCarProps) {
  const Colors = useColors()
  const progress = useRef(new Animated.Value(0)).current
  const center = size / 2
  const radius = size * 0.34

  const START = (135 * Math.PI) / 180
  const SWEEP = (270 * Math.PI) / 180

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    loop.start()
    return () => loop.stop()
  }, [progress])

  const arcPath = describeArc(center, center, radius, 135, 135 + 270)

  const steps = Array.from({ length: 37 }, (_, i) => i / 36)
  const translateX = progress.interpolate({
    inputRange: steps,
    outputRange: steps.map((t) => radius * Math.cos(START + SWEEP * t)),
  })
  const translateY = progress.interpolate({
    inputRange: steps,
    outputRange: steps.map((t) => radius * Math.sin(START + SWEEP * t)),
  })
  const rotate = progress.interpolate({
    inputRange: steps,
    outputRange: steps.map((t) => `${(START + SWEEP * t) * (180 / Math.PI) + 90}deg`),
  })

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Path d={arcPath} stroke={Colors.gold} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.85} />
        </Svg>
        <Animated.View
          style={{
            position: 'absolute',
            left: center - CAR / 2,
            top: center - CAR / 2,
            width: CAR,
            height: CAR,
            transform: [{ translateX }, { translateY }, { rotate }],
          }}
        >
          <Svg width={CAR} height={CAR} viewBox="-20 -20 40 40">
            <Rect x={-9} y={-15} width={18} height={30} rx={5} fill="#9aa3ad" />
            <Rect x={-6} y={-10} width={12} height={9} rx={2} fill={Colors.dark1} />
            <Rect x={-6} y={2} width={12} height={7} rx={2} fill={Colors.dark1} />
            <Circle cx={-11} cy={-9} r={2.4} fill="#5b636c" />
            <Circle cx={11} cy={-9} r={2.4} fill="#5b636c" />
            <Circle cx={-11} cy={9} r={2.4} fill="#5b636c" />
            <Circle cx={11} cy={9} r={2.4} fill="#5b636c" />
          </Svg>
        </Animated.View>
      </View>
      {!!text && <Txt size={14} color={Colors.muted} style={{ marginTop: 12 }}>{text}</Txt>}
    </View>
  )
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polar(cx, cy, r, startDeg)
  const end = polar(cx, cy, r, endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}
