import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Txt } from './Txt'

interface SOSButtonProps {
  onSOSTrigger: () => void
  size?: number
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

// Large red button requiring a 3-second HOLD before firing (prevents accidents).
export function SOSButton({ onSOSTrigger, size = 120 }: SOSButtonProps) {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const progress = useRef(new Animated.Value(0)).current
  const [holding, setHolding] = useState(false)
  const firedRef = useRef(false)

  const stroke = 5
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const center = size / 2

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      if (value >= 1 && !firedRef.current) {
        firedRef.current = true
        onSOSTrigger()
      }
    })
    return () => progress.removeListener(id)
  }, [progress, onSOSTrigger])

  function start() {
    firedRef.current = false
    setHolding(true)
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start()
  }

  function cancel() {
    setHolding(false)
    if (!firedRef.current) {
      Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: false }).start()
    }
  }

  const dashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  })

  return (
    <Pressable onPressIn={start} onPressOut={cancel}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle cx={center} cy={center} r={r} stroke={Colors.dangerAlpha30} strokeWidth={stroke} fill="none" />
          <AnimatedCircle
            cx={center}
            cy={center}
            r={r}
            stroke={Colors.danger}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            rotation={-90}
            originX={center}
            originY={center}
          />
        </Svg>
        <View style={[styles.inner, { width: size - 28, height: size - 28, borderRadius: (size - 28) / 2 }]}>
          <Txt weight="black" size={Math.round(size * 0.27)} color={Colors.pureWhite} style={styles.label}>
            {holding ? '···' : 'SOS'}
          </Txt>
        </View>
      </View>
    </Pressable>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    inner: {
      backgroundColor: Colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      letterSpacing: 3,
    },
  })
}
