import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Dimensions, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { type Palette } from '../../../constants/colors'
import { useColors, useResolvedScheme } from '../../../hooks/useColors'
import { Spacing } from '../../../constants/spacing'
import { Shadows } from '../../../constants/shadows'
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
import { DirIcon } from '../../../components/ui/DirIcon'
import { useIsRTL } from '../../../i18n/locale'
import { MapPin } from '../../../components/map/MapPin'
import { ALGIERS_CENTER } from '../../../mock/map'
import { useRealMapDrivers } from '../../../hooks/useRealMapDrivers'
import { registerPushToken } from '../../../services/notifications.service'
import { getMyTrips } from '../../../services/trips.service'

const { height: SCREEN_H } = Dimensions.get('window')
const MAP_H = Math.round(SCREEN_H * 0.52)

const PURPLE = '#7B4FD4'
const TEAL   = '#00C2A8'

export default function Home() {
  const Colors = useColors()
  const scheme = useResolvedScheme()
  const isDark = scheme === 'dark'
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
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

  // ── Map pin state ──────────────────────────────────────────────────
  const [mapMoving,  setMapMoving]  = useState(false)
  const [pinLabel,   setPinLabel]   = useState<string | null>(null)
  const [pinLat,     setPinLat]     = useState(ALGIERS_CENTER.lat)
  const [pinLng,     setPinLng]     = useState(ALGIERS_CENTER.lng)
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Label fade: 1=visible, 0=hidden
  const labelAnim = useRef(new Animated.Value(0)).current

  // Sheet: opacity only — translateY causes a black box artifact
  const sheetAnim = useRef(new Animated.Value(1)).current
  const [sheetVisible, setSheetVisible] = useState(true)

  const hideSheet = useCallback(() => {
    setSheetVisible(false)
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }, [sheetAnim])

  const showSheet = useCallback(() => {
    setSheetVisible(true)
    Animated.spring(sheetAnim, {
      toValue: 1,
      tension: 140,
      friction: 11,
      useNativeDriver: true,
    }).start()
  }, [sheetAnim])

  const handleRegionChange = useCallback(() => {
    setMapMoving(true)
    setPinLabel(null)
    Animated.timing(labelAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start()
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
  }, [labelAnim])

  const handleRegionChangeComplete = useCallback((lat: number, lng: number) => {
    setMapMoving(false)
    setPinLat(lat)
    setPinLng(lng)
    // Reverse-geocode with short debounce
    geocodeTimer.current = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
        { headers: { 'User-Agent': 'WinRakApp/1.0' } }
      )
        .then((r) => r.json())
        .then((d) => {
          const raw: string = d.display_name ?? ''
          // Show only first segment (neighbourhood / street)
          const short = raw.split(',')[0]?.trim() ?? raw
          setPinLabel(short || null)
          Animated.timing(labelAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start()
        })
        .catch(() => {})
    }, 350)
  }, [labelAnim])

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
      <View
        style={styles.mapWrap}
        onTouchStart={hideSheet}
        onTouchEnd={showSheet}
      >
        <WebMap
          showUser
          variant="explore"
          markers={mapDrivers
            .filter((d) => d.isOnline)
            .map((d) => ({ lat: d.lat, lng: d.lng, heading: d.heading, type: 'car' as const }))}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
        />
        <View style={styles.mapOverlay} pointerEvents="none" />

        {/* Central pin + label beneath */}
        <View style={styles.pinWrap} pointerEvents="none">
          <MapPin moving={mapMoving} />
          {/* Location label — fades in when pin settles */}
          <Animated.View
            style={[
              styles.pinLabel,
              isDark ? styles.pinLabelDark : styles.pinLabelLight,
              { opacity: labelAnim },
            ]}
          >
            <Txt
              size={10}
              weight="bold"
              color={isDark ? '#000' : '#fff'}
              numberOfLines={1}
              style={{ letterSpacing: 0.2 }}
            >
              {pinLabel ?? ''}
            </Txt>
          </Animated.View>
        </View>
      </View>

      {/* TopBar floats on map */}
      <View style={styles.topBarWrap}>
        <TopBar
          showMenu
          onMenu={() => setDrawerOpen(true)}
          showNotification
          onNotification={() => router.push('/(passenger)/notifications')}
          rightAction={<Txt weight="bold" size={20} color={Colors.gold}>WinRak</Txt>}
        />
      </View>

      {errorMsg && (
        <View style={styles.gpsBanner}>
          <Txt size={11} color={Colors.white}>⚠️ {errorMsg}</Txt>
        </View>
      )}

      {/* Bottom sheet — opacity fade only, no translateY (avoids black box) */}
      <Animated.View
        style={[styles.sheetOuter, { opacity: sheetAnim }]}
        pointerEvents={sheetVisible ? 'box-none' : 'none'}
      >
        <View style={styles.sheetInner}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
          >
            {/* Drag handle */}
            <View style={styles.handle} />

            {/* Photo warning */}
            {photoStatus === 'missing' && (
              <Pressable style={styles.photoWarn} onPress={() => router.push('/(passenger)/profile-setup')}>
                <Icon name="alert-circle-outline" size={14} color={Colors.gold} />
                <Txt size={11} color={Colors.muted} style={{ flex: 1 }}>{t('home.photoWarn')}</Txt>
                <Txt size={11} color={Colors.gold} weight="bold">{t('home.takePhoto')}</Txt>
              </Pressable>
            )}

            {/* Search bar */}
            <Pressable style={styles.search} onPress={openCity}>
              <Icon name="magnify" size={18} color={Colors.muted} />
              <Txt size={14} color={Colors.muted} style={{ flex: 1 }}>{t('home.searchPlaceholder')}</Txt>
              <View style={styles.searchPin}>
                <Icon name="map-marker" size={16} color={Colors.gold} />
              </View>
            </Pressable>

            <View style={{ height: Spacing.lg }} />

            {/* ── Service cards ── */}
            <View style={styles.cardsWrap}>
              <View style={styles.cardRow}>
                <Pressable
                  style={({ pressed }) => [styles.cardSm, styles.goldCard, pressed && styles.pressed]}
                  onPress={openCity}
                >
                  <Image source={require('../../../assets/cards/car-gold.png')} style={styles.cardImgSm} resizeMode="contain" />
                  <View style={styles.cardSmFooter}>
                    <Txt weight="bold" size={15} color={Colors.white}>{t('service.ride')}</Txt>
                    <View style={[styles.arrowBtnSm, { backgroundColor: Colors.gold }]}>
                      <DirIcon name="chevron-right" size={15} color="#000" />
                    </View>
                  </View>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.cardSm, styles.purpleCard, pressed && styles.pressed]}
                  onPress={openShe}
                >
                  <Image source={require('../../../assets/cards/car-purple.png')} style={styles.cardImgSm} resizeMode="contain" />
                  <View style={styles.cardSmFooter}>
                    <Txt weight="bold" size={15} color={Colors.white}>{t('service.women')}</Txt>
                    <View style={[styles.arrowBtnSm, { backgroundColor: PURPLE }]}>
                      <DirIcon name="chevron-right" size={15} color="#fff" />
                    </View>
                  </View>
                </Pressable>
              </View>
              <Pressable
                style={({ pressed }) => [styles.card, styles.tealCard, pressed && styles.pressed]}
                onPress={openDelivery}
              >
                <View style={styles.cardImgWrap}>
                  <Image source={require('../../../assets/cards/parcel-teal.png')} style={styles.cardImgParcel} resizeMode="contain" />
                </View>
                <View style={styles.cardBody}>
                  <Txt weight="bold" size={17} color={Colors.white}>{t('service.delivery')}</Txt>
                  <Txt size={11} color={Colors.muted} style={{ marginTop: 3 }}>{t('service.deliverySub')}</Txt>
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
                      <Txt weight="bold" size={14} color={Colors.white}>{d.name}</Txt>
                      <Txt size={11} color={Colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>{d.address}</Txt>
                    </View>
                    <DirIcon name="chevron-right" size={18} color={Colors.dark4} />
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Animated.View>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.dark1 },

    // Map occupies the top portion — fully interactive (no overlay blocking touches)
    mapWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: MAP_H },
    pinWrap: {
      position: 'absolute',
      top: 0, left: 0, right: 0,
      height: MAP_H,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 26,   // offset so pin tip is exactly on map center
    },
    mapOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: Colors.dark1,
      opacity: 0.18,        // reduced — just a subtle tint, not a blocker
    },
    topBarWrap: {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
      pointerEvents: 'box-none',  // let map touches pass through the empty area
    },
    gpsBanner: {
      position: 'absolute', top: Spacing.topBarHeight, left: 0, right: 0, zIndex: 15,
      backgroundColor: '#c87700', paddingVertical: 6, paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },

    // Transparent wrapper — slides off-screen cleanly (no background = no black box)
    sheetOuter: {
      position: 'absolute',
      left: 0, right: 0,
      top: MAP_H - 28,
      bottom: 0,
      // NO backgroundColor here
    },
    // Inner view carries the visual background
    sheetInner: {
      flex: 1,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: Colors.dark1,
      overflow: 'hidden',
    },
    scrollBody: {
      paddingTop: 20,
      paddingHorizontal: Spacing.screenPadding,
      paddingBottom: 100,
    },

    handle: {
      width: 40, height: 4,
      borderRadius: 2,
      backgroundColor: Colors.dark4,
      alignSelf: 'center',
      marginBottom: Spacing.md,
    },

    photoWarn: {
      flexDirection: row, alignItems: 'center', gap: 8,
      backgroundColor: Colors.goldAlpha10,
      borderRadius: Spacing.radiusMd, borderWidth: 1, borderColor: Colors.goldAlpha20,
      paddingVertical: 8, paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
    },

    search: {
      flexDirection: row, alignItems: 'center', gap: 10,
      backgroundColor: Colors.dark2,
      borderRadius: Spacing.radiusMd, height: 52,
      paddingHorizontal: Spacing.md, marginBottom: Spacing.lg,
      borderWidth: 1, borderColor: Colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
      elevation: 8,
    },
    searchPin: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: Colors.goldAlpha15,
      alignItems: 'center', justifyContent: 'center',
    },

    cardsWrap: { gap: 12 },

    cardRow: { flexDirection: row, gap: 12 },

    cardSm: {
      flex: 1,
      borderRadius: Spacing.radiusLg,
      paddingTop: 10,
      paddingBottom: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      overflow: 'hidden',
    },
    cardImgSm: { width: '100%', height: 54, marginBottom: 6 },
    cardSmFooter: {
      flexDirection: row,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    arrowBtnSm: {
      width: 30, height: 30, borderRadius: 15,
      alignItems: 'center', justifyContent: 'center',
    },

    card: {
      flexDirection: row,
      alignItems: 'center',
      borderRadius: Spacing.radiusLg,
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 14,
      borderWidth: 1,
      overflow: 'hidden',
    },
    goldCard: {
      backgroundColor: Colors.dark2,
      borderColor: Colors.goldAlpha20,
      ...Shadows.md,
    },
    purpleCard: {
      backgroundColor: Colors.dark2,
      borderColor: 'rgba(123,79,212,0.40)',
      ...Shadows.md,
    },
    tealCard: {
      backgroundColor: Colors.dark2,
      borderColor: 'rgba(0,194,168,0.40)',
      ...Shadows.md,
    },

    cardImgWrap: {
      width: 76, height: 56, alignItems: 'center', justifyContent: 'center',
    },
    cardImgParcel: { width: 52, height: 50 },
    cardBody: { flex: 1 },

    arrowBtn: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center',
    },

    pressed: { opacity: 0.72 },

    // Pin label beneath the map pin
    pinLabel: {
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      maxWidth: 160,
      alignItems: 'center',
    },
    pinLabelDark: {
      backgroundColor: '#fff',
      borderWidth: 0,
    },
    pinLabelLight: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.6)',
    },

    recentWrap: { marginTop: Spacing.xxl },
    recentTitle: { textAlign: 'right', marginBottom: Spacing.sm },
    recentRow: {
      flexDirection: row, alignItems: 'center', gap: 14,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    recentIcon: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: Colors.dark3,
      alignItems: 'center', justifyContent: 'center',
    },
  })
}
