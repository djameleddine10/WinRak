import { useEffect, useMemo, useState } from 'react'
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { type Palette } from '../../../constants/colors'
import { useColors } from '../../../hooks/useColors'
import { Spacing } from '../../../constants/spacing'
import { Txt } from '../../../components/ui/Txt'
import { Icon } from '../../../components/ui/Icon'
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
import { useRealMapDrivers } from '../../../hooks/useRealMapDrivers'
import { registerPushToken } from '../../../services/notifications.service'
import { getMyTrips } from '../../../services/trips.service'

const { height: SCREEN_H } = Dimensions.get('window')
const MAP_H = Math.round(SCREEN_H * 0.30)

const GOLD   = '#FFB800'
const PURPLE = '#7B4FD4'
const TEAL   = '#00C2A8'
const BG     = '#0a0b14'

export default function Home() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const displayName = usePassengerName()
  const photoStatus = useUserStore((s) => s.photoStatus)
  const profile     = useUserStore((s) => s.profile)
  const setRideMode = useUserStore((s) => s.setRideMode)
  const setSheMode  = useRideStore((s) => s.setSheMode)
  const setVehicleType = useRideStore((s) => s.setVehicleType)
  const setTo          = useRideStore((s) => s.setTo)
  const rideHistory    = useRideStore((s) => s.rideHistory)
  const setRideHistory = useRideStore((s) => s.setRideHistory)
  const mapDrivers     = useMapStore((s) => s.mapDrivers)

  const recentDestinations = useMemo(() => {
    const seen = new Set<string>()
    const out: { name: string; address: string; lat: number; lng: number }[] = []
    for (const r of rideHistory) {
      const d = r.to
      if (!d || seen.has(d.name)) continue
      seen.add(d.name)
      out.push(d)
      if (out.length >= 3) break
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

  useEffect(() => {
    if (profile?.id) registerPushToken(profile.id).catch(() => {})
  }, [profile?.id])

  useEffect(() => {
    if (!profile?.id) return
    getMyTrips(profile.id, 'passenger', 20)
      .then((trips) => {
        const rides = trips.map((trip: any) => ({
          id:            trip.id,
          rideType:      'city' as const,
          from:          { name: trip.from_address ?? '', address: trip.from_address ?? '', lat: trip.from_lat ?? 0, lng: trip.from_lng ?? 0 },
          to:            { name: trip.to_address   ?? '', address: trip.to_address   ?? '', lat: trip.to_lat   ?? 0, lng: trip.to_lng   ?? 0 },
          price:         trip.price          ?? 0,
          suggestedPrice: trip.price         ?? 0,
          distance:      trip.distance_km    ?? 0,
          duration:      trip.duration_min   ?? 0,
          status:        trip.status         ?? 'completed',
          vehicleType:   trip.vehicle_type   ?? 'sedan',
          paymentMethod: trip.payment_method ?? 'cash',
          createdAt:     trip.created_at,
          startedAt:     trip.started_at     ?? null,
          completedAt:   trip.completed_at   ?? null,
          rating:        null,
          driverEta:     null,
          cancelReason:  trip.cancel_reason  ?? null,
          departureDate: null,
          departureTime: null,
          luggageAllowed: false,
          passenger: { id: trip.passenger_id ?? '', name: '', nameLatin: '', firstName: '', lastName: '', avatar: '', phone: '', phoneMasked: '', email: '', rating: 5, totalRides: 0, gender: 'male', birthDate: '', city: '', photoStatus: 'missing', registrationStep: 1, savedPlaces: { home: null, work: null }, wallet: { balance: 0, points: 0 }, paymentMethods: [], emergencyContacts: [] },
          driver:    { id: trip.driver_id ?? '', name: '', nameLatin: '', avatar: '', phone: '', rating: 0, totalRides: 0, isVerified: true, isSheDriver: false, registrationStatus: 'approved', driverType: 'city', level: 'standard', vehicle: { type: 'sedan', brand: '', model: '', modelKey: 'veh.m301', color: '', colorKey: 'veh.colorWhite', plate: '', year: 0, seats: 4 }, documents: { licenseNumber: '', licenseExpiry: '', grayCardNumber: '', birthPlace: '' }, location: { lat: 0, lng: 0 }, heading: 0, isOnline: false, earnings: { today: 0, week: 0, month: 0 } },
        }))
        setRideHistory(rides as any)
      })
      .catch(() => {})
  }, [profile?.id])

  useRealMapDrivers()

  const [drawerOpen, setDrawerOpen] = useState(false)

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
    <View style={styles.root}>

      {/* Map — top portion, behind everything */}
      <View style={styles.mapWrap}>
        <WebMap
          showUser
          variant="explore"
          markers={mapDrivers
            .filter((d) => d.isOnline)
            .map((d) => ({ lat: d.lat, lng: d.lng, heading: d.heading, type: 'car' as const }))}
        />
        <View style={styles.mapOverlay} pointerEvents="none" />
      </View>

      {/* TopBar floats on map */}
      <View style={styles.topBarWrap}>
        <TopBar
          showMenu
          onMenu={() => setDrawerOpen(true)}
          showNotification
          onNotification={() => router.push('/(passenger)/notifications')}
          rightAction={<Txt weight="bold" size={20} color={GOLD}>WinRak</Txt>}
        />
      </View>

      {errorMsg && (
        <View style={styles.gpsBanner}>
          <Txt size={11} color="#fff">⚠️ {errorMsg}</Txt>
        </View>
      )}

      {/* Scrollable content starts overlapping the map bottom */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <Txt weight="bold" size={24} color="#fff" style={styles.greetText}>
          {t('home.greeting', { name: displayName })}
        </Txt>

        {/* Photo warning */}
        {photoStatus === 'missing' && (
          <Pressable style={styles.photoWarn} onPress={() => router.push('/(passenger)/profile-setup')}>
            <Icon name="alert-circle-outline" size={14} color={GOLD} />
            <Txt size={11} color={Colors.muted} style={{ flex: 1 }}>{t('home.photoWarn')}</Txt>
            <Txt size={11} color={GOLD} weight="bold">{t('home.takePhoto')}</Txt>
          </Pressable>
        )}

        {/* Search bar */}
        <Pressable style={styles.search} onPress={openCity}>
          <Icon name="magnify" size={18} color={Colors.muted} />
          <Txt size={14} color={Colors.muted} style={{ flex: 1 }}>{t('home.searchPlaceholder')}</Txt>
          <View style={styles.searchPin}>
            <Icon name="map-marker" size={16} color={GOLD} />
          </View>
        </Pressable>

        {/* ── Service cards ── */}
        <View style={styles.cardsWrap}>

          {/* Ride */}
          <Pressable
            style={({ pressed }) => [styles.card, styles.goldCard, pressed && styles.pressed]}
            onPress={openCity}
          >
            <View style={styles.cardImgWrap}>
              <Image source={require('../../../assets/cards/car-gold.png')} style={styles.cardImg} resizeMode="contain" />
            </View>
            <View style={styles.cardBody}>
              <Txt weight="bold" size={18} color="#fff">{t('service.ride')}</Txt>
              <Txt size={12} color="rgba(255,255,255,0.50)" style={{ marginTop: 3 }}>{t('service.rideSub')}</Txt>
              <Txt size={12} color={GOLD} weight="bold" style={{ marginTop: 8 }}>250 DA</Txt>
            </View>
            <View style={[styles.arrowBtn, { backgroundColor: GOLD }]}>
              <DirIcon name="chevron-right" size={18} color="#000" />
            </View>
          </Pressable>

          {/* Women */}
          <Pressable
            style={({ pressed }) => [styles.card, styles.purpleCard, pressed && styles.pressed]}
            onPress={openShe}
          >
            <View style={styles.cardImgWrap}>
              <Image source={require('../../../assets/cards/car-purple.png')} style={styles.cardImg} resizeMode="contain" />
            </View>
            <View style={styles.cardBody}>
              <Txt weight="bold" size={18} color="#fff">{t('service.women')}</Txt>
              <Txt size={12} color="rgba(255,255,255,0.50)" style={{ marginTop: 3 }}>{t('service.womenOnly')}</Txt>
            </View>
            <View style={[styles.arrowBtn, { backgroundColor: PURPLE }]}>
              <DirIcon name="chevron-right" size={18} color="#fff" />
            </View>
          </Pressable>

          {/* Delivery */}
          <Pressable
            style={({ pressed }) => [styles.card, styles.tealCard, pressed && styles.pressed]}
            onPress={openDelivery}
          >
            <View style={styles.cardImgWrap}>
              <Image source={require('../../../assets/cards/parcel-teal.png')} style={styles.cardImgParcel} resizeMode="contain" />
            </View>
            <View style={styles.cardBody}>
              <Txt weight="bold" size={18} color="#fff">{t('service.delivery')}</Txt>
              <Txt size={12} color="rgba(255,255,255,0.50)" style={{ marginTop: 3 }}>{t('service.deliverySub')}</Txt>
            </View>
            <View style={[styles.arrowBtn, { backgroundColor: TEAL }]}>
              <DirIcon name="chevron-right" size={18} color="#000" />
            </View>
          </Pressable>
        </View>

        {/* Recent destinations */}
        {recentDestinations.length > 0 && (
          <View style={styles.recentWrap}>
            <Txt weight="bold" size={13} color={Colors.muted} style={styles.recentTitle}>
              {t('home.recentTitle')}
            </Txt>
            {recentDestinations.map((d) => (
              <Pressable
                key={d.name}
                style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
                onPress={() => openRecent(d)}
              >
                <View style={styles.recentIcon}>
                  <Icon name="history" size={18} color={Colors.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt weight="bold" size={14} color="#fff">{d.name}</Txt>
                  <Txt size={11} color={Colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>{d.address}</Txt>
                </View>
                <DirIcon name="chevron-right" size={18} color={Colors.dark4} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },

    mapWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: MAP_H },
    mapOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(10,11,20,0.62)',
    },
    topBarWrap: {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    },
    gpsBanner: {
      position: 'absolute', top: Spacing.topBarHeight, left: 0, right: 0, zIndex: 15,
      backgroundColor: '#c87700', paddingVertical: 6, paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },

    scroll: { flex: 1 },
    scrollBody: {
      paddingTop: MAP_H - 20,
      paddingHorizontal: Spacing.screenPadding,
      paddingBottom: Spacing.xxxl,
    },

    greetText: { textAlign: 'right', marginBottom: Spacing.md },

    photoWarn: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
      backgroundColor: 'rgba(255,184,0,0.10)',
      borderRadius: Spacing.radiusMd, borderWidth: 1, borderColor: 'rgba(255,184,0,0.25)',
      paddingVertical: 8, paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
    },

    search: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderRadius: Spacing.radiusMd, height: 52,
      paddingHorizontal: Spacing.md, marginBottom: Spacing.xl,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    },
    searchPin: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: 'rgba(255,184,0,0.15)',
      alignItems: 'center', justifyContent: 'center',
    },

    cardsWrap: { gap: 14 },

    card: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      borderRadius: Spacing.radiusLg,
      paddingVertical: 18,
      paddingHorizontal: 18,
      gap: 16,
      borderWidth: 1,
      overflow: 'hidden',
    },
    goldCard: {
      backgroundColor: 'rgba(255,184,0,0.07)',
      borderColor: 'rgba(255,184,0,0.30)',
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 22,
      elevation: 14,
    },
    purpleCard: {
      backgroundColor: 'rgba(123,79,212,0.10)',
      borderColor: 'rgba(123,79,212,0.38)',
      shadowColor: PURPLE,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 22,
      elevation: 14,
    },
    tealCard: {
      backgroundColor: 'rgba(0,194,168,0.07)',
      borderColor: 'rgba(0,194,168,0.30)',
      shadowColor: TEAL,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 22,
      elevation: 14,
    },

    cardImgWrap: {
      width: 92, height: 64, alignItems: 'center', justifyContent: 'center',
    },
    cardImg: { width: 92, height: 56 },
    cardImgParcel: { width: 64, height: 60 },
    cardBody: { flex: 1 },

    arrowBtn: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center',
    },

    pressed: { opacity: 0.72 },

    recentWrap: { marginTop: Spacing.xxl },
    recentTitle: { textAlign: 'right', marginBottom: Spacing.sm },
    recentRow: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: 14,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
    },
    recentIcon: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.07)',
      alignItems: 'center', justifyContent: 'center',
    },
  })
}
