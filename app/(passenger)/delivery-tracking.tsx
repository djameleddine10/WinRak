import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native'
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
import { WebMap, type MapMarker } from '../../components/map/WebMap'
import { mockRoutePoints } from '../../mock/map'
import { mockCourier } from '../../mock/delivery'
import { useDeliveryStore, type DeliveryStatus } from '../../store/deliveryStore'
import { useDriverRouteSimulator } from '../../hooks/useDriverRouteSimulator'
import { supabase } from '../../lib/supabase'
import { useIsRTL } from '../../i18n/locale'

const ORDER: DeliveryStatus[] = ['finding', 'confirmed', 'preparing', 'on_the_way', 'delivered']

interface CourierInfo {
  name:       string
  vehicleKey: string
  plate:      string
  rating:     number
  etaMin:     number
  driverId:   string | null
}

export default function DeliveryTracking() {
  const Colors = useColors()
  const isRTL = useIsRTL()
    const t = useT()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets = useSafeAreaInsets()

  const status        = useDeliveryStore((s) => s.status)
  const service       = useDeliveryStore((s) => s.service)
  const currentOrderId = useDeliveryStore((s) => s.currentOrderId)
  const markDelivered = useDeliveryStore((s) => s.markDelivered)
  const reset         = useDeliveryStore((s) => s.reset)

  // Real courier info — falls back to mock until Supabase assigns a driver
  const [courier, setCourier] = useState<CourierInfo>({
    name:       mockCourier.name,
    vehicleKey: mockCourier.vehicleKey,
    plate:      mockCourier.plate,
    rating:     mockCourier.rating,
    etaMin:     mockCourier.etaMin,
    driverId:   null,
  })

  // Real courier GPS position (when a driver_id is assigned to the order)
  const [courierGps, setCourierGps] = useState<{ lat: number; lng: number; heading: number } | null>(null)

  // Fetch real courier info when order is confirmed and a driver is assigned
  useEffect(() => {
    if (!currentOrderId) return

    let locationChannel: ReturnType<typeof supabase.channel> | null = null

    async function fetchCourier(driverId: string) {
      const [locRes, profileRes, driverRes] = await Promise.all([
        supabase.from('driver_locations').select('lat, lng, heading').eq('driver_id', driverId).maybeSingle(),
        supabase.from('profiles').select('full_name').eq('id', driverId).maybeSingle(),
        supabase.from('drivers').select('rating, vehicle_type, vehicle_plate').eq('id', driverId).maybeSingle(),
      ])

      if (locRes.data) {
        setCourierGps({ lat: locRes.data.lat, lng: locRes.data.lng, heading: locRes.data.heading ?? 0 })
      }

      setCourier((prev) => ({
        ...prev,
        driverId,
        name:       profileRes.data?.full_name ?? prev.name,
        vehicleKey: driverRes.data?.vehicle_type ? `courier.${driverRes.data.vehicle_type}` : prev.vehicleKey,
        plate:      driverRes.data?.vehicle_plate ?? prev.plate,
        rating:     driverRes.data?.rating ?? prev.rating,
      }))

      // Subscribe to this driver's GPS updates
      locationChannel = supabase
        .channel(`courier-loc-${driverId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${driverId}` }, (payload) => {
          const r = payload.new as { lat: number; lng: number; heading: number }
          setCourierGps({ lat: r.lat, lng: r.lng, heading: r.heading ?? 0 })
        })
        .subscribe()
    }

    // Subscribe to delivery order changes (admin assigns driver → driver_id appears)
    const orderChannel = supabase
      .channel(`delivery-order-${currentOrderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'delivery_orders', filter: `id=eq.${currentOrderId}` }, async (payload) => {
        const updated = payload.new as { driver_id?: string | null; eta_min?: number | null }
        if (updated.driver_id && updated.driver_id !== courier.driverId) {
          await fetchCourier(updated.driver_id)
        }
        if (updated.eta_min) {
          setCourier((prev) => ({ ...prev, etaMin: updated.eta_min! }))
        }
      })
      .subscribe()

    // Also try to load driver immediately (order might already have one)
    supabase
      .from('delivery_orders')
      .select('driver_id, eta_min')
      .eq('id', currentOrderId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.driver_id) fetchCourier(data.driver_id)
        if (data?.eta_min) setCourier((prev) => ({ ...prev, etaMin: data.eta_min! }))
      })

    return () => {
      supabase.removeChannel(orderChannel)
      if (locationChannel) supabase.removeChannel(locationChannel)
    }
  }, [currentOrderId])

  // ETA countdown — starts when courier goes on_the_way
  const [etaSec, setEtaSec] = useState<number | null>(null)
  const etaRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (status === 'on_the_way' && etaSec === null) setEtaSec(courier.etaMin * 60)
  }, [status])
  useEffect(() => {
    if (etaSec === null || status !== 'on_the_way') return
    etaRef.current = setInterval(() => setEtaSec((s) => (s !== null && s > 1 ? s - 1 : 0)), 1000)
    return () => { if (etaRef.current) clearInterval(etaRef.current) }
  }, [etaSec !== null, status])
  const etaMin = etaSec !== null ? Math.max(0, Math.ceil(etaSec / 60)) : courier.etaMin

  // Visual route simulation — used only when no real GPS is available
  const active = status === 'on_the_way'
  const { position: simulatedPos, heading: simulatedHeading } = useDriverRouteSimulator(
    active && !courierGps ? mockRoutePoints : null,
    active && !courierGps,
  )

  const courierPos     = courierGps ?? simulatedPos
  const courierHeading = courierGps?.heading ?? simulatedHeading

  const isParcel = service === 'parcel'
  const isFood   = service === 'food'
  const copy = useMemo(() => ({
    finding: t(isParcel ? 'tracking.parcel.finding' : isFood ? 'tracking.food.finding' : 'tracking.pharmacy.finding'),
    header:  t(isParcel ? 'tracking.parcel.header'  : isFood ? 'tracking.food.header'  : 'tracking.pharmacy.header'),
    done:    t(isParcel ? 'tracking.parcel.done'    : isFood ? 'tracking.food.done'    : 'tracking.pharmacy.done'),
    steps: isParcel
      ? [
          { label: t('tracking.parcel.s1'),   icon: 'receipt' },
          { label: t('tracking.parcel.s2'),   icon: 'package-up' },
          { label: t('tracking.parcel.s3'),   icon: 'moped' },
          { label: t('tracking.parcel.s4'),   icon: 'check-circle' },
        ]
      : isFood
      ? [
          { label: t('tracking.food.s1'),     icon: 'receipt' },
          { label: t('tracking.food.s2'),     icon: 'chef-hat' },
          { label: t('tracking.food.s3'),     icon: 'moped' },
          { label: t('tracking.food.s4'),     icon: 'check-circle' },
        ]
      : [
          { label: t('tracking.pharmacy.s1'), icon: 'receipt' },
          { label: t('tracking.pharmacy.s2'), icon: 'store' },
          { label: t('tracking.pharmacy.s3'), icon: 'moped' },
          { label: t('tracking.pharmacy.s4'), icon: 'check-circle' },
        ],
  }), [t, isParcel, isFood])

  const idx           = ORDER.indexOf(status)
  const finding       = status === 'finding'
  const delivered     = status === 'delivered'
  const courierVisible = idx >= 1 && !delivered

  function goHome() {
    reset()
    router.replace('/(passenger)/(tabs)/home')
  }

  const markers: MapMarker[] = [
    { lat: mockRoutePoints[4].lat, lng: mockRoutePoints[4].lng, type: 'pin' },
    { lat: mockRoutePoints[0].lat, lng: mockRoutePoints[0].lng, type: 'dest' },
    ...(courierVisible ? [{
      lat:     active ? courierPos.lat : mockRoutePoints[2].lat,
      lng:     active ? courierPos.lng : mockRoutePoints[2].lng,
      heading: active ? courierHeading : 270,
      type:    'car' as const,
    }] : []),
  ]

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <WebMap route={mockRoutePoints} markers={markers} />
        <TopBar showBack onBack={goHome} />
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {finding ? (
            <View style={styles.finding}>
              <ActivityIndicator color={Colors.gold} />
              <Txt weight="bold" size={15}>{copy.finding}</Txt>
            </View>
          ) : delivered ? (
            <View style={styles.doneBanner}>
              <Icon name="check-circle" size={26} color={Colors.success} />
              <Txt weight="bold" size={16} color={Colors.success}>{copy.done}</Txt>
            </View>
          ) : (
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Txt weight="black" size={18}>{copy.header}</Txt>
                <Txt size={13} color={Colors.muted} style={{ marginTop: 2 }}>{t('tracking.arrivalEta', { n: String(etaMin), unit: t('common.min') })}</Txt>
              </View>
              <View style={styles.etaPill}><Txt weight="bold" size={13} color={Colors.dark1}>{etaMin} {t('common.min')}</Txt></View>
            </View>
          )}

          {/* Steps */}
          <View style={styles.steps}>
            {copy.steps.map((s, i) => {
              const reqIndex = i + 1
              const done   = idx > reqIndex
              const active = idx === reqIndex
              const tint   = done ? Colors.success : active ? Colors.gold : Colors.dark4
              return (
                <View key={reqIndex} style={styles.step}>
                  <View style={[styles.stepIcon, { backgroundColor: done ? Colors.successAlpha15 : active ? Colors.goldAlpha15 : Colors.dark3 }]}>
                    <Icon name={done ? 'check' : s.icon} size={18} color={tint} />
                  </View>
                  <Txt size={14} weight={active ? 'bold' : 'regular'} color={active || done ? Colors.white : Colors.muted} style={{ flex: 1 }}>
                    {s.label}
                  </Txt>
                  {active && <View style={styles.activeDot} />}
                </View>
              )
            })}
          </View>

          {/* Courier */}
          {courierVisible && !delivered && (
            <View style={styles.courier}>
              <View style={styles.courierAvatar}><Icon name="account" size={26} color={Colors.gold} /></View>
              <View style={{ flex: 1 }}>
                <Txt weight="bold" size={14}>{courier.name}</Txt>
                <View style={styles.courierMeta}>
                  <Icon name="moped" size={14} color={Colors.muted} />
                  <Txt size={11} color={Colors.muted}>{t(courier.vehicleKey as any)} · {courier.plate}</Txt>
                </View>
              </View>
              <View style={styles.courierRating}>
                <Icon name="star" size={14} color={Colors.gold} />
                <Txt size={12} weight="bold">{courier.rating.toFixed(1)}</Txt>
              </View>
              <Pressable style={styles.callBtn} hitSlop={6}>
                <Icon name="phone" size={20} color={Colors.dark1} />
              </Pressable>
            </View>
          )}

          <View style={{ height: Spacing.lg }} />
        </ScrollView>

        {status === 'on_the_way' && (
          <Button label={t('tracking.sim')} variant="outline" onPress={markDelivered} />
        )}
        {delivered && (
          <Button label={t('tracking.goHome')} icon="home" onPress={goHome} />
        )}
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    map: { height: '42%' },
    sheet: {
      flex: 1, backgroundColor: Colors.dark2,
      borderTopLeftRadius: Spacing.radiusLg, borderTopRightRadius: Spacing.radiusLg,
      marginTop: -Spacing.radiusLg, padding: Spacing.screenPadding,
    },
    finding: { flexDirection: row, alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
    doneBanner: {
      flexDirection: row, alignItems: 'center', gap: Spacing.sm,
      backgroundColor: Colors.successAlpha15, borderRadius: Spacing.radiusMd, padding: Spacing.md,
    },
    headerRow: { flexDirection: row, alignItems: 'center', gap: Spacing.md },
    etaPill: { backgroundColor: Colors.gold, borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.md, paddingVertical: 6 },
    steps: { marginTop: Spacing.lg, gap: Spacing.md },
    step: { flexDirection: row, alignItems: 'center', gap: Spacing.md },
    stepIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gold },
    courier: {
      flexDirection: row, alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd, padding: Spacing.md, marginTop: Spacing.lg,
    },
    courierAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.goldAlpha10, alignItems: 'center', justifyContent: 'center' },
    courierMeta: { flexDirection: row, alignItems: 'center', gap: 4, marginTop: 4 },
    courierRating: { flexDirection: row, alignItems: 'center', gap: 4 },
    callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  })
}
