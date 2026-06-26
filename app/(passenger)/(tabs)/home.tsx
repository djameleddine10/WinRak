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

  // flyTo لزر الموقع — ts يضمن إطلاق useEffect في WebMap حتى لو الموقع لم يتغير
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; ts: number } | null>(null)

  function triggerFlyTo() {
    setFlyTo({ lat: userLocation.lat, lng: userLocation.lng, ts: Date.now() })
  }

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

          {/* pinChip محذوف — لا شيء تحت الدبوس */}
        </View>

        {/* زر موقعي — يمين أعلى الخريطة تحت TopBar */}
        <View style={styles.locateBtnWrap} pointerEvents="box-none">
          <Pressable
            style={({ pressed }) => [styles.locateBtn, pressed && { opacity: 0.8 }]}
            onPress={triggerFlyTo}
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

          {/* ── حقل البحث: إلى أين فقط ── */}
          <Pressable style={styles.searchCard} onPress={openCity}>
            <View style={styles.searchRow}>
              <View style={styles.searchDotTo} />
              <Txt size={14} color={Colors.muted} style={{ flex: 1 }}>{t('home.searchPlaceholder')}</Txt>
              <View style={styles.searchPinBtn}>
                <Icon name="map-marker" size={15} color={GOLD} />
              </View>
            </View>
          </Pressable>

          <View style={{ height: Spacing.lg }} />

          {/* ── بطاقات الخدمات: دوائر ── */}
          <View style={styles.circleRow}>

            {/* رحلة — ذهبي */}
            <Pressable style={({ pressed }) => [styles.circleItem, pressed && styles.pressed]} onPress={openCity}>
              <View style={[styles.circleRing, styles.ringGold]}>
                <Image source={require('../../../assets/cards/car-gold.png')} style={styles.circleCarImg} resizeMode="contain" />
              </View>
              <View style={styles.circleFooter}>
                <Txt weight="bold" size={13} color={Colors.white}>{t('service.ride')}</Txt>
                <View style={[styles.circleArrow, { backgroundColor: GOLD }]}>
                  <DirIcon name="chevron-right" size={12} color="#000" />
                </View>
              </View>
            </Pressable>

            {/* نساء — بنفسجي */}
            <Pressable style={({ pressed }) => [styles.circleItem, pressed && styles.pressed]} onPress={openShe}>
              <View style={[styles.circleRing, styles.ringPurple]}>
                <Image source={require('../../../assets/cards/car-purple.png')} style={styles.circleCarImg} resizeMode="contain" />
              </View>
              <View style={styles.circleFooter}>
                <Txt weight="bold" size={13} color={Colors.white}>{t('service.women')}</Txt>
                <View style={[styles.circleArrow, { backgroundColor: PURPLE }]}>
                  <DirIcon name="chevron-right" size={12} color="#fff" />
                </View>
              </View>
            </Pressable>

            {/* توصيل — تيل */}
            <Pressable style={({ pressed }) => [styles.circleItem, pressed && styles.pressed]} onPress={openDelivery}>
              <View style={[styles.circleRing, styles.ringTeal]}>
                <Image source={require('../../../assets/cards/parcel-teal.png')} style={styles.circleParcelImg} resizeMode="contain" />
              </View>
              <View style={styles.circleFooter}>
                <Txt weight="bold" size={13} color={Colors.white}>{t('service.delivery')}</Txt>
                <View style={[styles.circleArrow, { backgroundColor: TEAL }]}>
                  <DirIcon name="chevron-right" size={12} color="#000" />
                </View>
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

    // pinChip محذوف

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
      flexGrow: 1,
      paddingTop: 16,
      paddingHorizontal: Spacing.screenPadding,
      paddingBottom: 90,
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
    searchDotTo: {
      width: 10, height: 10, borderRadius: 2,
      backgroundColor: PURPLE,
    },

    searchPinBtn: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: Colors.goldAlpha15,
      alignItems: 'center', justifyContent: 'center',
    },

    // ── بطاقات دائرية ──
    circleRow: {
      flexDirection: row,
      justifyContent: 'space-around',
      marginTop: 'auto' as any,
      paddingTop: 12,
      paddingBottom: 8,
    },

    // حاوية كل دائرة (تحتوي الـ ring + النص)
    circleItem: {
      alignItems: 'center',
    },

    // الـ ring الخارجي — الدائرة الكاملة
    circleRing: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 3,
      overflow: 'hidden',
      position: 'relative' as any,
      ...Shadows.md,
    },
    ringGold:   { borderColor: GOLD,   backgroundColor: Colors.dark2, shadowColor: GOLD },
    ringPurple: { borderColor: PURPLE, backgroundColor: Colors.dark2, shadowColor: PURPLE },
    ringTeal:   { borderColor: TEAL,   backgroundColor: Colors.dark2, shadowColor: TEAL },

    // صورة السيارة: تخرج من الجانب الأيمن
    circleCarImg: {
      position: 'absolute' as any,
      width: 150,
      height: 95,
      right: -30,
      bottom: 8,
    },

    // صورة الطرد: في المنتصف
    circleParcelImg: {
      position: 'absolute' as any,
      width: 80,
      height: 68,
      right: 12,
      bottom: 10,
    },

    // النص + السهم تحت الدائرة
    circleFooter: {
      flexDirection: row,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      marginTop: 8,
    },
    circleArrow: {
      width: 20, height: 20, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },

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
