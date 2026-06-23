import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import { useResolvedScheme } from '../../hooks/useColors'

// inDrive-style radar: concentric rings + a continuously rotating sweep wedge +
// pulsing center + scattered request blips. Defaults to the app gold brand; SHE
// (women) drivers pass a purple accent.
const DEFAULT_ACCENT = '#ffbc07'

interface RadarProps {
  size: number
  active?: boolean // online → animated & bright; offline → dimmed & still
  color?: string
}

// Fixed blips (polar: angle in deg, radius as fraction of R). A couple are
// "live" request pings (brighter + pulsing).
const BLIPS = [
  { ang: 135, rad: 0.5, r: 7, live: true },
  { ang: 35, rad: 0.78, r: 4, live: false },
  { ang: 255, rad: 0.62, r: 4, live: false },
  { ang: 200, rad: 0.3, r: 5, live: true },
]

export function Radar({ size, active = true, color = DEFAULT_ACCENT }: RadarProps) {
  const isDark = useResolvedScheme() === 'dark'
  const sweep = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(0)).current

  // Light mode needs higher contrast so the gold rings stay visible on near-white bg
  const ringOpacityBase   = isDark ? 0.30 : 0.55
  const blipOpacityActive = isDark ? 0.95 : 1.00
  const blipOpacityIdle   = isDark ? 0.40 : 0.70
  const sweepStopOpacity  = isDark ? 0.32 : 0.50
  const sweepLineOpacity  = isDark ? 0.70 : 0.90
  const ringStrokeWidth   = isDark ? 1    : 1.5

  const c = size / 2
  const R = size * 0.46

  useEffect(() => {
    if (!active) {
      sweep.stopAnimation()
      pulse.stopAnimation()
      return
    }
    const spin = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }),
    )
    const beat = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    )
    spin.start()
    beat.start()
    return () => { spin.stop(); beat.stop() }
  }, [active, sweep, pulse])

  const rotate = sweep.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.9] })
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] })

  const dim = active ? 1 : 0.4

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Static rings + blips */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {[1, 0.66, 0.33].map((f, i) => (
          <Circle key={i} cx={c} cy={c} r={R * f} stroke={color} strokeWidth={ringStrokeWidth} fill="none" opacity={ringOpacityBase * dim} />
        ))}
        {BLIPS.map((b, i) => {
          const a = (b.ang * Math.PI) / 180
          const x = c + R * b.rad * Math.cos(a)
          const y = c + R * b.rad * Math.sin(a)
          return <Circle key={i} cx={x} cy={y} r={b.r} fill={color} opacity={(b.live ? blipOpacityActive : blipOpacityIdle) * dim} />
        })}
      </Svg>

      {/* Rotating sweep wedge (native-driven rotation of the whole layer) */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]} pointerEvents="none">
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={color} stopOpacity={active ? sweepStopOpacity : 0} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={wedge(c, R, -32, 0)} fill="url(#sweep)" />
          {active && <Path d={`M ${c} ${c} L ${c + R} ${c}`} stroke={color} strokeWidth={2} opacity={sweepLineOpacity} />}
        </Svg>
      </Animated.View>

      {/* Pulsing ring + center dot */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute', width: R, height: R, borderRadius: R / 2,
          borderWidth: 2, borderColor: color,
          opacity: active ? ringOpacity : 0,
          transform: [{ scale: ringScale }],
        }}
      />
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: color, opacity: dim }} />
    </View>
  )
}

// Wedge path from center spanning [startDeg, endDeg].
function wedge(c: number, r: number, startDeg: number, endDeg: number) {
  const s = (startDeg * Math.PI) / 180
  const e = (endDeg * Math.PI) / 180
  const x1 = c + r * Math.cos(s)
  const y1 = c + r * Math.sin(s)
  const x2 = c + r * Math.cos(e)
  const y2 = c + r * Math.sin(e)
  return `M ${c} ${c} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`
}
