import { useMemo, useRef, useState } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, View, Modal } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Avatar } from '../../components/ui/Avatar'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useDriverStore } from '../../store/driverStore'
import { useRatingStore } from '../../store/ratingStore'
import { useRideStore } from '../../store/rideStore'
import { usePassengerName } from '../../i18n/locale'
import { type TranslationKey } from '../../i18n/translations'
import { rateTrip } from '../../services/trips.service'
import { useIsRTL } from '../../i18n/locale'

const COMPLIMENT_KEYS: TranslationKey[] = ['rating.p1', 'rating.p2', 'rating.p3', 'rating.p4', 'rating.p5']

export default function DriverRating() {
  const Colors = useColors()
  const isRTL = useIsRTL()
    const t = useT()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets = useSafeAreaInsets()
  const completeRide            = useDriverStore((s) => s.completeRide)
  const realTripId              = useDriverStore((s) => s.realTripId)
  const setPassengerRating      = useRatingStore((s) => s.setPassengerRating)
  const driverRatingByPassenger = useRatingStore((s) => s.driverRatingByPassenger)
  const passengerName           = usePassengerName()

  const activeRide = useDriverStore((s) => s.activeRide)
  const [stars, setStars] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [showEarnings, setShowEarnings] = useState(false)
  const earningsScale = useRef(new Animated.Value(0)).current

  function toggle(c: string) {
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  function submit() {
    if (stars > 0) {
      setPassengerRating(stars)
      if (realTripId) {
        rateTrip({ tripId: realTripId, driverRating: stars }).catch(() => {})
      }
    }
    // Show earnings summary for 2 s then go home
    setShowEarnings(true)
    earningsScale.setValue(0)
    Animated.spring(earningsScale, { toValue: 1, friction: 5, useNativeDriver: true }).start()
    setTimeout(() => {
      completeRide()
      router.replace('/(driver)/home')
    }, 2200)
  }

  const earnedAmount = activeRide?.price ?? 0
  const driverNet    = Math.round(earnedAmount * 0.88)
  const cur          = t('common.currency')

  return (
    <View style={styles.container}>

      {/* Earnings flash modal */}
      <Modal transparent visible={showEarnings} animationType="fade">
        <View style={styles.earningsOverlay}>
          <Animated.View style={[styles.earningsCard, { transform: [{ scale: earningsScale }] }]}>
            <Icon name="check-circle" size={52} color={Colors.success} />
            <Txt weight="black" size={22} center style={{ marginTop: Spacing.md }}>
              {t('rideActive.badge')}
            </Txt>
            <Txt weight="black" size={36} color={Colors.gold} center style={{ marginTop: Spacing.sm }}>
              +{driverNet.toLocaleString('en-US')} {cur}
            </Txt>
            <Txt size={13} color={Colors.muted} center style={{ marginTop: 4 }}>
              {t('earnings.netEarnings')}
            </Txt>
          </Animated.View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
        {/* Passenger avatar + name */}
        <View style={styles.passengerCard}>
          <Avatar initial={passengerName.charAt(0).toUpperCase()} size={56} showBorder />
          <View style={styles.cardInfo}>
            <Txt weight="bold" size={16}>{passengerName}</Txt>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Icon key={n} name="star" size={12} color={Colors.gold} />
              ))}
              <Txt size={12} color={Colors.muted}>4.8</Txt>
            </View>
          </View>
        </View>

        <Txt weight="bold" size={16} center style={{ marginTop: Spacing.xl }}>
          {t('rating.howWasPassenger')}
        </Txt>

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
          <Input
            placeholder={t('rating.commentPlaceholder')}
            value={comment}
            onChangeText={setComment}
            multiline
          />
        </View>

        {/* Show the rating the passenger gave the driver (bidirectional connection) */}
        {driverRatingByPassenger !== null && (
          <View style={styles.receivedRating}>
            <Icon name="information-outline" size={14} color={Colors.gold} />
            <Txt size={12} color={Colors.muted} style={{ flex: 1 }}>
              {t('rating.howWas')} —{' '}
              {Array.from({ length: driverRatingByPassenger }, (_, i) => '⭐').join('')}
            </Txt>
          </View>
        )}

        <Txt size={12} color={Colors.muted} center style={{ marginTop: Spacing.md }}>
          {t('rating.reportIssue')}
        </Txt>
      </ScrollView>

      <View style={{ padding: Spacing.screenPadding, paddingBottom: insets.bottom + Spacing.md }}>
        <Button label={t('rating.submit')} onPress={submit} disabled={stars === 0} />
      </View>
    </View>
  )
}

function Star({ n, active, onPress }: { n: number; active: boolean; onPress: () => void }) {
  const Colors = useColors()
  const isRTL = useIsRTL()
    const scale = useRef(new Animated.Value(1)).current
  function tap() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,   duration: 100, useNativeDriver: true }),
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

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding },
    earningsOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
      alignItems: 'center', justifyContent: 'center',
    },
    earningsCard: {
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusLg,
      padding: Spacing.xxl, alignItems: 'center', marginHorizontal: Spacing.xxl,
      borderWidth: 1.5, borderColor: Colors.goldAlpha15,
    },
    passengerCard: { flexDirection: row, alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.md },
    cardInfo: { flex: 1, gap: 4 },
    starRow: { flexDirection: row, alignItems: 'center', gap: 2 },
    stars: { flexDirection: row, justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
    chipsRow: { flexDirection: row, marginTop: Spacing.lg },
    chip: { backgroundColor: Colors.dark3, borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginLeft: Spacing.sm, borderWidth: 1.5, borderColor: 'transparent' },
    chipOn: { borderColor: Colors.gold, backgroundColor: Colors.goldAlpha10 },
    receivedRating: { flexDirection: row, alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.goldAlpha10, borderRadius: Spacing.radiusMd, padding: Spacing.md, marginTop: Spacing.lg },
  })
}
