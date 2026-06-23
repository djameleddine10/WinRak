import { useEffect, useMemo, useRef } from 'react'
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { useT } from '../../hooks/useT'

const NUM_RINGS = 3
const RING_DURATION = 2000
const RING_STAGGER = RING_DURATION / NUM_RINGS
const RING_SIZE = 140

export default function DriverSetupLoading() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const t = useT()
  const anims = useRef(
    Array.from({ length: NUM_RINGS }, () => new Animated.Value(0))
  ).current

  useEffect(() => {
    const loops = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * RING_STAGGER),
          Animated.timing(anim, {
            toValue: 1,
            duration: RING_DURATION,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay((NUM_RINGS - 1 - i) * RING_STAGGER),
        ])
      )
    )
    loops.forEach((l) => l.start())
    const timer = setTimeout(() => router.replace('/(driver)/driver-pending'), 3500)
    return () => {
      loops.forEach((l) => l.stop())
      clearTimeout(timer)
    }
  }, [anims])

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.close, { top: insets.top + Spacing.md }]}
        onPress={() => router.back()}
      >
        <Txt size={14} color={Colors.muted}>{t('driverSetup.close')}</Txt>
      </Pressable>

      <View style={styles.center}>
        <View style={styles.radarWrap}>
          {anims.map((anim, i) => {
            const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 2.8] })
            const opacity = anim.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.55, 0.3, 0] })
            return (
              <Animated.View
                key={i}
                style={[styles.ring, { borderColor: Colors.gold, transform: [{ scale }], opacity }]}
              />
            )
          })}
          <Txt weight="black" size={30} color={Colors.gold}>WinRak</Txt>
        </View>

        <Txt weight="bold" size={16} color={Colors.white} center style={{ marginTop: 48 }}>
          {t('driverSetup.preparing')}
        </Txt>
        <Txt size={14} color={Colors.muted} center style={{ marginTop: 6 }}>
          {t('driverSetup.sub')}
        </Txt>
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    close: { position: 'absolute', left: Spacing.xl, zIndex: 10 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    radarWrap: {
      width: RING_SIZE * 3,
      height: RING_SIZE * 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      position: 'absolute',
      width: RING_SIZE,
      height: RING_SIZE,
      borderRadius: RING_SIZE / 2,
      borderWidth: 1.5,
    },
  })
}
