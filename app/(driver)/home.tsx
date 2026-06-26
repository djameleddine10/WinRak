import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Dimensions, Pressable, StyleSheet, View } from 'react-native'
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
import { DEV_AUTH_BYPASS } from '../../constants/config'
import { useIsRTL } from '../../i18n/locale'

const { width: SCREEN_W } = Dimensions.get('window')
const RADAR_SIZE = Math.min(SCREEN_W * 0.86, 360)

export default function DriverHome() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
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
  const subscribeToOffers = useDriverStore((s) => s.subscribeToOffers)
  const driverStats     = useUserStore((s) => s.driverStats)
  const driverMock      = useUserStore((s) => s.driver)
  const channelRef      = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const locationSubRef  = useRef<{ remove: () => void } | null>(null)
  const pulseAnim       = useRef(new Animated.Value(1)).current
  const [drawer, setDrawer] = useState(false)
  const t = useT()

  const online = status !== 'offline'
  const requestOpen = useRef(false)

  // Pulse animation on the toggle when going online
  useEffect(() => {
    if (online) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
      ]).start()
    }
  }, [online])

  // The radar is the live link to passengers: when a request lands, open the
  // request modal exactly once. The guard prevents stacking duplicate modals if
  // the status briefly re-emits 'has_request' (the old phantom-navigation bug).
  useEffect(() => {
    if (status === 'has_request' && !requestOpen.current) {
      requestOpen.current = true
      router.push('/(driver)/incoming-request')
    } else if (status !== 'has_request') {
      requestOpen.current = false
    }
  }, [status])

  // Register push token once when the driver's profile is available.
  useEffect(() => {
    if (profile?.id) registerPushToken(profile.id).catch(() => {})
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
      if (profile?.id) setDriverStatus(profile.id, 'offline').catch(() => {})
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
      if (locationSubRef.current) { locationSubRef.current.remove(); locationSubRef.current = null }
    } else {
      if (profile?.id) {
        setOnline()
        setDriverStatus(profile.id, 'online').catch(() => {})

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
              }).catch(() => {})
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

          // Fetch passenger's real name and phone for driver screens
          const { data: passengerProfile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', trip.passenger_id)
            .maybeSingle()

          const pName = passengerProfile?.full_name ?? 'راكب'

          setOfferId(offer.id)
          setRealTripId(trip.id)
          setIncomingRide(({
            id:            trip.trip_code ?? trip.id,
            rideType:      'city',
            from:          { name: trip.from_address, address: trip.from_address, lat: trip.from_lat,  lng: trip.from_lng  },
            to:            { name: trip.to_address,   address: trip.to_address,   lat: trip.to_lat,    lng: trip.to_lng    },
            distance:      trip.distance_km   ?? 0,
            duration:      trip.duration_min  ?? 0,
            price:         trip.price         ?? 0,
            suggestedPrice: trip.price        ?? 0,
            vehicleType:   trip.vehicle_type  ?? 'sedan',
            paymentMethod: trip.payment_method ?? 'cash',
            status:        'pending',
            createdAt:     trip.created_at    ?? new Date().toISOString(),
            startedAt:     null as string | null,
            completedAt:   null as string | null,
            rating:        null as number | null,
            driverEta:     null as number | null,
            cancelReason:  null as string | null,
            departureDate: null as string | null,
            departureTime: null as string | null,
            luggageAllowed: false,
            driver:        null,
            passenger: {
              id:               trip.passenger_id,
              name:             pName,
              nameLatin:        pName,
              firstName:        pName,
              lastName:         '',
              avatar:           pName.charAt(0).toUpperCase(),
              phone:            passengerProfile?.phone ?? '',
              phoneMasked:      '',
              email:            '',
              rating:           4.8,
              totalRides:       0,
              gender:           'male',
              birthDate:        '',
              city:             '',
              photoStatus:      'missing' as const,
              registrationStep: 1,
              savedPlaces:      { home: null, work: null },
              wallet:           { balance: 0, points: 0 },
              paymentMethods:   [],
              emergencyContacts: [],
            },
          }) as any)
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

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            onPress={handleToggle}
            style={[styles.toggle, { backgroundColor: online ? Colors.success : Colors.dark3 }]}
          >
            <Icon name={online ? 'access-point' : 'power'} size={16} color={online ? Colors.pureWhite : Colors.muted} />
            <Txt weight="bold" size={15} color={online ? Colors.pureWhite : Colors.muted}>
              {online ? t('driver.online') : t('driver.offline')}
            </Txt>
          </Pressable>
        </Animated.View>

        <Pressable onPress={() => router.push('/(passenger)/settings')} style={styles.iconBtn} hitSlop={8}>
          <Icon name="cog" size={24} color={Colors.white} />
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
            onPress={subscribeToOffers}
            style={styles.devBtn}
            hitSlop={8}
          >
            <Txt size={12} color={Colors.dark1} weight="bold">تفعيل الاستقبال</Txt>
          </Pressable>
        )}
      </View>

      {/* Daily stats bar */}
      <View style={styles.statsBar}>
        <StatChip icon="car-multiple" label={t('driver.todayRides')} value={String(driverMock.stats.todayRides)} />
        <View style={styles.statsDivider} />
        <StatChip icon="clock-outline" label={t('driver.hoursOnline')} value={`${driverMock.stats.hoursOnline}h`} />
        <View style={styles.statsDivider} />
        <StatChip icon="cash" label={t('driver.todayIncome')} value={`${(driverMock.earnings.today).toLocaleString('en-US')}`} gold />
      </View>

      <DriverTabBar active="orders" />
      <SideDrawer visible={drawer} onClose={() => setDrawer(false)} />
    </View>
  )
}

function StatChip({ icon, label, value, gold }: { icon: string; label: string; value: string; gold?: boolean }) {
  const Colors = useColors()
  const isRTL = useIsRTL()
    return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Icon name={icon} size={18} color={gold ? Colors.gold : Colors.muted} />
      <Txt weight="bold" size={16} color={gold ? Colors.gold : Colors.white}>{value}</Txt>
      <Txt size={11} color={Colors.muted}>{label}</Txt>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    radarWrap: {
      backgroundColor: Colors.dark3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topBar: {
      flexDirection: row, alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.md,
    },
    iconBtn: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: Colors.dark3,
    },
    toggle: {
      flexDirection: row, alignItems: 'center', gap: Spacing.sm,
      borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.xl, paddingVertical: 10,
    },
    statsBar: {
      flexDirection: row, alignItems: 'center',
      backgroundColor: Colors.dark2, marginHorizontal: Spacing.screenPadding,
      borderRadius: Spacing.radiusMd, paddingVertical: Spacing.md,
      marginBottom: Spacing.sm,
    },
    statsDivider: { width: 1, height: 32, backgroundColor: Colors.dark3 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    sheBadge: { flexDirection: row, alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.purpleAlpha15, borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.md, paddingVertical: 6, marginBottom: Spacing.lg },
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
