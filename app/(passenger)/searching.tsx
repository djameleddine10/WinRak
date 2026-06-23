import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Button } from '../../components/ui/Button'
import { RadarSearch } from '../../components/ui/RadarSearch'
import { useRideStore } from '../../store/rideStore'
import { mockRides } from '../../mock/rides'
import { supabase } from '../../lib/supabase'
import { subscribeToTripStatus } from '../../services/realtime.service'
import { getTripDriverInfo } from '../../services/trips.service'

export default function Searching() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const status         = useRideStore((s) => s.status)
  const searchTimer    = useRideStore((s) => s.searchTimer)
  const offeredPrice   = useRideStore((s) => s.offeredPrice)
  const currentTripId  = useRideStore((s) => s.currentTripId)
  const from           = useRideStore((s) => s.from)
  const to             = useRideStore((s) => s.to)
  const cancelRide     = useRideStore((s) => s.cancelRide)
  const setStatus      = useRideStore((s) => s.setStatus)
  const setCurrentRide = useRideStore((s) => s.setCurrentRide)

  // Real mode: Supabase dispatch has no fixed countdown, so we animate a cycling
  // progress bar (30 s cycles) so the screen doesn't feel frozen.
  const [realTimer, setRealTimer] = useState(30)
  useEffect(() => {
    if (!currentTripId) return
    setRealTimer(30)
    const iv = setInterval(() => {
      setRealTimer((s) => s <= 1 ? 30 : s - 1)
    }, 1000)
    return () => clearInterval(iv)
  }, [currentTripId])

  // Real mode: subscribe to trip status changes
  useEffect(() => {
    if (!currentTripId) return

    const channel = subscribeToTripStatus(currentTripId, async (trip) => {
      if (trip.status === 'accepted' && trip.driver_id) {
        const driverInfo = await getTripDriverInfo(trip.id).catch(() => null)
        setCurrentRide({
          ...mockRides[0],
          id:       trip.trip_code ?? trip.id,
          from:     from ?? mockRides[0].from,
          to:       to   ?? mockRides[0].to,
          price:    trip.price,
          distance: trip.distance_km ?? mockRides[0].distance,
          duration: trip.duration_min ?? mockRides[0].duration,
          driver: {
            ...mockRides[0].driver,
            id:      trip.driver_id,
            name:    driverInfo?.full_name  ?? mockRides[0].driver.name,
            phone:   driverInfo?.phone      ?? mockRides[0].driver.phone,
            rating:  driverInfo?.rating     ?? mockRides[0].driver.rating,
            vehicle: {
              ...mockRides[0].driver.vehicle,
              brand: driverInfo?.vehicle_make  ?? mockRides[0].driver.vehicle.brand,
              model: driverInfo?.vehicle_model ?? mockRides[0].driver.vehicle.model,
              plate: driverInfo?.vehicle_plate ?? mockRides[0].driver.vehicle.plate,
            },
          },
        })
        setStatus('driver_found')
      } else if (trip.status === 'cancelled') {
        cancelRide()
        router.replace('/(passenger)/(tabs)/home')
      }
    })

    return () => { supabase.removeChannel(channel) }
  }, [currentTripId])

  useEffect(() => {
    if (status === 'driver_found') router.replace('/(passenger)/ride-confirmed')
  }, [status])

  const pct = currentTripId
    ? Math.max(0, realTimer / 30) * 100
    : Math.max(0, searchTimer / 20) * 100
  const displaySeconds = currentTripId ? realTimer : Math.max(0, searchTimer)

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <RadarSearch size={260} />
        <Txt weight="bold" size={16} center style={{ marginTop: Spacing.lg }}>{t('searching.title')}</Txt>
        <Txt size={13} color={Colors.muted} center style={{ marginTop: 4 }}>{t('searching.sub')}</Txt>
        <Txt weight="bold" size={18} color={Colors.gold} center style={{ marginTop: Spacing.md }}>
          {t('searching.offered', { price: offeredPrice.toLocaleString('en-US'), currency: t('common.currency') })}
        </Txt>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
        <Txt size={12} color={Colors.muted} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
          {t('driver.seconds', { n: displaySeconds })}
        </Txt>
      </View>

      <View style={styles.actions}>
        <Button label={t('searching.editOffer')} variant="outline" onPress={() => router.back()} />
        <Button label={t('searching.cancel')} variant="ghost" onPress={() => { cancelRide(); router.replace('/(passenger)/(tabs)/home') }} />
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1, justifyContent: 'center', padding: Spacing.screenPadding },
    card: { backgroundColor: Colors.dark2, borderRadius: Spacing.radiusLg, padding: Spacing.xxl, alignItems: 'center' },
    track: { width: '100%', height: 4, backgroundColor: Colors.dark3, borderRadius: 2, marginTop: Spacing.lg, overflow: 'hidden' },
    fill: { height: 4, backgroundColor: Colors.gold },
    actions: { gap: Spacing.sm, marginTop: Spacing.xl },
  })
}
