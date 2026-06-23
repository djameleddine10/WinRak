import { useEffect, useMemo, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { useT } from '../../hooks/useT'

export default function Splash() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const t = useT()
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 2500, useNativeDriver: false }).start()
    const timer = setTimeout(() => router.replace('/(auth)/onboarding'), 2500)
    return () => clearTimeout(timer)
  }, [progress])

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <View style={styles.logo}>
          <Txt weight="black" size={36} color={Colors.dark1}>W</Txt>
        </View>
        <Txt weight="black" size={32} style={{ marginTop: Spacing.lg }}>WinRak</Txt>
        <Txt weight="semibold" size={16} color={Colors.gold} style={{ marginTop: 4 }}>{t('splash.brandName')}</Txt>
        <Txt size={13} color={Colors.muted} style={{ marginTop: Spacing.sm }}>{t('splash.tagline')}</Txt>
      </View>

      <View style={styles.bottom}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width }]} />
        </View>
        <Txt size={11} color={Colors.muted} center style={{ marginTop: Spacing.lg }}>WinRak v1.0.0</Txt>
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1, justifyContent: 'space-between' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    logo: { width: 80, height: 80, borderRadius: 20, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
    bottom: { paddingHorizontal: Spacing.xxxl, paddingBottom: Spacing.xxxl },
    track: { height: 3, backgroundColor: Colors.dark3, borderRadius: 2, overflow: 'hidden' },
    fill: { height: 3, backgroundColor: Colors.gold },
  })
}
