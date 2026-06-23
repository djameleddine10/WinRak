import { useEffect, useRef } from 'react'
import { Animated, Dimensions, StyleSheet, Text, useColorScheme, View } from 'react-native'

const { width: W, height: H } = Dimensions.get('window')

const GOLD     = '#ffbc07'
const GOLD_DIM = '#b87e00'   // darker gold for light mode rings
const MAX_R    = W * 0.44
const RADAR_CY = H * 0.40
const TEXT_TOP = RADAR_CY + MAX_R + 55
const LINE_TOP = TEXT_TOP + 108

const NUM      = 4           // rings in the air at once
const STAGGER  = 520         // ms between each ring emission
const DURATION = NUM * STAGGER + 400   // full expansion per ring

export function AnimatedSplash() {
  const scheme = useColorScheme()
  const isDark  = scheme !== 'light'
  const bg      = isDark ? '#22272b' : '#ffffff'
  const ringClr = isDark ? GOLD : GOLD_DIM

  const anims = useRef(
    Array.from({ length: NUM }, () => new Animated.Value(0))
  ).current

  useEffect(() => {
    const loops = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * STAGGER),
          Animated.timing(anim, {
            toValue: 1,
            duration: DURATION,
            useNativeDriver: true,
          }),
          // instant reset
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    )
    loops.forEach(l => l.start())
    return () => loops.forEach(l => l.stop())
  }, [])

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>

      {/* Pulsing radar rings — expand from center, fade out */}
      {anims.map((anim, i) => {
        const scale = anim.interpolate({
          inputRange:  [0, 1],
          outputRange: [0.04, 1],
        })
        const opacity = anim.interpolate({
          inputRange:  [0, 0.07, 0.72, 1],
          outputRange: [0, isDark ? 0.55 : 0.80, 0.08, 0],
        })
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.ring,
              {
                left:         W / 2 - MAX_R,
                top:          RADAR_CY - MAX_R,
                width:        MAX_R * 2,
                height:       MAX_R * 2,
                borderRadius: MAX_R,
                borderColor:  ringClr,
                borderWidth:  isDark ? 1.5 : 2.2,
                opacity,
                transform: [{ scale }],
              },
            ]}
          />
        )
      })}

      {/* Center dot */}
      <View
        style={[
          styles.dot,
          { left: W / 2 - 9, top: RADAR_CY - 9, backgroundColor: GOLD },
        ]}
      />

      {/* Wordmark */}
      <Text style={[styles.wordmark, { top: TEXT_TOP, color: GOLD }]}>
        WinRak
      </Text>

      {/* Full-width separator line */}
      <View
        style={[
          styles.line,
          { top: LINE_TOP, backgroundColor: isDark ? GOLD : GOLD_DIM, opacity: isDark ? 0.5 : 0.8 },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root:     { flex: 1 },
  ring:     { position: 'absolute' },
  dot:      { position: 'absolute', width: 18, height: 18, borderRadius: 9 },
  wordmark: {
    position:   'absolute',
    left: 0, right: 0,
    textAlign:  'center',
    fontWeight: '800',
    fontSize:   40,
    letterSpacing: 0.5,
  },
  line: {
    position: 'absolute',
    left: 0, right: 0,
    height: 1.2,
  },
})
