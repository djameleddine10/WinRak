import { useEffect, useMemo, useRef, useState } from 'react'
import { Dimensions, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { SideDrawer } from '../../components/layout/SideDrawer'
import { Radar } from '../../components/driver/Radar'
import { DriverTabBar } from '../../components/driver/DriverTabBar'
import { useExitOnBack } from '../../hooks/useExitOnBack'
import { useT } from '../../hooks/useT'
import { useDriverStore } from '../../store/driverStore'
import { useUserStore } from '../../store/userStore'
import * as Location from 'expo-location'
import { supabase } from '../../lib/supabase'
import { setDriverStatus, updateDriverLocation, subscribeToMyTripOffer } from '../../services/realtime.service'
import { registerPushToken } from '../../services/notifications.service'
import { mockRides } from '../../mock/rides'
import { DEV_AUTH_BYPASS } from '../../constants/config'

const { width: SCREEN_W } = Dimensions.get('window')
const RADAR_SIZE = Math.min(SCREEN_W * 0.86, 360)

export default function DriverHome() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const status = useDriverStore((s) => s.status)
  const goOnline = useDriverStore((s) => s.goOnline)
  const goOffline = useDriverStore((s) => s.goOffline)
  const sheService = useDriverStore((s) => s.sheService)
  const profile         = useUserStore((s) => s.profile)
  const setMode           = useUserStore((s) => s.setMode)
  const setOnline         = useDriverStore((s) => s.setOnline)
  const setIncomingRide   = useDriverStore((s) => s.setIncomingRide)
  const setRealTripId     = useDriverStore((s) => s.setRealTripId)
  const setOfferId        = useDriverStore((s) => s.setOfferId)
  const simulateRequest   = useDriverStore((s) => s.simulateRequest)
  const channelRef      = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const locationSubRef  = useRef<{ remove: () => void } | null>(null)
  const [drawer, setDrawer] = useState(false)
  const t = useT()

  const online = status !== 'offline'

  // The radar is the live link to passengers: when a request lands, jump to it.
  useEffect(() => {
    if (status === 'has_request') router.push('/(driver)/incoming-request')
  }, [status])

  // Register push token once when the driver's profile is available.
  useEffect(() => {
    if (profile?.id) registerPushToken(profile.id).catch(console.warn)
  }, [profile?.id])

  // Cleanup realtime channel and GPS subscription on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      if (locationSubRef.current) locationSubRef.current.remove()
    }
  }, [])

  async function handleToggle() {
    if (online) {
      goOffline()
      if (profile?.id) setDriverStatus(profile.id, 'offline').catch(console.warn)
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
      if (locationSubRef.current) { locationSubRef.current.remove(); locationSubRef.current = null }
    } else {
      if (profile?.id) {
        setOnline()
        setDriverStatus(profile.id, 'online').catch(console.warn)

        const { status: locStatus } = await Location.requestForegroundPermissionsAsync()
        if (locStatus === 'granted') {
          locationSubRef.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 50 },
            ({ coords }) => {
              updateDriverLocation({
                driverId: profile.id,
                lat:      coords.latitude,
                lng:      coords.longitude,
                heading:  coords.heading ?? 0,
                speed:    (coords.speed ?? 0) * 3.6,
              }).catch(console.warn)
            }
          )
        }
        channelRef.current = subscribeToMyTripOffer(profile.id, async (offer) => {
          // Fetch the trip details (RLS allows it because we have a pending offer)
          const { data: trip } = await supabase
            .from('trips')
            .select('*')
            .eq('id', offer.trip_id)
            .eq('status', 'pending')
            .maybeSingle()

          if (!trip) return  // offer already expired or trip taken

          // Fetch passenger's real name for display on driver screens
          const { data: passengerProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', trip.passenger_id)
            .maybeSingle()

          setOfferId(offer.id)
          setRealTripId(trip.id)
          setIncomingRide({
            ...mockRides[0],
            id:       trip.trip_code ?? trip.id,
            from:     { ...mockRides[0].from, address: trip.from_address, lat: trip.from_lat,  lng: trip.from_lng,  name: trip.from_address },
            to:       { ...mockRides[0].to,   address: trip.to_address,   lat: trip.to_lat,    lng: trip.to_lng,    name: trip.to_address },
            distance: trip.distance_km  ?? 0,
            duration: trip.duration_min ?? 0,
            price:    trip.price        ?? 0,
            passenger: {
              ...mockRides[0].passenger,
              rating:    4.8,
              name:      passengerProfile?.full_name ?? mockRides[0].passenger.name,
              nameLatin: passengerProfile?.full_name ?? mockRides[0].passenger.nameLatin,
            },
          })
        })
      } else {
        goOnline()
      }
    }
  }

  // Driver home is a root: back closes the drawer, then exits the app — it never
  // crosses back into passenger mode. Switching modes stays explicit (drawer button).
  useExitOnBack(() => {
    if (drawer) { setDrawer(false); return true }
    return false
  })

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => { setMode('driver'); setDrawer(true) }} style={styles.iconBtn} hitSlop={8}>
          <Icon name="menu" size={26} color={Colors.white} />
        </Pressable>

        <Pressable
          onPress={handleToggle}
          style={[styles.toggle, { backgroundColor: online ? Colors.success : Colors.danger }]}
        >
          <Icon name={online ? 'access-point' : 'power'} size={16} color={Colors.pureWhite} />
          <Txt weight="bold" size={15} color={Colors.pureWhite}>{online ? t('driver.online') : t('driver.offline')}</Txt>
        </Pressable>

        <Pressable onPress={() => router.push('/(passenger)/settings')} style={styles.iconBtn} hitSlop={8}>
          <Icon name="cog" size={24} color={Colors.white} />
          <View style={styles.gearDot} />
        </Pressable>
      </View>

      <View style={styles.center}>
        {sheService && (
          <View style={styles.sheBadge}>
            <Icon name="human-female" size={16} color={Colors.purple} />
            <Txt size={13} weight="bold" color={Colors.purple}>{t('driver.sheMode')}</Txt>
          </View>
        )}
        <Txt weight="bold" size={22} center style={styles.statusText}>
          {online ? t('driver.searching') : t('driver.offlineStatus')}
        </Txt>
        <View style={[styles.radarWrap, { width: RADAR_SIZE, height: RADAR_SIZE, borderRadius: RADAR_SIZE / 2 }]}>
          <Radar size={RADAR_SIZE} active={online} color={sheService ? Colors.purple : undefined} />
        </View>
        <Txt size={14} color={Colors.muted} center style={{ marginTop: Spacing.xl, paddingHorizontal: Spacing.xl }}>
          {online
            ? (sheService ? t('driver.radarSheHint') : t('driver.radarHint'))
            : t('driver.offlineHint')}
        </Txt>
        {DEV_AUTH_BYPASS && online && (
          <Pressable
            onPress={simulateRequest}
            style={styles.devBtn}
            hitSlop={8}
          >
            <Txt size={12} color={Colors.dark1} weight="bold">⚡ محاكاة طلب</Txt>
          </Pressable>
        )}
      </View>

      <DriverTabBar active="orders" />
      <SideDrawer visible={drawer} onClose={() => setDrawer(false)} />
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    radarWrap: {
      backgroundColor: Colors.dark3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topBar: {
      flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.md,
    },
    iconBtn: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: Colors.dark3,
    },
    toggle: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
      borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.xl, paddingVertical: 10,
    },
    gearDot: { position: 'absolute', top: 2, right: 2, width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.danger },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    sheBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.purpleAlpha15, borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.md, paddingVertical: 6, marginBottom: Spacing.lg },
    statusText: { marginBottom: Spacing.xxl, paddingHorizontal: Spacing.xl },
    devBtn: {
      marginTop: Spacing.lg,
      backgroundColor: Colors.gold,
      borderRadius: Spacing.radiusFull,
      paddingHorizontal: Spacing.xl,
      paddingVertical: 8,
    },
  })
}
