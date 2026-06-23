import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/distance'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { PriceInput } from '../../components/ride/PriceInput'
import { useRef } from 'react'
import { useDriverStore } from '../../store/driverStore'
import { useUserStore } from '../../store/userStore'
import { useT } from '../../hooks/useT'
import { usePassengerName } from '../../i18n/locale'
import { acceptTrip, advanceTripOffer } from '../../services/trips.service'

export default function IncomingRequest() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const distanceUnit = useSettingsStore((s) => s.distanceUnit)
  const insets = useSafeAreaInsets()
  const t = useT()
  const cur = t('common.currency')
  const ride = useDriverStore((s) => s.incomingRide)
  const timer = useDriverStore((s) => s.timerSeconds)
  const acceptRide = useDriverStore((s) => s.acceptRide)
  const rejectRide      = useDriverStore((s) => s.rejectRide)
  const realTripId      = useDriverStore((s) => s.realTripId)
  const currentOfferId  = useDriverStore((s) => s.currentOfferId)
  const setOfferId      = useDriverStore((s) => s.setOfferId)
  const profile         = useUserStore((s) => s.profile)
  const passengerName   = usePassengerName()
  const didExpire       = useRef(false)
  const didLeave        = useRef(false)

  // Start the counter at the passenger's offered price. Once a ride arrives we
  // sync it (the first render can land before incomingRide is populated).
  const [counter, setCounter] = useState(ride?.price ?? 0)
  useEffect(() => {
    if (ride?.price) setCounter(ride.price)
  }, [ride?.price])

  // Safe one-shot dismissal back to the driver home. Guarded so a stray timer
  // tick or double-tap can never fire two navigations (the old bug).
  function leave() {
    if (didLeave.current) return
    didLeave.current = true
    router.back()
  }

  // When the countdown hits zero, release the offer and dismiss the modal exactly
  // once. router.back() pops this transparentModal off the driver stack — it never
  // crosses into passenger mode.
  useEffect(() => {
    if (timer > 0 || didExpire.current) return
    didExpire.current = true
    if (currentOfferId) {
      advanceTripOffer(currentOfferId, 'expired').catch(console.warn)
      setOfferId(null)
    }
    const navTimeout = setTimeout(leave, 400)
    return () => clearTimeout(navTimeout)
  }, [timer])

  function accept() {
    if (didLeave.current) return
    didLeave.current = true
    if (realTripId && profile?.id) {
      acceptTrip(realTripId, profile.id).catch((e) => console.warn('[WinRak] acceptTrip:', e))
    }
    if (currentOfferId) setOfferId(null)
    acceptRide()
    router.replace('/(driver)/going-to-pickup')
  }

  function reject() {
    if (currentOfferId) {
      advanceTripOffer(currentOfferId, 'rejected').catch(console.warn)
      setOfferId(null)
    }
    rejectRide()
    leave()
  }

  if (!ride) {
    return (
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <Txt center color={Colors.muted}>{t('driver.noRequest')}</Txt>
          <Button label={t('common.close')} variant="ghost" onPress={leave} />
        </View>
      </View>
    )
  }

  const pct = Math.max(0, timer / 20) * 100
  const danger = timer < 5

  return (
    <View style={styles.backdrop}>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.track}><View style={[styles.fill, { width: `${pct}%`, backgroundColor: danger ? Colors.danger : Colors.gold }]} /></View>
        <Txt size={11} color={Colors.muted} style={{ alignSelf: 'flex-start', marginBottom: Spacing.sm }}>{t('driver.seconds', { n: Math.max(0, timer) })}</Txt>

        <View style={styles.passengerRow}>
          <Avatar initial={passengerName.charAt(0).toUpperCase()} size={48} />
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size={14}>{passengerName}</Txt>
            <View style={styles.metaRow}>
              <Icon name="star" size={13} color={Colors.gold} />
              <Txt size={12} color={Colors.gold}>{ride.passenger.rating}</Txt>
            </View>
          </View>
        </View>

        <View style={styles.tripCard}>
          <TripRow icon="map-marker" label={t('driver.departure')} value={ride.from.address} />
          <TripRow icon="flag" label={t('driver.destination')} value={ride.to.address} />
          <View style={styles.tripMeta}>
            <Txt size={12} color={Colors.muted}>🚗 {formatDistance(ride.distance, distanceUnit)}</Txt>
            <Txt size={12} color={Colors.muted}>⏱️ {ride.duration} {t('common.min')}</Txt>
          </View>
        </View>

        <Txt size={12} color={Colors.muted} style={{ marginTop: Spacing.md }}>{t('driver.offeredPrice')}</Txt>
        <Txt weight="black" size={28} color={Colors.gold}>{ride.price.toLocaleString('en-US')} {cur}</Txt>

        <Txt size={13} style={{ marginTop: Spacing.sm, marginBottom: Spacing.sm }}>{t('driver.suggestPrice')}</Txt>
        <PriceInput value={counter} onChange={setCounter} compact suggestedPrices={[ride.price - 50, ride.price, ride.price + 50, ride.price + 100]} />

        <View style={styles.actions}>
          <View style={{ flex: 1 }}><Button label={t('driver.reject')} variant="ghost" style={styles.rejectBtn} onPress={reject} /></View>
          <View style={{ flex: 1 }}><Button label={t('driver.accept')} onPress={accept} /></View>
        </View>
      </View>
    </View>
  )
}

function TripRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  return (
    <View style={styles.tripRow}>
      <Icon name={icon} size={16} color={Colors.gold} />
      <Txt size={12} color={Colors.muted}>{label}:</Txt>
      <Txt size={12} style={{ flex: 1 }} numberOfLines={1}>{value}</Txt>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: Colors.dark2, borderTopLeftRadius: Spacing.radiusLg, borderTopRightRadius: Spacing.radiusLg, padding: Spacing.screenPadding },
    track: { height: 4, backgroundColor: Colors.dark3, borderRadius: 2, overflow: 'hidden', marginTop: Spacing.sm },
    fill: { height: 4 },
    passengerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
    metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
    tripCard: { backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd, padding: Spacing.md, gap: Spacing.sm, marginTop: Spacing.md },
    tripRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
    tripMeta: { flexDirection: 'row-reverse', gap: Spacing.lg, marginTop: 4 },
    actions: { flexDirection: 'row-reverse', gap: Spacing.md, marginTop: Spacing.lg },
    rejectBtn: { backgroundColor: Colors.dark3 },
  })
}
