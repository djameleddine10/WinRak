import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { DirIcon } from '../../components/ui/DirIcon'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Badge'
import { TopBar } from '../../components/layout/TopBar'
import { useRestaurantStore, allRestaurants } from '../../store/restaurantStore'
import { type Restaurant } from '../../mock/restaurants'
import { useIsRTL } from '../../i18n/locale'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function DeliveryFood() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const insets = useSafeAreaInsets()
    const t = useT()

  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const registered      = useRestaurantStore((s) => s.registered)
  const restaurants     = useRestaurantStore((s) => s.restaurants)
  const loadRestaurants = useRestaurantStore((s) => s.loadRestaurants)
  const list            = allRestaurants(registered, restaurants)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRestaurants().finally(() => setLoading(false))
  }, [])

  function open(r: Restaurant) {
    router.push({ pathname: '/(passenger)/restaurant', params: { id: r.id } })
  }

  const ListHeader = useMemo(() => (
    <>
      {/* Register your restaurant */}
      <Pressable style={styles.banner} onPress={() => router.push('/(passenger)/restaurant-signup')}>
        <View style={styles.bannerIcon}><Icon name="store-plus" size={28} color={Colors.dark1} /></View>
        <View style={{ flex: 1 }}>
          <Txt weight="bold" size={15} color={Colors.dark1}>{t('food.registerBanner')}</Txt>
          <Txt size={12} color={Colors.dark1} style={{ marginTop: 2 }}>{t('food.registerSub')}</Txt>
        </View>
        <DirIcon name="chevron-right" size={24} color={Colors.dark1} />
      </Pressable>
      <Txt size={12} color={Colors.muted} style={styles.section}>{t('food.nearby')}</Txt>
      {loading && <ActivityIndicator color={Colors.gold} style={{ marginTop: Spacing.xl }} />}
    </>
  ), [loading, Colors, t, styles])

  return (
    <View style={styles.container}>
      <TopBar title={t('food.title')} showBack />
      <FlatList
        data={loading ? [] : list}
        keyExtractor={(r) => r.id}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <Icon name="store-off-outline" size={40} color={Colors.dark4} />
            <Txt size={14} color={Colors.muted}>{t('food.noRestaurants')}</Txt>
          </View>
        ) : null}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        renderItem={({ item: r }) => (
          <Pressable onPress={() => open(r)}>
            <View style={styles.card}>
              <View style={styles.thumb}><Icon name={r.icon} size={32} color={Colors.gold} /></View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Txt weight="bold" size={15} numberOfLines={1} style={{ flex: 1 }}>{r.name}</Txt>
                  {r.isOpen
                    ? <Badge label={t('food.open')} variant="green" size="sm" />
                    : <Badge label={t('food.closed')} variant="red" size="sm" />}
                </View>
                <Txt size={12} color={Colors.muted} style={{ marginTop: 2 }}>{t(r.cuisineLabelKey)} · {r.area}</Txt>
                <View style={styles.meta}>
                  <Icon name="star" size={13} color={Colors.gold} />
                  <Txt size={11} color={Colors.muted}>{r.rating}</Txt>
                  <Icon name="moped" size={13} color={Colors.muted} />
                  <Txt size={11} color={Colors.muted}>{t('food.etaDelivery', { eta: r.etaMin, unit: t('common.min'), fee: r.deliveryFee, currency: t('common.currency') })}</Txt>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding, paddingBottom: Spacing.xl },
    banner: {
      flexDirection: row, alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.gold, borderRadius: Spacing.radiusLg, padding: Spacing.lg,
    },
    bannerIcon: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.12)',
      alignItems: 'center', justifyContent: 'center',
    },
    section: { marginTop: Spacing.xl, marginBottom: Spacing.sm },
    card: {
      flexDirection: row, alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.md,
    },
    thumb: { width: 60, height: 60, borderRadius: 14, backgroundColor: Colors.goldAlpha10, alignItems: 'center', justifyContent: 'center' },
    titleRow: { flexDirection: row, alignItems: 'center', gap: Spacing.sm },
    meta: { flexDirection: row, alignItems: 'center', gap: 4, marginTop: 6 },
    empty: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xxl, opacity: 0.5 },
  })
}
