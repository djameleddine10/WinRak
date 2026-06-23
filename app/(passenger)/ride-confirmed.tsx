import { useEffect, useMemo, useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DriverCard } from '../../components/ride/DriverCard'
import { RideInfoRow } from '../../components/ride/RideInfoRow'
import { TripProgress } from '../../components/ride/TripProgress'
import { WebMap } from '../../components/map/WebMap'
import { useRideStore } from '../../store/rideStore'
import { mockRoutePoints } from '../../mock/map'
import { supabase } from '../../lib/supabase'
import { subscribeToTripStatus } from '../../services/realtime.service'
import { DEV_AUTH_BYPASS } from '../../constants/config'

const MOCK_ARRIVAL_SECONDS = 8  // simulate driver arriving after 8 s in mock mode

export default function RideConfirmed() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const ride           = useRideStore((s) => s.currentRide)
  const startRide      = useRideStore((s) => s.startRide)
  const currentTripId  = useRideStore((s) => s.currentTripId)
  const routeWaypoints = useRideStore((s) => s.routeWaypoints)
  const [countdown, setCountdown] = useState(MOCK_ARRIVAL_SECONDS)

  // Real mode: when the driver starts the ride (in_progress), auto-advance
  useEffect(() => {
    if (!currentTripId) return
    const channel = subscribeToTripStatus(currentTripId, (trip) => {
      if (trip.status === 'in_progress') {
        startRide()
        router.replace('/(passenger)/ride-active')
      }
    })
    return () => { supabase.removeChannel(channel) }
  }, [currentTripId])

  // Mock mode: countdown then auto-start the ride (simulates driver arriving)
  useEffect(() => {
    if (currentTripId) return  // real mode handles this via Supabase
    const iv = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(iv)
          startRide()
          router.replace('/(passenger)/ride-active')
          return 0
        }
        return n - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [currentTripId])

  if (!ride) return null

  function callDriver() {
    Linking.openURL(`tel:${ride!.driver.phone}`)
  }

  function messageDriver() {
    Linking.openURL(`sms:${ride!.driver.phone}`)
  }

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <WebMap
          route={routeWaypoints ?? mockRoutePoints.slice(0, 2)}
          markers={[
            { lat: ride.from.lat, lng: ride.from.lng, type: 'pin' },
            { lat: ride.to.lat,   lng: ride.to.lng,   type: 'dest' },
          ]}
        />
        <View style={styles.eta}>
          <Txt size={12} weight="bold" color={Colors.dark1}>
            {currentTripId ? t('ride.etaMinutes', { n: 3 }) : `${t('pickup.arrived')} ${countdown}s`}
          </Txt>
        </View>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Badge label={t('ride.confirmed')} variant="green" />
          <View style={{ height: Spacing.md }} />

          {/* Driver info + Appeler / Message */}
          <DriverCard
            driver={ride.driver}
            showActions
            onCall={callDriver}
            onMessage={messageDriver}
          />
          <View style={{ height: Spacing.md }} />

          {/* Trip chips: distance / duration / price */}
          <RideInfoRow distanceKm={ride.distance} durationMin={ride.driverEta ?? 3} price={ride.price} />
          <View style={{ height: Spacing.lg }} />

          {/* Progress bar — "Le chauffeur est en route" now fully visible */}
          <TripProgress progress={0.3} driverArriving />
          <View style={{ height: Spacing.lg }} />

          {/* SOS — prominent, full-width, clearly separated */}
          <Pressable style={styles.sosBtn} onPress={() => router.push('/(passenger)/sos')}>
            <Icon name="shield-check" size={22} color={Colors.pureWhite} />
            <Txt weight="bold" size={15} color={Colors.pureWhite}>{t('common.sos')}</Txt>
          </Pressable>
          <View style={{ height: Spacing.md }} />

          {/* Dev-only shortcut: skip waiting for driver (hidden in production) */}
          {DEV_AUTH_BYPASS && (
            <Button
              label={t('ride.startSim')}
              variant="ghost"
              onPress={() => { startRide(); router.replace('/(passenger)/ride-active') }}
            />
          )}
        </ScrollView>
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    map: { height: '52%' },
    eta: {
      position: 'absolute', bottom: Spacing.lg, alignSelf: 'center',
      backgroundColor: Colors.gold, borderRadius: Spacing.radiusFull,
      paddingHorizontal: Spacing.md, paddingVertical: 6,
    },
    sheet: {
      flex: 1, backgroundColor: Colors.dark2,
      borderTopLeftRadius: Spacing.radiusLg, borderTopRightRadius: Spacing.radiusLg,
      marginTop: -Spacing.radiusLg,
    },
    content: { padding: Spacing.screenPadding },
    sosBtn: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      height: 54,
      backgroundColor: Colors.danger,
      borderRadius: Spacing.radiusMd,
    },
  })
}
