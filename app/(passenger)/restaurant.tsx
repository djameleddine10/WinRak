import { useEffect, useMemo } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Button } from '../../components/ui/Button'
import { TopBar } from '../../components/layout/TopBar'
import { useRestaurantStore, allRestaurants } from '../../store/restaurantStore'
import { useDeliveryStore, foodCartCount, foodCartSubtotal } from '../../store/deliveryStore'

export default function RestaurantScreen() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const registered  = useRestaurantStore((s) => s.registered)
  const restaurants = useRestaurantStore((s) => s.restaurants)
  const r = allRestaurants(registered, restaurants).find((x) => x.id === id)

  const foodCart        = useDeliveryStore((s) => s.foodCart)
  const selectRestaurant = useDeliveryStore((s) => s.selectRestaurant)
  const addFoodItem     = useDeliveryStore((s) => s.addFoodItem)
  const decrementFood   = useDeliveryStore((s) => s.decrementFood)
  const setService      = useDeliveryStore((s) => s.setService)

  const foodCount    = foodCartCount(foodCart)
  const foodSubtotal = foodCartSubtotal(foodCart)
  const qtyOf        = (itemId: string) => foodCart.find((c) => c.item.id === itemId)?.qty ?? 0

  // Clear cart when switching to a different restaurant
  useEffect(() => {
    if (r) selectRestaurant(r)
  }, [r?.id])

  if (!r) return null

  function contactReception() {
    router.push({ pathname: '/(passenger)/restaurant-chat', params: { id: r!.id } })
  }

  function goCheckout() {
    setService('food')
    router.push('/(passenger)/delivery-checkout')
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Icon name={r.icon} size={84} color={Colors.gold} />
        <TopBar showBack />
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={{ padding: Spacing.screenPadding, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Txt weight="black" size={20} style={{ flex: 1 }}>{r.name}</Txt>
          <View style={[styles.statusPill, { backgroundColor: r.isOpen ? Colors.successAlpha15 : Colors.dangerAlpha10 }]}>
            <Txt size={12} weight="bold" color={r.isOpen ? Colors.success : Colors.danger}>{r.isOpen ? t('rest.openNow') : t('food.closed')}</Txt>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Icon name="star" size={15} color={Colors.gold} />
          <Txt size={13} color={Colors.muted}>{r.rating}</Txt>
          <Txt size={13} color={Colors.muted}>· {t(r.cuisineLabelKey)}</Txt>
          <Icon name="map-marker-outline" size={15} color={Colors.muted} />
          <Txt size={13} color={Colors.muted}>{r.area}</Txt>
        </View>
        <View style={styles.metaRow}>
          <Icon name="moped" size={15} color={Colors.muted} />
          <Txt size={13} color={Colors.muted}>{t('rest.etaDelivery', { n: r.etaMin, unit: t('common.min'), fee: r.deliveryFee, currency: t('common.currency') })}</Txt>
        </View>

        {/* Reception */}
        <View style={styles.reception}>
          <View style={styles.recAvatar}>
            <Icon name="account-tie" size={24} color={Colors.gold} />
            <View style={styles.onlineDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size={14}>{t('rest.receptionLabel', { name: r.reception })}</Txt>
            <Txt size={12} color={Colors.success} style={{ marginTop: 2 }}>{t('rest.online')}</Txt>
          </View>
          <Icon name="message-text-outline" size={22} color={Colors.gold} />
        </View>

        {/* Menu */}
        <Txt size={12} color={Colors.muted} style={styles.section}>{t('rest.menu')}</Txt>
        {r.menu.length === 0 ? (
          <View style={styles.emptyMenu}>
            <Txt size={13} color={Colors.muted} center>{t('rest.emptyMenu')}</Txt>
          </View>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {r.menu.map((m) => {
              const q = qtyOf(m.id)
              return (
                <View key={m.id} style={styles.menuRow}>
                  <View style={{ flex: 1 }}>
                    <Txt size={14}>{m.name}</Txt>
                    <Txt weight="bold" size={13} color={Colors.gold} style={{ marginTop: 2 }}>{m.price} {t('common.currency')}</Txt>
                  </View>
                  {q === 0 ? (
                    <Pressable style={styles.addBtn} onPress={() => addFoodItem(m)} hitSlop={6}>
                      <Icon name="plus" size={18} color={Colors.dark1} />
                    </Pressable>
                  ) : (
                    <View style={styles.stepper}>
                      <Pressable style={styles.stepBtn} onPress={() => addFoodItem(m)} hitSlop={6}>
                        <Icon name="plus" size={16} color={Colors.gold} />
                      </Pressable>
                      <Txt weight="bold" size={15}>{q}</Txt>
                      <Pressable style={styles.stepBtn} onPress={() => decrementFood(m.id)} hitSlop={6}>
                        <Icon name="minus" size={16} color={Colors.gold} />
                      </Pressable>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        {foodCount > 0 && (
          <Pressable style={styles.cartBar} onPress={goCheckout}>
            <View style={{ flex: 1 }}>
              <Txt size={12} color={Colors.dark1}>{t('rest.cartCount', { n: String(foodCount) })}</Txt>
              <Txt weight="bold" size={16} color={Colors.dark1}>{foodSubtotal.toLocaleString('en-US')} {t('common.currency')}</Txt>
            </View>
            <Icon name="arrow-right" size={22} color={Colors.dark1} />
          </Pressable>
        )}
        <View style={styles.footerRow}>
          <View style={{ flex: 1 }}>
            <Button label={t('rest.contactReception')} icon="message-text" onPress={contactReception} />
          </View>
          <Button label={t('common.call')} variant="outline" icon="phone" fullWidth={false} style={{ paddingHorizontal: Spacing.lg }} onPress={() => Alert.alert(r.name, t('rest.callAlert', { phone: r.phone }))} />
        </View>
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    hero: { height: '26%', backgroundColor: Colors.dark2, alignItems: 'center', justifyContent: 'center' },
    sheet: {
      flex: 1, backgroundColor: Colors.dark1,
      borderTopLeftRadius: Spacing.radiusLg, borderTopRightRadius: Spacing.radiusLg, marginTop: -Spacing.radiusLg,
    },
    titleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
    statusPill: { borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.md, paddingVertical: 4 },
    metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: Spacing.sm, flexWrap: 'wrap' },
    reception: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.md, marginTop: Spacing.lg,
    },
    recAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.goldAlpha10, alignItems: 'center', justifyContent: 'center' },
    onlineDot: {
      position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6,
      backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.dark2,
    },
    section: { marginTop: Spacing.xl, marginBottom: Spacing.sm },
    emptyMenu: { backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.lg },
    menuRow: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.md,
    },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
    stepper: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: Colors.dark3, borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.sm, paddingVertical: 4,
    },
    stepBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.goldAlpha15, alignItems: 'center', justifyContent: 'center' },
    footer: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      gap: Spacing.sm,
      backgroundColor: Colors.dark2, borderTopWidth: 1, borderTopColor: Colors.border,
      paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md,
    },
    cartBar: {
      backgroundColor: Colors.gold, borderRadius: Spacing.radiusMd,
      padding: Spacing.md, flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
    },
    footerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
  })
}
