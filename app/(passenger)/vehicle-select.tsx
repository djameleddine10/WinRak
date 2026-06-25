import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Button } from '../../components/ui/Button'
import { TopBar } from '../../components/layout/TopBar'
import { VehicleCard } from '../../components/ride/VehicleCard'
import { PriceInput } from '../../components/ride/PriceInput'
import { PaymentMethodPicker } from '../../components/payment/PaymentMethodPicker'
import { WebMap, type MapMarker } from '../../components/map/WebMap'
import { useRideStore, type VehicleType } from '../../store/rideStore'
import { useUserStore } from '../../store/userStore'
import { usePaymentStore, selectedMethod } from '../../store/paymentStore'
import { createTrip } from '../../services/trips.service'
import { getRouteInfo, estimatePrice } from '../../services/route.service'
import { mockRoutePoints } from '../../mock/map'
import { type TranslationKey } from '../../i18n/translations'
import type { VehicleType as DbVehicleType, PaymentMethod as DbPaymentMethod } from '../../lib/supabase'

const DB_VEHICLE: Record<VehicleType, DbVehicleType> = {
  sedan:   'economique',
  comfort: 'confort',
  she:     'she',
  suv:     'economique',
  van:     'economique',
  truck:   'economique',
}

type VehicleOption = {
  type: VehicleType
  titleKey: TranslationKey
  seatsKey: TranslationKey
  etaMin: number
  price: number
  recommended?: boolean
}

const OPTIONS: VehicleOption[] = [
  { type: 'sedan',   titleKey: 'veh.sedan',   seatsKey: 'veh.seats4', etaMin: 3, price: 850,  recommended: true },
  { type: 'comfort', titleKey: 'veh.comfort', seatsKey: 'veh.seats4', etaMin: 4, price: 1050 },
  { type: 'she',     titleKey: 'veh.she',     seatsKey: 'veh.seats4', etaMin: 4, price: 950  },
]

// Material Design standard easing: fast start, smooth deceleration
const EASE_OUT = Easing.bezier(0.4, 0, 0.2, 1)
const EASE_IN  = Easing.bezier(0.4, 0, 1, 1)

const COLLAPSE_DURATION = 280
const EXPAND_DURATION   = 300
const DISMISS_PX = 80
const DISMISS_VY = 0.5

