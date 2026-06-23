import { useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'
import { useColors } from '../../hooks/useColors'
import { Txt } from './Txt'

const CYCLE = 2400
const DELAY_STEP = CYCLE / 3

function RadarRing({ size, startDelay }: { size: number; startDelay: number }) {
  const Colors = useColors()
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined
    const t = setTimeout(() => {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: CYCLE - 100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(100),
        ]),
      )
      loop.start()
    }, startDelay)

    return () => {
      clearTimeout(t)
      loop?.stop()
    }
  }, [anim, startDelay])

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] })
  const opacity = anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.8, 0.5, 0] })

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: Colors.gold,
        transform: [{ scale }],
        opacity,
      }}
    />
  )
}

interface RadarSearchProps {
  size?: number
}

export function RadarSearch({ size = 280 }: RadarSearchProps) {
  const Colors = useColors()

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <RadarRing size={size} startDelay={0} />
      <RadarRing size={size} startDelay={DELAY_STEP} />
      <RadarRing size={size} startDelay={DELAY_STEP * 2} />

      <Txt weight="black" size={38} color={Colors.gold} style={{ letterSpacing: 1 }}>
        WinRak
      </Txt>
    </View>
  )
}
