import { useEffect, useMemo, useRef } from 'react'
import { Animated, Share, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/distance'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Divider } from '../../components/ui/Divider'
import { useRideStore } from '../../store/rideStore'
import { useDriverName } from '../../i18n/locale'

export default function RideCompleted() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const distanceUnit = useSettingsStore((s) => s.distanceUnit)
  const ride = useRideStore((s) => s.currentRide)
  const driverName = useDriverName()
  const scale   = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current

  const paymentLabels: Record<string, string> = useMemo(
    () => ({ baridimob: 'BaridiMob', cash: t('payment.cash'), wallet: t('payment.wallet') }),
    [t],
  )

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start()
    const timer = setTimeout(() => router.replace('/(passenger)/rating'), 3000)
    return () => clearTimeout(timer)
  }, [])

  async function handleShare() {
    if (!ride) return
    await Share.share({
      message: `رحلتي مع WinRak: ${ride.from.address} ← ${ride.to.address} | ${ride.price} ${t('common.currency')}`,
    })
  }

  if (!ride) return null

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View style={[styles.check, { transform: [{ scale }], opacity }]}>
        <Icon name="check-circle" size={64} color={Colors.success} />
      </Animated.View>
      <Txt weight="black" size={22} center>{t('rideCompleted.title')}</Txt>
      <Txt size={14} color={Colors.muted} center style={{ marginTop: 4 }}>
        {t('rideCompleted.with', { name: driverName })}
      </Txt>

      <Card radius={14} style={styles.receipt}>
        <Row icon="map-marker" label={t('search.fromLabel')} value={ride.from.address} />
        <Row icon="flag" label={t('search.toLabel')} value={ride.to.address} />
        <Divider spacing={Spacing.md} />
        <Row icon="map-marker-distance" label={t('rideCompleted.distance')} value={formatDistance(ride.distance, distanceUnit)} />
        <Row icon="clock-outline" label={t('rideCompleted.duration')} value={t('rideCompleted.durationFmt', { n: ride.duration })} />
        <Divider spacing={Spacing.md} />
        <Row icon="cash" label={t('rideCompleted.amount')} value={`${ride.price.toLocaleString('en-US')} ${t('common.currency')}`} gold />
        <Row icon="credit-card" label={t('rideCompleted.payment')} value={paymentLabels[ride.paymentMethod] ?? ride.paymentMethod} />
      </Card>

      <View style={{ height: Spacing.xl }} />
      <Button
        label={t('rideCompleted.share')}
        icon="share-variant"
        variant="outline"
        onPress={handleShare}
      />
      <Txt size={14} color={Colors.muted} center style={{ marginTop: Spacing.xl }}>{t('rating.howWas')}</Txt>
    </ScrollView>
  )
}

function Row({ icon, label, value, gold }: { icon: string; label: string; value: string; gold?: boolean }) {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  return (
    <View style={styles.row}>
      <Icon name={icon} size={18} color={gold ? Colors.gold : Colors.muted} />
      <Txt size={13} color={Colors.muted}>{label}:</Txt>
      <Txt size={13} weight={gold ? 'bold' : 'regular'} color={gold ? Colors.gold : Colors.white} style={{ flex: 1 }}>{value}</Txt>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding, paddingTop: Spacing.xxxl, alignItems: 'center' },
    check: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.successAlpha15, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
    receipt: { width: '100%', marginTop: Spacing.xl, gap: Spacing.sm },
    row: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
  })
}
