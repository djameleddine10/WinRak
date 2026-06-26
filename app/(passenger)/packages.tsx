import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { TopBar } from '../../components/layout/TopBar'
import { parcelTypes, SERVICE_FEE } from '../../mock/delivery'
import { useDeliveryStore, parcelTotal } from '../../store/deliveryStore'
import { useT } from '../../hooks/useT'
import { useIsRTL } from '../../i18n/locale'

export default function Packages() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets = useSafeAreaInsets()

  const parcelFrom = useDeliveryStore((s) => s.parcelFrom)
  const parcelTo = useDeliveryStore((s) => s.parcelTo)
  const parcelType = useDeliveryStore((s) => s.parcelType)
  const recipientName = useDeliveryStore((s) => s.recipientName)
  const recipientPhone = useDeliveryStore((s) => s.recipientPhone)
  const note = useDeliveryStore((s) => s.note)
  const setParcelFrom = useDeliveryStore((s) => s.setParcelFrom)
  const setParcelTo = useDeliveryStore((s) => s.setParcelTo)
  const setParcelType = useDeliveryStore((s) => s.setParcelType)
  const setRecipientName = useDeliveryStore((s) => s.setRecipientName)
  const setRecipientPhone = useDeliveryStore((s) => s.setRecipientPhone)
  const setNote = useDeliveryStore((s) => s.setNote)
  const placeOrder = useDeliveryStore((s) => s.placeOrder)
  const t = useT()
  const cur = t('common.currency')

  const valid = !!parcelType && parcelTo.trim().length > 0 && recipientName.trim().length > 0 && recipientPhone.trim().length > 0
  const total = parcelTotal(parcelType)

  function confirm() {
    if (!valid) return
    placeOrder()
    router.replace('/(passenger)/delivery-tracking')
  }

  return (
    <View style={styles.container}>
      <TopBar title={t('parcel.title')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Route */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <Icon name="circle-slice-8" size={16} color={Colors.gold} />
            <Input value={parcelFrom} onChangeText={setParcelFrom} placeholder={t('parcel.pickupPlaceholder')} />
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <Icon name="map-marker" size={18} color={Colors.success} />
            <Input value={parcelTo} onChangeText={setParcelTo} placeholder={t('parcel.dropoffPlaceholder')} />
          </View>
        </View>

        {/* Parcel type */}
        <Txt size={12} color={Colors.muted} style={styles.section}>{t('parcel.type')}</Txt>
        <View style={{ gap: Spacing.sm }}>
          {parcelTypes.map((p) => {
            const active = parcelType?.id === p.id
            return (
              <Pressable key={p.id} onPress={() => setParcelType(p)}>
                <View style={[styles.typeRow, active && styles.typeRowActive]}>
                  <View style={[styles.typeIcon, { backgroundColor: active ? Colors.goldAlpha15 : Colors.dark3 }]}>
                    <Icon name={p.icon} size={24} color={active ? Colors.gold : Colors.muted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt weight="bold" size={14}>{t(p.labelKey)}</Txt>
                    <Txt size={11} color={Colors.muted} style={{ marginTop: 2 }}>{t(p.hintKey)}</Txt>
                  </View>
                  <Txt weight="bold" size={14} color={Colors.gold}>{p.basePrice} {cur}</Txt>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>

        {/* Recipient */}
        <Txt size={12} color={Colors.muted} style={styles.section}>{t('parcel.recipient')}</Txt>
        <Input value={recipientName} onChangeText={setRecipientName} leftIcon="account-outline" placeholder={t('parcel.recipientName')} />
        <View style={{ height: Spacing.sm }} />
        <Input value={recipientPhone} onChangeText={setRecipientPhone} type="phone" placeholder={t('parcel.recipientPhone')} />
        <View style={{ height: Spacing.sm }} />
        <Input value={note} onChangeText={setNote} leftIcon="note-text-outline" placeholder={t('parcel.note')} />

        {/* Price */}
        <View style={[styles.priceCard, { marginTop: Spacing.lg }]}>
          <Row label={t('parcel.deliveryPrice')} value={parcelType ? `${parcelType.basePrice} ${cur}` : '—'} Colors={Colors} />
          <Row label={t('parcel.serviceFee')} value={`${SERVICE_FEE} ${cur}`} Colors={Colors} />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Txt weight="bold" size={16}>{t('parcel.total')}</Txt>
            <Txt weight="black" size={18} color={Colors.gold}>{parcelType ? `${total} ${cur}` : '—'}</Txt>
          </View>
          <Txt size={11} color={Colors.muted} style={{ marginTop: 4 }}>{t('parcel.cashOnDelivery')}</Txt>
        </View>

        <View style={{ height: Spacing.lg }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button label={t('parcel.order')} icon="moped" disabled={!valid} onPress={confirm} />
      </View>
    </View>
  )
}

function Row({ label, value, Colors }: { label: string; value: string; Colors: Palette }) {
  return (
    <View style={{ flexDirection: row, justifyContent: 'space-between', paddingVertical: 4 }}>
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
    routeCard: { backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.md },
    routeRow: { flexDirection: row, alignItems: 'center', gap: Spacing.sm },
    routeLine: { width: 1, height: 16, backgroundColor: Colors.dark4, marginRight: 8, marginVertical: 2 },
    section: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
    typeRow: {
      flexDirection: row, alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd,
      borderWidth: 1.5, borderColor: 'transparent', padding: Spacing.md,
    },
    typeRowActive: { borderColor: Colors.gold },
    typeIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    radio: {
      width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.dark4,
      alignItems: 'center', justifyContent: 'center',
    },
    radioActive: { borderColor: Colors.gold },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gold },
    priceCard: { backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.md },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
    totalRow: { flexDirection: row, justifyContent: 'space-between', alignItems: 'center' },
    footer: {
      backgroundColor: Colors.dark2, borderTopWidth: 1, borderTopColor: Colors.border,
      paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md,
    },
  })
}
