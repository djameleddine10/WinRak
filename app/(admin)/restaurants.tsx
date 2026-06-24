import { useCallback, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useFocusEffect, router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { TopBar } from '../../components/layout/TopBar'
import {
  adminListRestaurants, adminDeleteRestaurant, adminSetRestaurantStatus,
  type AdminRestaurant,
} from '../../services/admin.service'

export default function AdminRestaurants() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const [list, setList] = useState<AdminRestaurant[]>([])

  useFocusEffect(useCallback(() => {
    adminListRestaurants().then(setList).catch(console.warn)
  }, []))

  function handleDelete(r: AdminRestaurant) {
    Alert.alert(r.name, t('admin.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'), style: 'destructive',
        onPress: () => adminDeleteRestaurant(r.id)
          .then(() => setList((l) => l.filter((x) => x.id !== r.id)))
          .catch((e) => Alert.alert('Error', e.message)),
      },
    ])
  }

  function handleToggleStatus(r: AdminRestaurant) {
    const next = r.status === 'active' ? 'pending' : 'active'
    adminSetRestaurantStatus(r.id, next)
      .then(() => setList((l) => l.map((x) => x.id === r.id ? { ...x, status: next } : x)))
      .catch((e) => Alert.alert('Error', e.message))
  }

  return (
    <View style={styles.container}>
      <TopBar title={t('admin.restaurants')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {list.length === 0 && (
          <Txt size={14} color={Colors.muted} center style={{ marginTop: Spacing.xl }}>{t('admin.noRestaurants')}</Txt>
        )}
        {list.map((r) => (
          <View key={r.id} style={styles.row}>
            <Pressable style={styles.rowMain} onPress={() => router.push({ pathname: '/(admin)/restaurant-form', params: { id: r.id } })}>
              <View style={styles.icon}><Icon name={r.icon ?? 'store'} size={24} color={Colors.gold} /></View>
              <View style={{ flex: 1 }}>
                <Txt weight="bold" size={14} numberOfLines={1}>{r.name}</Txt>
                <Txt size={12} color={Colors.muted}>{r.area}</Txt>
              </View>
              <Pressable onPress={() => handleToggleStatus(r)} hitSlop={8}>
                <View style={[styles.statusPill, { backgroundColor: r.status === 'active' ? Colors.successAlpha15 : Colors.goldAlpha10 }]}>
                  <Txt size={11} weight="bold" color={r.status === 'active' ? Colors.success : Colors.gold}>
                    {r.status === 'active' ? t('admin.active') : t('admin.pending')}
                  </Txt>
                </View>
              </Pressable>
            </Pressable>
            <Pressable onPress={() => handleDelete(r)} style={styles.deleteBtn} hitSlop={8}>
              <Icon name="trash-can-outline" size={20} color={Colors.danger} />
            </Pressable>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable style={[styles.fab, { bottom: 32 }]} onPress={() => router.push('/(admin)/restaurant-form')}>
        <Icon name="plus" size={28} color={Colors.dark1} />
      </Pressable>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding, gap: Spacing.sm },
    row: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, overflow: 'hidden' },
    rowMain: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
    icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.goldAlpha10, alignItems: 'center', justifyContent: 'center' },
    statusPill: { borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
    deleteBtn: { padding: Spacing.md, borderLeftWidth: 1, borderLeftColor: Colors.border },
    fab: {
      position: 'absolute', right: Spacing.screenPadding,
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center',
      shadowColor: Colors.gold, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    },
  })
}