export default function VehicleSelect() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const setVehicleType    = useRideStore((s) => s.setVehicleType)
  const setPrice          = useRideStore((s) => s.setPrice)
  const setPaymentMethod  = useRideStore((s) => s.setPaymentMethod)
  const requestRide       = useRideStore((s) => s.requestRide)
  const setStatus         = useRideStore((s) => s.setStatus)
  const setCurrentTripId  = useRideStore((s) => s.setCurrentTripId)
  const setRouteWaypoints = useRideStore((s) => s.setRouteWaypoints)
  const from              = useRideStore((s) => s.from)
  const to                = useRideStore((s) => s.to)
  const sheMode           = useRideStore((s) => s.sheMode)
  const profile           = useUserStore((s) => s.profile)
  const payMethods        = usePaymentStore((s) => s.methods)
  const paySelectedId     = usePaymentStore((s) => s.selectedId)
  const charge            = usePaymentStore((s) => s.charge)

  const visibleOptions = sheMode ? OPTIONS.filter((o) => o.type === 'she') : OPTIONS

  const [selected, setSelected]   = useState<VehicleType>(sheMode ? 'she' : 'sedan')
  const [price, setLocalPrice]    = useState(sheMode ? 950 : 800)
  const [sheetOpen, setSheetOpen] = useState(true)
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number; waypoints: Array<{ lat: number; lng: number }> } | null>(null)

  // حساب المسافة والوقت الحقيقيين عبر OSRM فور تحديد الموقعين
  useEffect(() => {
    if (!from || !to) return
    getRouteInfo(from.lat, from.lng, to.lat, to.lng)
      .then((info) => {
        setRouteInfo(info)
        setLocalPrice(estimatePrice(selected, info.distanceKm))
        setRouteWaypoints(info.waypoints)
      })
      .catch(() => {})
  }, [from?.lat, from?.lng, to?.lat, to?.lng])

  // Use ref so PanResponder closure always reads the latest height without stale state
  const slideAnim  = useRef(new Animated.Value(0)).current
  const sheetHRef  = useRef(0)
  const animating  = useRef(false)

  function collapseSheet(fast = false) {
    if (sheetHRef.current === 0 || animating.current) return
    animating.current = true
    Animated.timing(slideAnim, {
      toValue: sheetHRef.current,
      duration: fast ? 200 : COLLAPSE_DURATION,
      easing: fast ? EASE_IN : EASE_OUT,
      useNativeDriver: true,
    }).start(() => {
      animating.current = false
      setSheetOpen(false)
    })
  }

  function expandSheet() {
    if (animating.current) return
    animating.current = true
    setSheetOpen(true)
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: EXPAND_DURATION,
      easing: EASE_OUT,
      useNativeDriver: true,
    }).start(() => { animating.current = false })
  }

  // Pan responder on the drag handle — supports tap AND swipe-down
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        // Follow finger downward only (no upward stretch)
        if (g.dy > 0) slideAnim.setValue(g.dy)
      },
      onPanResponderRelease: (_, g) => {
        const isTap = Math.abs(g.dy) < 8 && Math.abs(g.dx) < 8
        if (isTap || g.dy > DISMISS_PX || g.vy > DISMISS_VY) {
          // Collapse: finish the slide smoothly from current position
          animating.current = true
          Animated.timing(slideAnim, {
            toValue: sheetHRef.current,
            duration: 220,
            easing: EASE_IN,
            useNativeDriver: true,
          }).start(() => {
            animating.current = false
            setSheetOpen(false)
          })
        } else {
          // Snap back with a subtle bounce
          Animated.spring(slideAnim, {
            toValue: 0,
            bounciness: 5,
            speed: 14,
            useNativeDriver: true,
          }).start()
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(slideAnim, {
          toValue: 0,
          bounciness: 5,
          speed: 14,
          useNativeDriver: true,
        }).start()
      },
    })
  ).current

  async function request() {
    const payMethod = selectedMethod({ methods: payMethods, selectedId: paySelectedId })

    // Electronic wallet: charge upfront (mock). Block & offer top-up if balance is short.
    if (payMethod.type === 'wallet') {
      const ok = charge(price, 'wallet.tx.rideCharge')
      if (!ok) {
        Alert.alert(t('pay.insufficientTitle'), t('pay.insufficientMsg'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('pay.topupNow'), onPress: () => router.push('/(passenger)/topup') },
        ])
        return
      }
    }

    setVehicleType(selected)
    setPrice(price)
    setPaymentMethod(payMethod.type)

    // DB only knows cib/edahabia/cash — wallet and baridimob settle in-app.
    const dbPayment: DbPaymentMethod =
      payMethod.type === 'wallet' || payMethod.type === 'baridimob' ? 'edahabia' : payMethod.type

    if (profile?.id && from && to) {
      try {
        const trip = await createTrip({
          passengerId:   profile.id,
          fromAddress:   from.address,
          fromLat:       from.lat,
          fromLng:       from.lng,
          toAddress:     to.address,
          toLat:         to.lat,
          toLng:         to.lng,
          vehicleType:   DB_VEHICLE[selected] ?? 'economique',
          paymentMethod: dbPayment,
          price,
          distanceKm:    routeInfo?.distanceKm  ?? 5.2,
          durationMin:   routeInfo?.durationMin ?? 12,
        })
        setCurrentTripId(trip.id)
        setStatus('searching')
        router.push('/(passenger)/searching')
        return
      } catch (e) {
        if (__DEV__) console.warn('[WinRak] createTrip failed, using mock:', e)
      }
    }
    // Mock fallback (dev mode or no profile)
    requestRide()
    router.push('/(passenger)/searching')
  }

  return (
    <View style={styles.container}>
      {/* Map — always full screen */}
      <View style={StyleSheet.absoluteFill}>
        <WebMap
          route={routeInfo?.waypoints ?? mockRoutePoints}
          markers={[
            ...(from ? [{ lat: from.lat, lng: from.lng, type: 'pickup' } as MapMarker] : []),
            ...(to   ? [{ lat: to.lat,   lng: to.lng,   type: 'dropoff' } as MapMarker] : []),
          ]}
        />

        {/* Transparent tap overlay above WebMap but below TopBar/ETA.
            Only active while the sheet is open so a single tap on the map collapses it.
            Removed when sheet is hidden so the WebView receives all touches directly. */}
        {sheetOpen && (
          <Pressable style={StyleSheet.absoluteFill} onPress={() => collapseSheet()} />
        )}

        <TopBar showBack />
        <View style={styles.eta}>
          <Txt size={12} weight="bold" color={Colors.dark1}>
            {t('ride.etaMinutes', { n: routeInfo?.durationMin ?? 8 })}
            {routeInfo ? `  •  ${routeInfo.distanceKm} ${t('common.km')}` : ''}
          </Txt>
        </View>
      </View>

      {/* Bottom sheet — always rendered, slides out of view on collapse */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height
          if (h > 0) sheetHRef.current = h
        }}
      >
        {/* Drag handle: tap OR swipe-down to collapse */}
        <View style={styles.handle} {...panResponder.panHandlers}>
          <View style={styles.handlePill} />
          <Icon name="chevron-down" size={18} color={Colors.muted} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {sheMode && (
            <View style={styles.sheBanner}>
              <Icon name="human-female" size={20} color={Colors.purple} />
              <Txt size={13} color={Colors.purple} style={{ flex: 1 }}>{t('veh.sheBanner')}</Txt>
            </View>
          )}
          <Txt weight="bold" size={18} style={{ marginBottom: Spacing.md }}>{t('veh.chooseType')}</Txt>
          <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
            {visibleOptions.map((o) => (
              <VehicleCard
                key={o.type}
                type={o.type}
                title={t(o.titleKey)}
                seats={t(o.seatsKey)}
                eta={`${o.etaMin} ${t('common.min')}`}
                price={routeInfo ? estimatePrice(o.type, routeInfo.distanceKm) : o.price}
                isRecommended={o.recommended}
                isSelected={selected === o.type}
                onPress={() => {
                  setSelected(o.type)
                  setLocalPrice(routeInfo ? estimatePrice(o.type, routeInfo.distanceKm) : o.price)
                }}
              />
            ))}
          </View>

          <Txt weight="bold" size={14} style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            {t('driver.suggestPrice')}
          </Txt>
          <PriceInput
            value={price}
            onChange={setLocalPrice}
            suggestedPrices={routeInfo ? [
              Math.round(estimatePrice(selected, routeInfo.distanceKm) * 0.85 / 50) * 50,
              estimatePrice(selected, routeInfo.distanceKm),
              Math.round(estimatePrice(selected, routeInfo.distanceKm) * 1.15 / 50) * 50,
              Math.round(estimatePrice(selected, routeInfo.distanceKm) * 1.30 / 50) * 50,
            ] : [700, 850, 1000, 1200]}
            min={300}
            max={3000}
          />

          <View style={{ marginTop: Spacing.xl }}>
            <PaymentMethodPicker amount={price} label={t('pay.title')} />
          </View>

          <View style={{ height: Spacing.lg }} />
        </ScrollView>

        <View style={{ paddingBottom: insets.bottom + Spacing.md }}>
          <Button label={t('veh.request')} onPress={request} />
        </View>
      </Animated.View>

      {/* Gold pill FAB — reopen sheet when it is hidden */}
      {!sheetOpen && (
        <Pressable
          style={[styles.expandFab, { bottom: insets.bottom + Spacing.lg }]}
          onPress={expandSheet}
        >
          <Icon name="chevron-up" size={20} color={Colors.dark1} />
          <Txt size={13} weight="bold" color={Colors.dark1}>{t('veh.chooseType')}</Txt>
        </Pressable>
      )}
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    eta: {
      position: 'absolute', bottom: Spacing.lg, alignSelf: 'center',
      backgroundColor: Colors.gold, borderRadius: Spacing.radiusFull,
      paddingHorizontal: Spacing.md, paddingVertical: 6,
    },
    sheBanner: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: Colors.purpleAlpha15, borderRadius: Spacing.radiusMd,
      padding: Spacing.md, marginBottom: Spacing.md,
    },
    sheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: Colors.dark2,
      borderTopLeftRadius: Spacing.radiusLg,
      borderTopRightRadius: Spacing.radiusLg,
      maxHeight: '72%',
      padding: Spacing.screenPadding,
      paddingTop: Spacing.sm,
    },
    handle: {
      alignItems: 'center', gap: 4,
      paddingVertical: Spacing.sm,
    },
    handlePill: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: Colors.dark4,
    },
    expandFab: {
      position: 'absolute', alignSelf: 'center',
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: Colors.gold,
      paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
      borderRadius: Spacing.radiusFull,
      elevation: 4,
    },
  })
}
