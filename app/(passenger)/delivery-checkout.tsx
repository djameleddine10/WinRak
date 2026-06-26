import { useMemo } from 'react'
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { PaymentMethodPicker } from '../../components/payment/PaymentMethodPicker'
import { TopBar } from '../../components/layout/TopBar'
import { SERVICE_FEE } from '../../mock/delivery'
import { useDeliveryStore, cartSubtotal, orderTotal, foodCartSubtotal } from '../../store/deliveryStore'
import { usePaymentStore, selectedMethod } from '../../store/paymentStore'
import { useIsRTL } from '../../i18n/locale'

export default function DeliveryCheckout() {
  const Colors = useColors()
  const isRTL = useIsRTL()
    const t = useT()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets = useSafeAreaInsets()

  const service        = useDeliveryStore((s) => s.service)
  const pharmacy       = useDeliveryStore((s) => s.pharmacy)
  const restaurant     = useDeliveryStore((s) => s.restaurant)
  const method         = useDeliveryStore((s) => s.method)
  const prescriptionUri = useDeliveryStore((s) => s.prescriptionUri)
  const cart           = useDeliveryStore((s) => s.cart)
  const foodCart       = useDeliveryStore((s) => s.foodCart)
  const dropoff        = useDeliveryStore((s) => s.dropoff)
  const note           = useDeliveryStore((s) => s.note)
  const setDropoff     = useDeliveryStore((s) => s.setDropoff)
  const setNote        = useDeliveryStore((s) => s.setNote)
  const placeOrder     = useDeliveryStore((s) => s.placeOrder)

  const payMethods    = usePaymentStore((s) => s.methods)
  const paySelectedId = usePaymentStore((s) => s.selectedId)
  const charge        = usePaymentStore((s) => s.charge)

  const isFood = service === 'food'
  const isRx   = method === 'prescription'

  if (isFood && !restaurant) return null
  if (!isFood && !pharmacy) return null

  const foodSub     = foodCartSubtotal(foodCart)
  const medSub      = cartSubtotal(cart)
  const subtotal    = isFood ? foodSub : medSub
  const deliveryFee = isFood ? (restaurant!.deliveryFee) : pharmacy!.deliveryFee
  const total       = isFood ? foodSub + deliveryFee + SERVICE_FEE : orderTotal(medSub, pharmacy!.deliveryFee)

  function confirm() {
    const payMethod = selectedMethod({ methods: payMethods, selectedId: paySelectedId })
    // Electronic wallet: settle the known total upfront (mock). Prescription orders
    // are priced after review, so they stay cash/card on delivery.
    if (payMethod.type === 'wallet' && !isRx) {
      const ok = charge(total, 'wallet.tx.orderCharge')
      if (!ok) {
        Alert.alert(t('pay.insufficientTitle'), t('pay.insufficientMsg'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('pay.topupNow'), onPress: () => router.push('/(passenger)/topup') },
        ])
        return
      }
    }
    placeOrder()
    router.replace('/(passenger)/delivery-tracking')
  }

  return (
    <View style={styles.container}>
      <TopBar title={t('checkout.title')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Merchant header */}
        <View style={styles.block}>
          <View style={styles.blockRow}>
            <View style={[styles.phIcon, { backgroundColor: isFood ? Colors.goldAlpha15 : Colors.successAlpha15 }]}>
              <Icon name={isFood ? 'silverware-fork-knife' : 'medical-bag'} size={22} color={isFood ? Colors.gold : Colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={15}>{isFood ? restaurant!.name : pharmacy!.name}</Txt>
              <Txt size={12} color={Colors.muted} style={{ marginTop: 2 }}>
                {isFood ? restaurant!.area : pharmacy!.area} · ~{isFood ? restaurant!.etaMin : pharmacy!.etaMin} {t('pharmacy.min')}
              </Txt>
            </View>
            {!isFood && pharmacy!.open24h && <Icon name="hours-24" size={22} color={Colors.success} />}
          </View>
        </View>

        {/* Order summary */}
        <Txt size={12} color={Colors.muted} style={styles.section}>{t('checkout.sectionOrder')}</Txt>
        <View style={styles.block}>
          {isFood ? (
            foodCart.map((c) => (
              <View key={c.item.id} style={styles.itemRow}>
                <Txt size={12} color={Colors.muted}>{c.qty}×</Txt>
                <Txt size={13} style={{ flex: 1 }}>{c.item.name}</Txt>
                <Txt weight="semibold" size={13}>{c.item.price * c.qty} {t('common.currency')}</Txt>
              </View>
            ))
          ) : isRx ? (
            <View style={styles.rxSummary}>
              {prescriptionUri && <Image source={{ uri: prescriptionUri }} style={styles.rxThumb} />}
              <View style={{ flex: 1 }}>
                <Txt weight="bold" size={14}>{t('checkout.rxTitle')}</Txt>
                <Txt size={12} color={Colors.muted} style={{ marginTop: 4 }}>{t('checkout.rxNote')}</Txt>
              </View>
            </View>
          ) : (
            cart.map((c) => (
              <View key={c.med.id} style={styles.itemRow}>
                <Txt size={12} color={Colors.muted}>{c.qty}×</Txt>
                <Txt size={13} style={{ flex: 1 }}>{t(c.med.nameKey)}</Txt>
                <Txt weight="semibold" size={13}>{c.med.price * c.qty} {t('common.currency')}</Txt>
              </View>
            ))
          )}
        </View>

        {/* Dropoff */}
        <Txt size={12} color={Colors.muted} style={styles.section}>{t('checkout.dropoff')}</Txt>
        <Input value={dropoff} onChangeText={setDropoff} leftIcon="map-marker" placeholder={t('checkout.dropoffPh')} />
        <View style={{ height: Spacing.sm }} />
        <Input value={note} onChangeText={setNote} leftIcon="note-text-outline" placeholder={t('parcel.note')} />

        {/* Payment */}
        <View style={styles.section}>
          <PaymentMethodPicker amount={isRx ? undefined : total} label={t('rideCompleted.payment')} />
        </View>
        {isRx && (
          <Txt size={11} color={Colors.muted} style={{ marginTop: Spacing.sm }}>{t('checkout.cashOnDelivery')}</Txt>
        )}

        {/* Price breakdown */}
        <View style={[styles.block, { marginTop: Spacing.lg }]}>
          <Row label={t('checkout.subtotal')} value={isRx ? t('checkout.byPrescription') : `${subtotal} ${t('common.currency')}`} Colors={Colors} />
          <Row label={t('checkout.deliveryFee')} value={`${deliveryFee} ${t('common.currency')}`} Colors={Colors} />
          <Row label={t('parcel.serviceFee')} value={`${SERVICE_FEE} ${t('common.currency')}`} Colors={Colors} />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Txt weight="bold" size={16}>{isRx ? t('checkout.payOnDelivery') : t('parcel.total')}</Txt>
            <Txt weight="black" size={18} color={Colors.gold}>
              {isRx
                ? `${deliveryFee + SERVICE_FEE} ${t('common.currency')} +`
                : `${total} ${t('common.currency')}`}
            </Txt>
          </View>
          {isRx && <Txt size={11} color={Colors.muted} style={{ marginTop: 4 }}>{t('checkout.rxPriceNote')}</Txt>}
        </View>

        <View style={{ height: Spacing.lg }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button label={t('checkout.orderNow')} icon="moped" onPress={confirm} />
      </View>
    </View>
  )
}

function Row({ label, value, Colors }: { label: string; value: string; Colors: Palette }) {
  const isRTL = useIsRTL()
  return (
    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Txt size={13} color={Colors.muted}>{label}</Txt>
      <Txt size={13}>{value}</Txt>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding },
    section: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
    block: { backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.md },
    blockRow: { flexDirection: row, alignItems: 'center', gap: Spacing.md },
    phIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.successAlpha15, alignItems: 'center', justifyContent: 'center' },
    rxSummary: { flexDirection: row, gap: Spacing.md },
    rxThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: Colors.dark3 },
    itemRow: { flexDirection: row, alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
    totalRow: { flexDirection: row, justifyContent: 'space-between', alignItems: 'center' },
    footer: {
      backgroundColor: Colors.dark2, borderTopWidth: 1, borderTopColor: Colors.border,
      paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md,
    },
  })
}
