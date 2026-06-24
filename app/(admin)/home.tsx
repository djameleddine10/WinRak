import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { useUserStore } from '../../store/userStore'
import { adminListRestaurants, adminListPharmacies } from '../../services/admin.service'

export default function AdminHome() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const profile = useUserStore((s) => s.profile)
  const logout  = useUserStore((s) => s.logout)

  const [restCount, setRestCount]   = useState({ active: 0, pending: 0 })
  const [pharmCount, setPharmCount] = useState(0)

  useEffect(() => {
    adminListRestaurants()
      .then((list) => setRestCount({
        active:  list.filter((r) => r.status === 'active').length,
        pending: list.filter((r) => r.status === 'pending').length,
      }))
      .catch(console.warn)
    adminListPharmacies()
      .then((list) => setPharmCount(list.length))
      .catch(console.warn)
  }, [])

  function handleLogout() {
    logout()
    router.replace('/(auth)/splash')
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Txt weight="black" size={22}>WinRak</Txt>
          <Txt size={13} color={Colors.muted}>{t('admin.title')}</Txt>
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutBtn} hitSlop={8}>
          <Icon name="logout" size={22} color={Colors.danger} />
        </Pressable>
      </View>

      {/* Welcome */}
      <View style={styles.welcome}>
        <Icon name="shield-crown" size={32} color={Colors.gold} />
        <View style={{ flex: 1 }}>
          <Txt weight="bold" size={16}>{profile?.full_name ?? 'Admin'}</Txt>
          <Txt size={12} color={Colors.muted}>{profile?.phone ?? ''}</Txt>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Restaurants card */}
        <Pressable style={styles.card} onPress={() => router.push('/(admin)/restaurants')}>
          <View style={[styles.cardIcon, { backgroundColor: Colors.goldAlpha10 }]}>
            <Icon name="store" size={28} color={Colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size={16}>{t('admin.restaurants')}</Txt>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: Colors.successAlpha15 }]}>
                <Txt size={12} color={Colors.success}>{t('admin.totalActive', { n: String(restCount.active) })}</Txt>
              </View>
              {restCount.pending > 0 && (
                <View style={[styles.badge, { backgroundColor: Colors.goldAlpha10 }]}>
                  <Txt size={12} color={Colors.gold}>{t('admin.totalPending', { n: String(restCount.pending) })}</Txt>
                </View>
              )}
            </View>
          </View>
          <Icon name="chevron-left" size={22} color={Colors.muted} />
        </Pressable>

        {/* Pharmacies card */}
        <Pressable style={styles.card} onPress={() => router.push('/(admin)/pharmacies')}>
          <View style={[styles.cardIcon, { backgroundColor: '#1a3a2a' }]}>
            <Icon name="pill" size={28} color={Colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size={16}>{t('admin.pharmacies')}</Txt>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: Colors.successAlpha15 }]}>
                <Txt size={12} color={Colors.success}>{t('admin.totalActive', { n: String(pharmCount) })}</Txt>
              </View>
            </View>
          </View>
          <Icon name="chevron-left" size={22} color={Colors.muted} />
        </Pressable>
      </ScrollView>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    header: {
      flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.lg,
    },
    logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark3, alignItems: 'center', justifyContent: 'center' },
    welcome: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
      marginHorizontal: Spacing.screenPadding, marginBottom: Spacing.xl,
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.md,
    },
    content: { padding: Spacing.screenPadding, gap: Spacing.md },
    card: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.lg,
    },
    cardIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    badges: { flexDirection: 'row-reverse', gap: Spacing.sm, marginTop: 4 },
    badge: { borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  })
}
