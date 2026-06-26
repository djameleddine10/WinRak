import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/distance'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ActionRow } from '../../components/ride/ActionRow'
import { WebMap } from '../../components/map/WebMap'
import { useRideStore } from '../../store/rideStore'
import { useDriverRouteSimulator } from '../../hooks/useDriverRouteSimulator'
import { supabase } from '../../lib/supabase'
import { subscribeToTripStatus, subscribeToDriverLocation } from '../../services/realtime.service'
import { DEV_AUTH_BYPASS } from '../../constants/config'
import { useIsRTL } from '../../i18n/locale'

export default function RideActive() {
  const Colors = useColors()
  const isRTL = useIsRTL()
    const t = useT()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets = useSafeAreaInsets()
  const ride            = useRideStore((s) => s.currentRide)
  const completeRide    = useRideStore((s) => s.completeRide)
  const currentTripId   = useRideStore((s) => s.currentTripId)
  const routeWaypoints  = useRideStore((s) => s.routeWaypoints)
  const distanceUnit    = useSettingsStore((s) => s.distanceUnit)
  const [realDriverPos, setRealDriverPos] = useState<{ lat: number; lng: number; heading: number } | null>(null)
  // Fallback: animate along the real OSRM route when no live GPS yet
  const { position: simPos, heading: simHeading, progress } = useDriverRouteSimulator(routeWaypoints, !realDriverPos)

  // Real mode: subscribe to trip status — driver completing → navigate
  useEffect(() => {
    if (!currentTripId) return
    const channel = subscribeToTripStatus(currentTripId, (trip) => {
      if (trip.status === 'completed') {
        completeRide()
        router.replace('/(passenger)/ride-completed')
      }
    })
    return () => { supabase.removeChannel(channel) }
  }, [currentTripId])

  // Subscribe to driver's live GPS position
  useEffect(() => {
    const driverId = ride?.driver?.id
    if (!driverId) return
    const channel = subscribeToDriverLocation(driverId, (lat, lng, heading) => {
      setRealDriverPos({ lat, lng, heading })
    })
    return () => { supabase.removeChannel(channel) }
  }, [ride?.driver?.id])

  // Mock mode only: auto-complete when simulator finishes
  useEffect(() => {
    if (currentTripId) return   // real mode: wait for Supabase
    if (progress >= 1) {
      const timer = setTimeout(() => { completeRide(); router.replace('/(passenger)/ride-completed') }, 1200)
      return () => clearTimeout(timer)
    }
  }, [progress, currentTripId])

  const carPos = realDriverPos ?? { lat: simPos.lat, lng: simPos.lng, heading: simHeading }

  if (!ride) return null

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <WebMap
          route={routeWaypoints ?? []}
          markers={[
            { lat: carPos.lat, lng: carPos.lng, heading: carPos.heading, type: 'car' },
            { lat: ride.to.lat, lng: ride.to.lng, type: 'dest' },
          ]}
        />
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Badge label={t('ride.active')} variant="green" />

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
        </View>

        {/* Destination row */}
        <View style={styles.destRow}>
          <Icon name="map-marker" size={18} color={Colors.gold} />
          <Txt weight="bold" size={15} style={{ flex: 1 }} numberOfLines={1}>{ride.to.name}</Txt>
        </View>

        {/* Time + distance remaining */}
        <View style={styles.metaRow}>
          <Icon name="clock-outline" size={14} color={Colors.muted} />
          <Txt size={13} color={Colors.muted}>
            {t('ride.minLeft', { n: Math.max(1, Math.round((1 - progress) * ride.duration)) })}
          </Txt>
          <Txt size={13} color={Colors.muted}> · </Txt>
          <Icon name="map-marker-distance" size={14} color={Colors.muted} />
          <Txt size={13} color={Colors.muted}>
            {formatDistance(Math.max(0.1, (1 - progress) * ride.distance), distanceUnit)}
          </Txt>
        </View>

        <Txt weight="bold" size={18} color={Colors.gold} style={{ marginTop: Spacing.sm }}>
          {ride.price.toLocaleString('en-US')} {t('common.currency')}
        </Txt>
        <View style={{ height: Spacing.md }} />
        <ActionRow onSOS={() => router.push('/(passenger)/sos')} />
        {DEV_AUTH_BYPASS && (
          <>
            <View style={{ height: Spacing.md }} />
            <Button label={t('ride.endSim')} variant="outline" onPress={() => { completeRide(); router.replace('/(passenger)/ride-completed') }} />
          </>
        )}
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    map: { height: '64%' },
    sheet: {
      flex: 1, backgroundColor: Colors.dark2,
      borderTopLeftRadius: Spacing.radiusLg, borderTopRightRadius: Spacing.radiusLg,
      marginTop: -Spacing.radiusLg, padding: Spacing.screenPadding,
    },
    progressTrack: {
      height: 4, backgroundColor: Colors.dark3, borderRadius: 2,
      overflow: 'hidden', marginVertical: Spacing.md,
    },
    progressFill: {
      height: 4, backgroundColor: Colors.gold, borderRadius: 2,
    },
    destRow: {
      flexDirection: row, alignItems: 'center', gap: Spacing.sm,
    },
    metaRow: {
      flexDirection: row, alignItems: 'center', gap: 4, marginTop: 4,
    },
  })
}
