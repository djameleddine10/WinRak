import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native'
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
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { WebMap } from '../../components/map/WebMap'
import { useDriverStore } from '../../store/driverStore'
import { useUserStore } from '../../store/userStore'
import { useT } from '../../hooks/useT'
import { usePassengerName } from '../../i18n/locale'
import { completeTrip } from '../../services/trips.service'
import { getRouteInfo } from '../../services/route.service'
import { updateDriverLocation } from '../../services/realtime.service'
import { useDriverRouteSimulator } from '../../hooks/useDriverRouteSimulator'
import * as Location from 'expo-location'
import { useIsRTL } from '../../i18n/locale'

export default function DriverRideActive() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const distanceUnit = useSettingsStore((s) => s.distanceUnit)
  const insets = useSafeAreaInsets()
  const ride              = useDriverStore((s) => s.activeRide)
  const completeRide      = useDriverStore((s) => s.completeRide)
  const realTripId        = useDriverStore((s) => s.realTripId)
  const routeWaypoints    = useDriverStore((s) => s.routeWaypoints)
  const setRouteWaypoints = useDriverStore((s) => s.setRouteWaypoints)
  const profile           = useUserStore((s) => s.profile)
  const [ended, setEnded] = useState(false)
  const [etaSec, setEtaSec] = useState<number | null>(null)
  const etaRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const t = useT()
  const cur = t('common.currency')
  const passengerName = usePassengerName()

  const { position, heading, progress } = useDriverRouteSimulator(routeWaypoints, !ended)

  // Broadcast real GPS so the passenger sees live position
  useEffect(() => {
    if (!profile?.id || ended) return
    let sub: Location.LocationSubscription | null = null
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 4000, distanceInterval: 8 },
      ({ coords }) => updateDriverLocation({
        driverId: profile.id,
        lat:      coords.latitude,
        lng:      coords.longitude,
        heading:  coords.heading ?? 0,
        speed:    coords.speed   ?? 0,
      }).catch(() => {}),
    ).then((s) => { sub = s }).catch(() => {})
    return () => { sub?.remove() }
  }, [profile?.id, ended])

  // Compute route from pickup to destination when ride starts
  useEffect(() => {
    if (!ride) return
    getRouteInfo(ride.from.lat, ride.from.lng, ride.to.lat, ride.to.lng)
      .then((info) => {
        setRouteWaypoints(info.waypoints)
        setEtaSec(info.durationMin * 60)
      })
      .catch(() => {})
  }, [ride?.from.lat, ride?.to.lat])

  // ETA countdown
  useEffect(() => {
    if (etaSec === null || ended) return
    etaRef.current = setInterval(() => {
      setEtaSec((s) => (s !== null && s > 1 ? s - 1 : 0))
    }, 1000)
    return () => { if (etaRef.current) clearInterval(etaRef.current) }
  }, [etaSec !== null, ended])

  if (!ride) return null

  function callPassenger()    { Linking.openURL(`tel:${ride!.passenger.phone}`) }
  function messagePassenger() { Linking.openURL(`sms:${ride!.passenger.phone}`) }

  function handleEndRide() {
    Alert.alert(
      t('rideActive.endConfirmTitle'),
      t('rideActive.endConfirmMsg'),
      [
        { text: t('rideActive.endConfirmNo'), style: 'cancel' },
        {
          text: t('rideActive.endConfirmYes'),
          style: 'destructive',
          onPress: async () => {
            setEnded(true)
            if (realTripId) completeTrip(realTripId).catch(() => {})
            completeRide()
            router.replace('/(driver)/rating')
          },
        },
      ],
    )
  }

  const etaMin       = etaSec !== null ? Math.max(0, Math.ceil(etaSec / 60)) : null
  const minRemaining = etaMin ?? Math.max(1, Math.round((1 - progress) * ride.duration))

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <WebMap
          route={routeWaypoints ?? []}
          markers={[
            { lat: position.lat, lng: position.lng, heading, type: 'car' },
            { lat: ride.to.lat,  lng: ride.to.lng,  type: 'dest' },
          ]}
        />
        <View style={styles.eta}>
          <Txt size={12} weight="bold" color={Colors.dark1}>
            {minRemaining} {t('common.min')}
          </Txt>
        </View>
      </View>

      <View style={[styles.card, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Badge label={t('rideActive.badge')} variant="green" />

        <View style={styles.passengerRow}>
          <Avatar initial={passengerName.charAt(0).toUpperCase()} size={40} />
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size={14}>{passengerName}</Txt>
            <View style={styles.metaRow}>
              <Icon name="star" size={13} color={Colors.gold} />
              <Txt size={12} color={Colors.gold}>{ride.passenger.rating}</Txt>
            </View>
          </View>
          <Txt weight="bold" size={18} color={Colors.gold}>
            {ride.price.toLocaleString('en-US')} {cur}
          </Txt>
        </View>

        <View style={styles.destRow}>
          <Icon name="map-marker" size={18} color={Colors.gold} />
          <Txt weight="bold" size={15}>{ride.to.name}</Txt>
        </View>
        <View style={styles.info}>
          <Txt size={13} color={Colors.muted}>{formatDistance(ride.distance, distanceUnit)}</Txt>
          <Txt size={13} color={Colors.muted}>{ride.duration} {t('common.min')}</Txt>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={messagePassenger}>
            <Icon name="message-text" size={20} color={Colors.blue} />
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={callPassenger}>
            <Icon name="phone" size={20} color={Colors.success} />
          </Pressable>
        </View>

        <Button
          label={t('rideActive.endRide')}
          style={{ backgroundColor: Colors.success }}
          onPress={handleEndRide}
        />
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
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
    passengerRow: { flexDirection: row, alignItems: 'center', gap: Spacing.md },
    metaRow:      { flexDirection: row, alignItems: 'center', gap: 4 },
    info:         { flexDirection: row, gap: Spacing.lg },
    destRow:      { flexDirection: row, alignItems: 'center', gap: Spacing.sm },
    actions:      { flexDirection: row, gap: Spacing.sm },
    actionBtn: {
      flex: 1, height: 48, backgroundColor: Colors.dark3,
      borderRadius: Spacing.radiusMd, alignItems: 'center', justifyContent: 'center',
    },
  })
}
