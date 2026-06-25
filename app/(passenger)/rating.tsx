import { useMemo, useRef, useState } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { DriverCard } from '../../components/ride/DriverCard'
import { useRideStore } from '../../store/rideStore'
import { useRatingStore } from '../../store/ratingStore'
import { rateTrip } from '../../services/trips.service'
import { type TranslationKey } from '../../i18n/translations'

const COMPLIMENT_KEYS: TranslationKey[] = ['rating.c1', 'rating.c2', 'rating.c3', 'rating.c4', 'rating.c5', 'rating.c6']

export default function Rating() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const ride         = useRideStore((s) => s.currentRide)
  const reset        = useRideStore((s) => s.reset)
  const currentTripId = useRideStore((s) => s.currentTripId)
  const setDriverRating = useRatingStore((s) => s.setDriverRating)
  const resetRatings = useRatingStore((s) => s.reset)

  const [stars, setStars] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [comment, setComment] = useState('')

  function submit() {
    if (stars > 0) {
      setDriverRating(stars)
      if (currentTripId) {
        rateTrip({ tripId: currentTripId, passengerRating: stars })
          .catch(() => {})
      }
    }
    reset()
    resetRatings()
    router.replace('/(passenger)/(tabs)/home')
  }
  function toggle(c: string) {
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
        {ride && <DriverCard driver={ride.driver} compact />}

        <Txt weight="bold" size={16} center style={{ marginTop: Spacing.xl }}>{t('rating.howWas')}</Txt>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => <Star key={n} n={n} active={n <= stars} onPress={() => setStars(n)} />)}
        </View>

        {stars >= 4 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {COMPLIMENT_KEYS.map((key) => {
              const label = t(key)
              const on = selected.includes(label)
              return (
                <Pressable key={key} style={[styles.chip, on && styles.chipOn]} onPress={() => toggle(label)}>
                  <Txt size={12} color={on ? Colors.gold : Colors.muted}>{label}</Txt>
                </Pressable>
              )
            })}
          </ScrollView>
        )}

        <View style={{ marginTop: Spacing.lg }}>
          <Input placeholder={t('rating.commentPlaceholder')} value={comment} onChangeText={setComment} multiline />
        </View>

        <Txt size={12} color={Colors.muted} center style={{ marginTop: Spacing.md }}>{t('rating.reportIssue')}</Txt>
      </ScrollView>

      <View style={{ padding: Spacing.screenPadding, paddingBottom: insets.bottom + Spacing.md }}>
        <Button label={t('rating.submit')} onPress={submit} disabled={stars === 0} />
      </View>
    </View>
  )
}

function Star({ n, active, onPress }: { n: number; active: boolean; onPress: () => void }) {
  const Colors = useColors()
  const scale = useRef(new Animated.Value(1)).current
  function tap() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start()
    onPress()
  }
  return (
    <Pressable onPress={tap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Icon name={active ? 'star' : 'star-outline'} size={36} color={active ? Colors.gold : Colors.dark4} />
      </Animated.View>
    </Pressable>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding },
    stars: { flexDirection: 'row-reverse', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
    chipsRow: { flexDirection: 'row-reverse', marginTop: Spacing.lg },
    chip: { backgroundColor: Colors.dark3, borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginLeft: Spacing.sm, borderWidth: 1.5, borderColor: 'transparent' },
    chipOn: { borderColor: Colors.gold, backgroundColor: Colors.goldAlpha10 },
  })
}
