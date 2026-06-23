import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'
import Svg, { Circle, Ellipse, Line } from 'react-native-svg'
import * as Haptics from 'expo-haptics'

interface MapPinProps {
  moving: boolean
}

const GOLD   = '#ffbc07'
const INNER  = '#1a1a1a'   // dark pupil inside the gold circle

const W  = 44    // total SVG width
const HR = 16    // head radius
const CY = HR + 2
const STEM_BOTTOM = CY + HR + 28

export function MapPin({ moving }: MapPinProps) {
  const liftY       = useRef(new Animated.Value(0)).current
  const ringScaleX  = useRef(new Animated.Value(1)).current
  const ringOpacity = useRef(new Animated.Value(0.5)).current

  // Skip haptic on first mount (moving starts as false)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }

    if (moving) {
      Animated.parallel([
        Animated.timing(liftY,       { toValue: -13, duration: 130, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0.18, duration: 130, useNativeDriver: true }),
        Animated.timing(ringScaleX,  { toValue: 0.80, duration: 130, useNativeDriver: true }),
      ]).start()
    } else {
      // Drop + ring pulse + haptic
      Animated.parallel([
        Animated.spring(liftY, { toValue: 0, tension: 240, friction: 10, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(ringScaleX,  { toValue: 1.22, duration: 85,  useNativeDriver: true }),
          Animated.spring(ringScaleX,  { toValue: 1,    tension: 200, friction: 7, useNativeDriver: true }),
        ]),
        Animated.timing(ringOpacity, { toValue: 0.80, duration: 110, useNativeDriver: true }),
      ]).start()
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    }
  }, [moving])

  return (
    <View pointerEvents="none" style={{ alignItems: 'center' }}>

      {/* Pin head + stem — lifts when map moves */}
      <Animated.View style={{ transform: [{ translateY: liftY }] }}>
        <Svg width={W} height={STEM_BOTTOM + 4} viewBox={`0 0 ${W} ${STEM_BOTTOM + 4}`}>
          {/* Gold head circle */}
          <Circle cx={W / 2} cy={CY} r={HR} fill={GOLD} />
          {/* Dark inner dot */}
          <Circle cx={W / 2} cy={CY - 2} r={6} fill={INNER} />
          {/* Stem */}
          <Line
            x1={W / 2} y1={CY + HR}
            x2={W / 2} y2={STEM_BOTTOM}
            stroke={GOLD} strokeWidth={3} strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      {/* Ring — stays fixed, scaleX pulses on settle */}
      <Animated.View
        style={{
          marginTop: -5,
          transform: [{ scaleX: ringScaleX }],
          opacity: ringOpacity,
        }}
      >
        <Svg width={W} height={18} viewBox={`0 0 ${W} 18`}>
          <Ellipse
            cx={W / 2} cy={9}
            rx={15} ry={6}
            fill="none" stroke={GOLD} strokeWidth={2.5}
          />
        </Svg>
      </Animated.View>

    </View>
  )
}
