import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
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
const GOLD   = '#ffbc07'

export default function Home() {
  const Colors      = useColors()
  const scheme      = useResolvedScheme()
  const isDark      = scheme === 'dark'
  const isRTL       = useIsRTL()
  const styles      = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])

  const photoStatus    = useUserStore((s) => s.photoStatus)
  const profile        = useUserStore((s) => s.profile)
  const setRideMode    = useUserStore((s) => s.setRideMode)
  const setSheMode     = useRideStore((s) => s.setSheMode)
  const setVehicleType = useRideStore((s) => s.setVehicleType)
  const setFrom        = useRideStore((s) => s.setFrom)
  const setTo          = useRideStore((s) => s.setTo)
  const rideHistory    = useRideStore((s) => s.rideHistory)
  const setRideHistory = useRideStore((s) => s.setRideHistory)
  const mapDrivers     = useMapStore((s) => s.mapDrivers)
  const userLocation   = useMapStore((s) => s.userLocation)

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
          id:             trip.id,
          rideType:       'city' as const,
          from:           { name: trip.from_address ?? '', address: trip.from_address ?? '', lat: trip.from_lat ?? 0, lng: trip.from_lng ?? 0 },
          to:             { name: trip.to_address   ?? '', address: trip.to_address   ?? '', lat: trip.to_lat   ?? 0, lng: trip.to_lng   ?? 0 },
          price:          trip.price          ?? 0,
          suggestedPrice: trip.price          ?? 0,
          distance:       trip.distance_km    ?? 0,
          duration:       trip.duration_min   ?? 0,
          status:         trip.status         ?? 'completed',
          vehicleType:    trip.vehicle_type   ?? 'sedan',
          paymentMethod:  trip.payment_method ?? 'cash',
          createdAt:      trip.created_at,
          startedAt:      trip.started_at     ?? null,
          completedAt:    trip.completed_at   ?? null,
          rating:         null,
          driverEta:      null,
          cancelReason:   trip.cancel_reason  ?? null,
          departureDate:  null,
          departureTime:  null,
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

  // ── دبوس الخريطة ─────────────────────────────────────────────────
  const [mapMoving,  setMapMoving]  = useState(false)
  const [pinLabel,   setPinLabel]   = useState<string | null>(null)
  const [pinLat,     setPinLat]     = useState(ALGIERS_CENTER.lat)
  const [pinLng,     setPinLng]     = useState(ALGIERS_CENTER.lng)
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const labelAnim    = useRef(new Animated.Value(0)).current

  // flyTo لزر الموقع
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null)

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
    geocodeTimer.current = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
        { headers: { 'User-Agent': 'WinRakApp/1.0' } }
      )
        .then((r) => r.json())
        .then((d) => {
          const raw: string = d.display_name ?? ''
          const short = raw.split(',')[0]?.trim() ?? raw
          setPinLabel(short || null)
          Animated.timing(labelAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start()
        })
        .catch(() => {})
    }, 350)
  }, [labelAnim])

  // عند الضغط على chip الشارع: يملأ "من أين" ويفتح البحث نحو الوجهة
  function handlePinChipPress() {
    if (!pinLabel) return
    setSheMode(false)
    setVehicleType('sedan')
    setRideMode('city')
    setFrom({
      name:    pinLabel,
      address: pinLabel,
      lat:     pinLat,
      lng:     pinLng,
    })
    router.push('/(passenger)/search')
  }

  // ── Navigation ────────────────────────────────────────────────────
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

      {/* ── الخريطة: الجزء العلوي بدون تعتيم ── */}
      <View style={styles.mapWrap}>
        <WebMap
          showUser
          variant="explore"
          flyToLocation={flyTo}
          markers={mapDrivers
            .filter((d) => d.isOnline)
            .map((d) => ({ lat: d.lat, lng: d.lng, heading: d.heading, type: 'car' as const }))}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
        />

        {/* الدبوس الذهبي في مركز الخريطة */}
        <View style={styles.pinWrap} pointerEvents="box-none">
          <View pointerEvents="none">
            <MapPin moving={mapMoving} />
          </View>

          {/* Chip الشارع — قابل للضغط */}
          {pinLabel ? (
            <Animated.View style={{ opacity: labelAnim }}>
              <Pressable
                style={({ pressed }) => [
                  styles.pinChip,
                  isDark ? styles.pinChipDark : styles.pinChipLight,
                  pressed && styles.pinChipPressed,
                ]}
                onPress={handlePinChipPress}
              >
                <Icon name="map-marker" size={11} color={GOLD} />
                <Txt
                  size={10}
                  weight="bold"
                  color={isDark ? '#111' : '#fff'}
                  numberOfLines={1}
                  style={{ flex: 1, letterSpacing: 0.2 }}
                >
                  {pinLabel}
                </Txt>
                <Icon name="chevron-right" size={11} color={isDark ? '#555' : 'rgba(255,255,255,0.7)'} />
              </Pressable>
            </Animated.View>
          ) : null}
        </View>

        {/* زر موقعي — يمين أعلى الخريطة تحت TopBar */}
        <View style={styles.locateBtnWrap} pointerEvents="box-none">
          <Pressable
            style={({ pressed }) => [styles.locateBtn, pressed && { opacity: 0.8 }]}
            onPress={() => setFlyTo({ lat: userLocation.lat, lng: userLocation.lng })}
            hitSlop={8}
          >
            <Icon name="crosshairs-gps" size={20} color={GOLD} />
          </Pressable>
        </View>
      </View>

      {/* ── TopBar ── */}
      <View style={styles.topBarWrap} pointerEvents="box-none">
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

      {/* ── الـ Sheet: ثابت دائماً ── */}
      <View style={styles.sheet}>
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* مقبض */}
          <View style={styles.handle} />

          {/* تحذير الصورة */}
          {photoStatus === 'missing' && (
            <Pressable style={styles.photoWarn} onPress={() => router.push('/(passenger)/profile-setup')}>
              <Icon name="alert-circle-outline" size={14} color={Colors.gold} />
              <Txt size={11} color={Colors.muted} style={{ flex: 1 }}>{t('home.photoWarn')}</Txt>
              <Txt size={11} color={Colors.gold} weight="bold">{t('home.takePhoto')}</Txt>
            </Pressable>
          )}

          {/* ── حقلا البحث: من أين + إلى أين ── */}
          <View style={styles.searchCard}>
            {/* من أين */}
            <Pressable style={styles.searchRow} onPress={openCity}>
              <View style={styles.searchDotFrom} />
              <Txt size={14} color={Colors.muted} style={{ flex: 1 }}>{t('home.searchFrom')}</Txt>
              <Icon name="crosshairs-gps" size={16} color={Colors.gold} />
            </Pressable>

            {/* فاصل */}
            <View style={styles.searchDivider}>
              <View style={styles.searchLine} />
            </View>

            {/* إلى أين */}
            <Pressable style={styles.searchRow} onPress={openCity}>
              <View style={styles.searchDotTo} />
              <Txt size={14} color={Colors.muted} style={{ flex: 1 }}>{t('home.searchPlaceholder')}</Txt>
              <View style={styles.searchPinBtn}>
                <Icon name="map-marker" size={15} color={GOLD} />
              </View>
            </Pressable>
          </View>

          <View style={{ height: Spacing.lg }} />

          {/* بطاقات الخدمات */}
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

          {/* الوجهات الأخيرة */}
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

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.dark1 },

    // الخريطة — 52% العلوية، بدون تعتيم
    mapWrap: {
      position: 'absolute',
      top: 0, left: 0, right: 0,
      height: MAP_H,
    },

    // الدبوس في مركز منطقة الخريطة
    pinWrap: {
      position: 'absolute',
      top: 0, left: 0, right: 0,
      height: MAP_H,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 26,
    },

    // Chip الشارع تحت الدبوس
    pinChip: {
      flexDirection: row,
      alignItems: 'center',
      gap: 5,
      marginTop: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      maxWidth: 180,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 6,
    },
    pinChipDark: {
      backgroundColor: '#fff',
    },
    pinChipLight: {
      backgroundColor: 'rgba(0,0,0,0.65)',
    },
    pinChipPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.97 }],
    },

    // زر موقعي — يمين أعلى الخريطة تحت TopBar
    locateBtnWrap: {
      position: 'absolute',
      top: 72,
      right: 14,
    },
    locateBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: Colors.dark2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },

    topBarWrap: {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    },
    gpsBanner: {
      position: 'absolute', top: Spacing.topBarHeight, left: 0, right: 0, zIndex: 15,
      backgroundColor: '#c87700', paddingVertical: 6, paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },

    // الـ sheet — ثابت، لا يتحرك
    sheet: {
      position: 'absolute',
      left: 0, right: 0,
      top: MAP_H - 28,
      bottom: 0,
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

    // ── حقلا البحث ──
    searchCard: {
      backgroundColor: Colors.dark2,
      borderRadius: Spacing.radiusMd,
      borderWidth: 1,
      borderColor: Colors.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
      elevation: 8,
    },
    searchRow: {
      flexDirection: row,
      alignItems: 'center',
      gap: 12,
      height: 52,
      paddingHorizontal: Spacing.md,
    },
    searchDotFrom: {
      width: 10, height: 10, borderRadius: 5,
      backgroundColor: GOLD,
      borderWidth: 2,
      borderColor: Colors.dark2,
      shadowColor: GOLD,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
    },
    searchDotTo: {
      width: 10, height: 10, borderRadius: 2,
      backgroundColor: PURPLE,
    },
    searchDivider: {
      paddingLeft: Spacing.md + 5,
      paddingRight: Spacing.md,
    },
    searchLine: {
      height: 1,
      backgroundColor: Colors.border,
    },
    searchPinBtn: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: Colors.goldAlpha15,
      alignItems: 'center', justifyContent: 'center',
    },

    cardsWrap: { gap: 12 },
    cardRow:   { flexDirection: row, gap: 12 },

    cardSm: {
      flex: 1,
      borderRadius: Spacing.radiusLg,
      paddingTop: 10, paddingBottom: 12, paddingHorizontal: 12,
      borderWidth: 1,
      overflow: 'hidden',
    },
    cardImgSm:    { width: '100%', height: 54, marginBottom: 6 },
    cardSmFooter: { flexDirection: row, alignItems: 'center', justifyContent: 'space-between' },
    arrowBtnSm:   { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

    card: {
      flexDirection: row, alignItems: 'center',
      borderRadius: Spacing.radiusLg,
      paddingVertical: 14, paddingHorizontal: 16,
      gap: 14, borderWidth: 1, overflow: 'hidden',
    },
    goldCard:   { backgroundColor: Colors.dark2, borderColor: Colors.goldAlpha20,      ...Shadows.md },
    purpleCard: { backgroundColor: Colors.dark2, borderColor: 'rgba(123,79,212,0.40)', ...Shadows.md },
    tealCard:   { backgroundColor: Colors.dark2, borderColor: 'rgba(0,194,168,0.40)',  ...Shadows.md },

    cardImgWrap:   { width: 76, height: 56, alignItems: 'center', justifyContent: 'center' },
    cardImgParcel: { width: 52, height: 50 },
    cardBody:      { flex: 1 },
    arrowBtn:      { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

    pressed: { opacity: 0.72 },

    recentWrap:  { marginTop: Spacing.xxl },
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
