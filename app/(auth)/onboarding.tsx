import { useMemo, useRef, useState } from 'react'
import { Dimensions, FlatList, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Button } from '../../components/ui/Button'
import { useT, type TFunction } from '../../hooks/useT'
import { useIsRTL } from '../../i18n/locale'

const { width: W } = Dimensions.get('window')

interface Slide {
  key: string
  illustration: React.ReactNode
  title: string
  sub: string
}

const PinArt = (Colors: Palette) => (
  <Svg width={120} height={120} viewBox="0 0 120 120">
    <Circle cx={60} cy={60} r={50} fill={Colors.goldAlpha10} />
    <Path d="M60 28 C48 28 38 38 38 50 C38 66 60 92 60 92 C60 92 82 66 82 50 C82 38 72 28 60 28 Z" fill={Colors.gold} />
    <Circle cx={60} cy={50} r={10} fill={Colors.dark1} />
  </Svg>
)

const ChatArt = (Colors: Palette) => (
  <Svg width={160} height={120} viewBox="0 0 160 120">
    <Rect x={20} y={28} width={120} height={64} rx={16} fill={Colors.dark4} />
    <Path d="M60 92 L48 110 L78 92 Z" fill={Colors.dark4} />
  </Svg>
)

const ShieldArt = (Colors: Palette) => (
  <Svg width={120} height={120} viewBox="0 0 120 120">
    <Path d="M60 20 L96 34 V62 C96 84 80 98 60 104 C40 98 24 84 24 62 V34 Z" fill={Colors.success} />
    <Path d="M44 60 L56 72 L80 46" stroke={Colors.pureWhite} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

function makeSlides(Colors: Palette, t: TFunction): Slide[] {
  return [
    { key: '1', illustration: PinArt(Colors),    title: t('onboarding.s1.title'), sub: t('onboarding.s1.sub') },
    { key: '2', illustration: ChatArt(Colors),   title: t('onboarding.s2.title'), sub: t('onboarding.s2.sub') },
    { key: '3', illustration: ShieldArt(Colors), title: t('onboarding.s3.title'), sub: t('onboarding.s3.sub') },
  ]
}

export default function Onboarding() {
  const Colors = useColors()
  const t = useT()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const slides = useMemo(() => makeSlides(Colors, t), [Colors, t])
  const insets = useSafeAreaInsets()
  const listRef = useRef<FlatList<Slide>>(null)
  const [index, setIndex] = useState(0)

  function next() {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 })
    } else {
      router.replace('/(auth)/login')
    }
  }

  return (
    <View style={styles.container}>
      <Pressable style={[styles.skip, { top: insets.top + Spacing.md }]} onPress={() => router.replace('/(auth)/login')}>
        <Txt size={13} color={Colors.muted}>{t('onboarding.skip')}</Txt>
      </Pressable>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / W))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: W }]}>
            <View style={styles.illustration}>{item.illustration}</View>
            <Txt weight="black" size={22} center>{item.title}</Txt>
            <Txt size={14} color={Colors.muted} center style={{ marginTop: Spacing.sm, paddingHorizontal: Spacing.xl }}>
              {item.sub}
            </Txt>
          </View>
        )}
        getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
      />

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]} />
        ))}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Button label={t(index === slides.length - 1 ? 'onboarding.start' : 'onboarding.next')} onPress={next} />
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    skip: { position: 'absolute', zIndex: 10, padding: 6, ...(isRTL ? { left: Spacing.xl } : { right: Spacing.xl }) },
    slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    illustration: {
      width: 240, height: 240, borderRadius: 24, backgroundColor: Colors.dark3,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxxl,
    },
    dots: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'center', gap: Spacing.sm, marginVertical: Spacing.xl },
    dot: { height: 8, borderRadius: 4 },
    dotActive: { width: 24, backgroundColor: Colors.gold },
    dotInactive: { width: 8, backgroundColor: Colors.dark4 },
    bottom: { paddingHorizontal: Spacing.screenPadding },
  })
}
