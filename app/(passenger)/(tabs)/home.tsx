import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import * as Location from 'expo-location'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import { router } from 'expo-router'
import { type Palette } from '../../../constants/colors'
import { useColors } from '../../../hooks/useColors'
import { Spacing } from '../../../constants/spacing'
import { Txt } from '../../../components/ui/Txt'
import { Icon } from '../../../components/ui/Icon'
import { Card } from '../../../components/ui/Card'
import { TopBar } from '../../../components/layout/TopBar'
import { SideDrawer } from '../../../components/layout/SideDrawer'
import { WebMap } from '../../../components/map/WebMap'
import { useUserStore } from '../../../store/userStore'
import { useRideStore } from '../../../store/rideStore'
import { useMapStore } from '../../../store/mapStore'
import { useLocation } from '../../../hooks/useLocation'
import { useT } from '../../../hooks/useT'
import { usePassengerName } from '../../../i18n/locale'
import { DirIcon } from '../../../components/ui/DirIcon'
import { useDriverAnimation } from '../../../hooks/useDriverAnimation'
import { registerPushToken } from '../../../services/notifications.service'
import { getMyTrips } from '../../../services/trips.service'

export default function Home() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const displayName = usePassengerName()
  const photoStatus = useUserStore((s) => s.photoStatus)
  const profile = useUserStore((s) => s.profile)
  const setRideMode = useUserStore((s) => s.setRideMode)
  const setSheMode = useRideStore((s) => s.setSheMode)
  const setVehicleType = useRideStore((s) => s.setVehicleType)
  const setTo = useRideStore((s) => s.setTo)
  const rideHistory    = useRideStore((s) => s.rideHistory)
  const setRideHistory = useRideStore((s) => s.setRideHistory)
  const mapDrivers     = useMapStore((s) => s.mapDrivers)

  // Unique recent destinations from past rides (most recent first)
  const recentDestinations = useMemo(() => {
    const seen = new Set<string>()
    const out: { name: string; address: string; lat: number; lng: number }[] = []
    for (const r of rideHistory) {
      const d = r.to
      if (!d || seen.has(d.name)) continue
      seen.add(d.name)
      out.push(d)
      if (out.length >= 4) break
    }
    return out
  }, [rideHistory])

  function openRecent(dest: { name: string; address: string; lat: number; lng: number }) {
    setSheMode(false)
    setVehicleType('sedan')
    setRideMode('city')
    setTo(dest)
    router.push('/(passenger)/search')
  }
  const { errorMsg } = useLocation()
  const t = useT()

  // Register this device for push notifications once the passenger is known.
  useEffect(() => {
    if (profile?.id) registerPushToken(profile.id).catch(() => {})
  }, [profile?.id])

  // Load real ride history for recent destinations
  useEffect(() => {
    if (!profile?.id) return
    getMyTrips(profile.id, 'passenger', 20)
      .then((trips) => {
        const rides = trips.map((t: any) => ({
          id:            t.id,
          rideType:      'city' as const,
          from:          { name: t.from_address ?? '', address: t.from_address ?? '', lat: t.from_lat ?? 0, lng: t.from_lng ?? 0 },
          to:            { name: t.to_address   ?? '', address: t.to_address   ?? '', lat: t.to_lat   ?? 0, lng: t.to_lng   ?? 0 },
          price:         t.price         ?? 0,
          suggestedPrice: t.price        ?? 0,
          distance:      t.distance_km   ?? 0,
          duration:      t.duration_min  ?? 0,
          status:        t.status        ?? 'completed',
          vehicleType:   t.vehicle_type  ?? 'sedan',
          paymentMethod: t.payment_method ?? 'cash',
          createdAt:     t.created_at,
          startedAt:     t.started_at    ?? null,
          completedAt:   t.completed_at  ?? null,
          rating:        null,
          driverEta:     null,
          cancelReason:  t.cancel_reason ?? null,
          departureDate: null,
          departureTime: null,
          luggageAllowed: false,
          passenger:     { id: t.passenger_id ?? '', name: '', nameLatin: '', firstName: '', lastName: '', avatar: '', phone: '', phoneMasked: '', email: '', rating: 5, totalRides: 0, gender: 'male', birthDate: '', city: '', photoStatus: 'missing', registrationStep: 1, savedPlaces: { home: null, work: null }, wallet: { balance: 0, points: 0 }, paymentMethods: [], emergencyContacts: [] },
          driver:        { id: t.driver_id ?? '', name: '', nameLatin: '', avatar: '', phone: '', rating: 0, totalRides: 0, isVerified: true, isSheDriver: false, registrationStatus: 'approved', driverType: 'city', level: 'standard', vehicle: { type: 'sedan', brand: '', model: '', modelKey: 'veh.m301', color: '', colorKey: 'veh.colorWhite', plate: '', year: 0, seats: 4 }, documents: { licenseNumber: '', licenseExpiry: '', grayCardNumber: '', birthPlace: '' }, location: { lat: 0, lng: 0 }, heading: 0, isOnline: false, earnings: { today: 0, week: 0, month: 0 } },
        }))
        setRideHistory(rides as any)
      })
      .catch(() => {})
  }, [profile?.id])

  // Animate mock drivers on the home map so it feels alive
  useDriverAnimation()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null)

  async function locateMe() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setFlyTarget({ lat: coords.latitude, lng: coords.longitude })
      setTimeout(() => setFlyTarget(null), 200)
    } catch { /* GPS unavailable */ }
  }
  const sheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['46%', '60%'], [])

  function openCity() {
    setSheMode(false)
    setVehicleType('sedan')
    setRideMode('city')
    router.push('/(passenger)/search')
  }
  function openShe() {
    setSheMode(true)
    setVehicleType('she')
    setRideMode('city')
    router.push('/(passenger)/search')
  }
  function openDelivery() {
    router.push('/(passenger)/delivery')
  }

  return (
    <View style={styles.container}>
      {/* Map fills the entire screen — all UI floats on top */}
      <WebMap
        showUser
        variant="explore"
        flyToLocation={flyTarget}
        markers={mapDrivers
          .filter((d) => d.isOnline)
          .map((d) => ({ lat: d.lat, lng: d.lng, heading: d.heading, type: 'car' as const }))}
      />

      <TopBar
        showMenu
        onMenu={() => setDrawerOpen(true)}
        showNotification
        onNotification={() => router.push('/(passenger)/notifications')}
        rightAction={<Txt weight="bold" size={18} color={Colors.gold}>WinRak</Txt>}
      />

      {errorMsg && (
        <Pressable style={styles.gpsBanner}>
          <Txt size={12} color={Colors.dark1}>⚠️ {errorMsg}</Txt>
        </Pressable>
      )}

      {/* Locate-me button — floats above the BottomSheet at all times */}
      <Pressable style={styles.locateBtn} onPress={locateMe}>
        <Icon name="crosshairs-gps" size={22} color={Colors.dark1} />
      </Pressable>

      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetView style={styles.sheetContent}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            <Txt weight="bold" size={22} style={{ marginTop: Spacing.sm }}>{t('home.greeting', { name: displayName })}</Txt>

            {photoStatus === 'missing' && (
              <Pressable style={styles.photoWarn} onPress={() => router.push('/(passenger)/profile-setup')}>
                <Txt size={12} color={Colors.white} style={{ flex: 1 }}>
                  {t('home.photoWarn')}
                </Txt>
                <View style={styles.photoBtn}>
                  <Txt size={11} color={Colors.dark1} weight="bold">{t('home.takePhoto')}</Txt>
                </View>
              </Pressable>
            )}

            <Pressable style={styles.search} onPress={openCity}>
              <Icon name="magnify" size={18} color={Colors.muted} />
              <Txt size={14} color={Colors.muted} style={{ flex: 1 }}>{t('home.searchPlaceholder')}</Txt>
            </Pressable>

            <View style={styles.services}>
              {/* ride card — city + integrated SHE half */}
              <View style={styles.rideCard}>
                <Pressable style={({ pressed }) => [styles.rideMain, pressed && styles.pressed]} onPress={openCity}>
                  <View style={styles.rideIcon}><Icon name="car" size={30} color={Colors.gold} /></View>
                  <View style={{ flex: 1 }}>
                    <Txt weight="bold" size={16}>{t('service.ride')}</Txt>
                    <Txt size={11} color={Colors.muted} style={{ marginTop: 2 }}>{t('service.rideSub')}</Txt>
                  </View>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.sheHalf, pressed && styles.pressed]} onPress={openShe}>
                  <View style={styles.sheIcon}><Icon name="car" size={28} color={Colors.purple} /></View>
                  <Txt weight="bold" size={13} color={Colors.purple} style={{ marginTop: 6 }}>{t('service.women')}</Txt>
                  <Txt size={10} color={Colors.muted} style={{ marginTop: 1 }}>{t('service.womenOnly')}</Txt>
                </Pressable>
              </View>

              {/* delivery card */}
              <Card style={styles.deliveryCard} onPress={openDelivery}>
                <View style={styles.deliveryIcon}><Icon name="package-variant" size={30} color={Colors.gold} /></View>
                <View style={{ flex: 1 }}>
                  <Txt weight="bold" size={16}>{t('service.delivery')}</Txt>
                  <Txt size={11} color={Colors.muted} style={{ marginTop: 2 }}>{t('service.deliverySub')}</Txt>
                </View>
                <DirIcon name="chevron-right" size={22} color={Colors.muted} />
              </Card>
            </View>

            <View style={styles.recent}>
              <Txt weight="bold" size={14} color={Colors.muted} style={styles.recentTitle}>
                {t('home.recentTitle')}
              </Txt>
              {recentDestinations.length === 0 ? (
                <View style={styles.recentEmpty}>
                  <Icon name="map-marker-off-outline" size={22} color={Colors.dark4} />
                  <Txt size={13} color={Colors.dark4}>{t('home.searchPlaceholder')}</Txt>
                </View>
              ) : recentDestinations.map((d) => (
                  <Pressable
                    key={d.name}
                    style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
                    onPress={() => openRecent(d)}
                  >
                    <View style={styles.recentIcon}>
                      <Icon name="history" size={18} color={Colors.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt weight="bold" size={14}>{d.name}</Txt>
                      <Txt size={11} color={Colors.muted} numberOfLines={1} style={{ marginTop: 1 }}>
                        {d.address}
                      </Txt>
                    </View>
                    <DirIcon name="chevron-right" size={20} color={Colors.dark4} />
                  </Pressable>
              ))}
            </View>

          </ScrollView>
        </BottomSheetView>
      </BottomSheet>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    gpsBanner: { backgroundColor: '#e0a020', padding: Spacing.md, alignItems: 'center' },
    locateBtn: {
      position: 'absolute', bottom: '50%', right: Spacing.lg,
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: Colors.white,
      alignItems: 'center', justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2, shadowRadius: 4,
      zIndex: 10,
    },
    sheetBg: { backgroundColor: Colors.dark2 },
    handle: { backgroundColor: Colors.dark4, width: 32 },
    sheetContent: { flex: 1, paddingHorizontal: Spacing.screenPadding },
    scrollBody: { paddingBottom: Spacing.lg },
    photoWarn: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: Colors.goldAlpha10, borderRadius: Spacing.radiusMd,
      borderWidth: 1, borderColor: Colors.gold,
      padding: Spacing.md, marginTop: Spacing.md,
    },
    photoBtn: { backgroundColor: Colors.white, borderRadius: Spacing.radiusSm, paddingHorizontal: Spacing.md, paddingVertical: 6 },
    search: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd,
      height: 52, paddingHorizontal: Spacing.md, marginTop: Spacing.lg,
    },
    services: { gap: Spacing.lg, marginTop: Spacing.lg },
    rideCard: {
      flexDirection: 'row-reverse', alignItems: 'stretch',
      backgroundColor: Colors.dark3, borderRadius: 16, overflow: 'hidden',
    },
    rideMain: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
    sheHalf: {
      width: 104, alignItems: 'center', justifyContent: 'center',
      backgroundColor: Colors.purpleAlpha15, borderRightWidth: 1, borderRightColor: Colors.border,
      paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    },
    sheIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.purpleAlpha15, alignItems: 'center', justifyContent: 'center' },
    deliveryCard: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark3, padding: Spacing.lg,
    },
    rideIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.goldAlpha10, alignItems: 'center', justifyContent: 'center' },
    deliveryIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.goldAlpha10, alignItems: 'center', justifyContent: 'center' },
    recent: { marginTop: Spacing.lg },
    recentTitle: { marginBottom: Spacing.sm, textAlign: 'right' },
    recentRow: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
      paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    recentIcon: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: Colors.dark3, alignItems: 'center', justifyContent: 'center',
    },
    pressed: { opacity: 0.7 },
    recentEmpty: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
      paddingVertical: Spacing.md, opacity: 0.5,
    },
  })
}
