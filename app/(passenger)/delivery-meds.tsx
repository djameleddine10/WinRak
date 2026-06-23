import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { DirIcon } from '../../components/ui/DirIcon'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Button } from '../../components/ui/Button'
import { TopBar } from '../../components/layout/TopBar'
import { commonMeds, medCategories, type MedCategory } from '../../mock/delivery'
import { useDeliveryStore, cartCount, cartSubtotal } from '../../store/deliveryStore'

type Filter = 'all' | MedCategory

export default function DeliveryMeds() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()

  const cart = useDeliveryStore((s) => s.cart)
  const addToCart = useDeliveryStore((s) => s.addToCart)
  const decrement = useDeliveryStore((s) => s.decrement)
  const pharmacy = useDeliveryStore((s) => s.pharmacy)

  const [filter, setFilter] = useState<Filter>('all')
  const meds = filter === 'all' ? commonMeds : commonMeds.filter((m) => m.category === filter)
  const qtyOf = (id: string) => cart.find((c) => c.med.id === id)?.qty ?? 0

  const count = cartCount(cart)
  const subtotal = cartSubtotal(cart)

  return (
    <View style={styles.container}>
      <TopBar title={t('meds.title')} showBack rightAction={pharmacy ? <Txt size={12} color={Colors.muted}>{pharmacy.name}</Txt> : undefined} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsWrap} contentContainerStyle={styles.chips}>
        <CategoryChip label={t('meds.filterAll')} icon="view-grid-outline" active={filter === 'all'} onPress={() => setFilter('all')} />
        {medCategories.map((c) => (
          <CategoryChip key={c.key} label={t(c.labelKey)} icon={c.icon} active={filter === c.key} onPress={() => setFilter(c.key)} />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {meds.map((m) => {
          const q = qtyOf(m.id)
          return (
            <View key={m.id} style={styles.medRow}>
              <View style={styles.medIcon}>
                <Icon name={m.icon} size={26} color={Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="bold" size={14}>{t(m.nameKey)}</Txt>
                <Txt size={11} color={Colors.muted} style={{ marginTop: 2 }}>{t(m.detailKey)}</Txt>
                <Txt weight="bold" size={13} color={Colors.gold} style={{ marginTop: 4 }}>{m.price} {t('common.currency')}</Txt>
              </View>
              {q === 0 ? (
                <Pressable style={styles.addBtn} onPress={() => addToCart(m)} hitSlop={6}>
                  <Icon name="plus" size={18} color={Colors.dark1} />
                </Pressable>
              ) : (
                <View style={styles.stepper}>
                  <Pressable style={styles.stepBtn} onPress={() => addToCart(m)} hitSlop={6}>
                    <Icon name="plus" size={16} color={Colors.gold} />
                  </Pressable>
                  <Txt weight="bold" size={15}>{q}</Txt>
                  <Pressable style={styles.stepBtn} onPress={() => decrement(m.id)} hitSlop={6}>
                    <Icon name="minus" size={16} color={Colors.gold} />
                  </Pressable>
                </View>
              )}
            </View>
          )
        })}
        <View style={{ height: 120 }} />
      </ScrollView>

      {count > 0 && (
        <View style={[styles.bar, { paddingBottom: insets.bottom + Spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Txt size={12} color={Colors.muted}>{t('meds.itemCount', { n: count })}</Txt>
            <Txt weight="bold" size={16} color={Colors.gold}>{subtotal} {t('common.currency')}</Txt>
          </View>
          <Button label={t('meds.continue')} icon="arrow-right" iconPosition="right" fullWidth={false} style={{ paddingHorizontal: Spacing.xxl }} onPress={() => router.push('/(passenger)/delivery-checkout')} />
        </View>
      )}
    </View>
  )
}

function CategoryChip({ label, icon, active, onPress }: { label: string; icon: string; active: boolean; onPress: () => void }) {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Icon name={icon} size={16} color={active ? Colors.dark1 : Colors.muted} />
      <Txt size={12} weight="semibold" color={active ? Colors.dark1 : Colors.white}>{label}</Txt>
    </Pressable>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    chipsWrap: { flexGrow: 0, flexDirection: 'row-reverse' },
    chips: { flexDirection: 'row-reverse', gap: Spacing.sm, paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.md },
    chip: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
      backgroundColor: Colors.dark3, borderRadius: Spacing.radiusFull,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    chipActive: { backgroundColor: Colors.gold },
    list: { paddingHorizontal: Spacing.screenPadding, gap: Spacing.sm },
    medRow: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.md,
    },
    medIcon: { width: 50, height: 50, borderRadius: 12, backgroundColor: Colors.goldAlpha10, alignItems: 'center', justifyContent: 'center' },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
    stepper: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: Colors.dark3, borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.sm, paddingVertical: 4,
    },
    stepBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.goldAlpha15, alignItems: 'center', justifyContent: 'center' },
    bar: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark2, borderTopWidth: 1, borderTopColor: Colors.border,
      paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md,
    },
  })
}
