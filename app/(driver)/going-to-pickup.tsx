import { useEffect, useMemo, useRef, useState } from 'react'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { WebMap } from '../../components/map/WebMap'
import { useDriverStore } from '../../store/driverStore'
import { useT } from '../../hooks/useT'
import { usePassengerName } from '../../i18n/locale'
import { startTrip } from '../../services/trips.service'
import { getRouteInfo } from '../../services/route.service'
import { useDriverRouteSimulator } from '../../hooks/useDriverRouteSimulator'
import { ALGIERS_CENTER } from '../../mock/map'
import * as Location from 'expo-location'

export default function GoingToPickup() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const ride              = useDriverStore((s) => s.activeRide)
  const startRide         = useDriverStore((s) => s.startRide)
  const realTripId        = useDriverStore((s) => s.realTripId)
  const routeWaypoints    = useDriverStore((s) => s.routeWaypoints)
  const setRouteWaypoints = useDriverStore((s) => s.setRouteWaypoints)
  const [arrived, setArrived] = useState(false)
  const [etaSec, setEtaSec]   = useState<number | null>(null)
  const etaRef                = useRef<ReturnType<typeof setInterval> | null>(null)
  const t = useT()
  const passengerName = usePassengerName()

  const { position, heading } = useDriverRouteSimulator(routeWaypoints, !arrived)

  // Compute route from driver's current GPS (or Algiers center fallback) to pickup
  useEffect(() => {
    if (!ride) return
    const compute = (fromLat: number, fromLng: number) =>
      getRouteInfo(fromLat, fromLng, ride.from.lat, ride.from.lng)
        .then((info) => {
          setRouteWaypoints(info.waypoints)
          setEtaSec(info.durationMin * 60)
        })
        .catch(console.warn)

    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then(({ coords }) => compute(coords.latitude, coords.longitude))
      .catch(() => compute(ALGIERS_CENTER.lat, ALGIERS_CENTER.lng))
  }, [ride?.from.lat, ride?.from.lng])

  // ETA countdown
  useEffect(() => {
    if (etaSec === null || arrived) return
    etaRef.current = setInterval(() => {
      setEtaSec((s) => (s !== null && s > 1 ? s - 1 : 0))
    }, 1000)
    return () => { if (etaRef.current) clearInterval(etaRef.current) }
  }, [etaSec !== null, arrived])

  if (!ride) return null

  function callPassenger()    { Linking.openURL(`tel:${ride!.passenger.phone}`) }
  function messagePassenger() { Linking.openURL(`sms:${ride!.passenger.phone}`) }

  async function handleStartRide() {
    if (realTripId) startTrip(realTripId).catch(console.warn)
    startRide()
    router.replace('/(driver)/ride-active')
  }

  const etaMin = etaSec !== null ? Math.max(0, Math.ceil(etaSec / 60)) : null

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <WebMap
          route={routeWaypoints ?? []}
          markers={[
            { lat: position.lat, lng: position.lng, heading, type: 'car' },
            { lat: ride.from.lat, lng: ride.from.lng, type: 'pickup' },
          ]}
        />
        <View style={styles.eta}>
          <Txt size={12} weight="bold" color={Colors.dark1}>
            {etaMin !== null ? `${etaMin} ${t('common.min')}` : '—'}
          </Txt>
        </View>
      </View>

      <View style={[styles.card, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Badge label={t('pickup.badge')} variant="blue" />
        <View style={styles.passengerRow}>
          <Avatar initial={passengerName.charAt(0).toUpperCase()} size={40} />
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size={14}>{passengerName}</Txt>
            <Txt size={12} color={Colors.muted}>📍 {ride.from.address}</Txt>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={messagePassenger}>
            <Icon name="message-text" size={20} color={Colors.blue} />
            <Txt size={12}>{t('pickup.message')}</Txt>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={callPassenger}>
            <Icon name="phone" size={20} color={Colors.success} />
            <Txt size={12}>{t('pickup.call')}</Txt>
          </Pressable>
        </View>

        {!arrived ? (
          <Button label={t('pickup.arrived')} onPress={() => setArrived(true)} />
        ) : (
          <Button
            label={t('pickup.startRide')}
            variant="primary"
            style={{ backgroundColor: Colors.success }}
            onPress={handleStartRide}
          />
        )}
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    map:       { height: '58%' },
    eta: {
      position: 'absolute', bottom: Spacing.lg, alignSelf: 'center',
      backgroundColor: Colors.gold, borderRadius: Spacing.radiusFull,
      paddingHorizontal: Spacing.md, paddingVertical: 6,
    },
    card: {
      flex: 1, backgroundColor: Colors.dark2,
      borderTopLeftRadius: Spacing.radiusLg, borderTopRightRadius: Spacing.radiusLg,
      marginTop: -Spacing.radiusLg, padding: Spacing.screenPadding, gap: Spacing.md,
    },
    passengerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
    actions:      { flexDirection: 'row-reverse', gap: Spacing.sm },
    actionBtn: {
      flex: 1, height: 48, backgroundColor: Colors.dark3,
      borderRadius: Spacing.radiusMd, flexDirection: 'row-reverse',
      alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    },
  })
}
