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
import { adminListPharmacies, adminDeletePharmacy, type AdminPharmacy } from '../../services/admin.service'

export default function AdminPharmacies() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const [list, setList] = useState<AdminPharmacy[]>([])

  useFocusEffect(useCallback(() => {
    adminListPharmacies().then(setList).catch(console.warn)
  }, []))

  function handleDelete(p: AdminPharmacy) {
    Alert.alert(p.name, t('admin.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'), style: 'destructive',
        onPress: () => adminDeletePharmacy(p.id)
          .then(() => setList((l) => l.filter((x) => x.id !== p.id)))
          .catch((e) => Alert.alert('Error', e.message)),
      },
    ])
  }

  return (
    <View style={styles.container}>
      <TopBar title={t('admin.pharmacies')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {list.length === 0 && (
          <Txt size={14} color={Colors.muted} center style={{ marginTop: Spacing.xl }}>{t('admin.noPharmacies')}</Txt>
        )}
        {list.map((p) => (
          <View key={p.id} style={styles.row}>
            <Pressable style={styles.rowMain} onPress={() => router.push({ pathname: '/(admin)/pharmacy-form', params: { id: p.id } })}>
              <View style={styles.icon}><Icon name="pill" size={22} color={Colors.success} /></View>
              <View style={{ flex: 1 }}>
                <Txt weight="bold" size={14} numberOfLines={1}>{p.name}</Txt>
                <Txt size={12} color={Colors.muted}>{p.area}</Txt>
              </View>
              <View style={[styles.badge, { backgroundColor: p.open_now ? Colors.successAlpha15 : Colors.dangerAlpha10 }]}>
                <Txt size={11} weight="bold" color={p.open_now ? Colors.success : Colors.danger}>
                  {p.open_now ? t('admin.active') : t('food.closed')}
                </Txt>
              </View>
            </Pressable>
            <Pressable onPress={() => handleDelete(p)} style={styles.deleteBtn} hitSlop={8}>
              <Icon name="trash-can-outline" size={20} color={Colors.danger} />
            </Pressable>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => router.push('/(admin)/pharmacy-form')}>
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
    icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1a3a2a', alignItems: 'center', justifyContent: 'center' },
    badge: { borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
    deleteBtn: { padding: Spacing.md, borderLeftWidth: 1, borderLeftColor: Colors.border },
    fab: {
      position: 'absolute', right: Spacing.screenPadding, bottom: 32,
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center',
      shadowColor: Colors.gold, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    },
  })
}
