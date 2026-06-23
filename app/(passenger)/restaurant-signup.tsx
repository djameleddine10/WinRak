import { useEffect, useMemo } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { PhotoUpload } from '../../components/ui/PhotoUpload'
import { TopBar } from '../../components/layout/TopBar'
import { cuisines } from '../../mock/restaurants'
import { useRestaurantStore } from '../../store/restaurantStore'

export default function RestaurantSignup() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()

  const form = useRestaurantStore((s) => s.form)
  const regStatus = useRestaurantStore((s) => s.regStatus)
  const updateForm = useRestaurantStore((s) => s.updateForm)
  const setLogo = useRestaurantStore((s) => s.setLogo)
  const submitRegistration = useRestaurantStore((s) => s.submitRegistration)
  const approveRegistration = useRestaurantStore((s) => s.approveRegistration)
  const resetForm = useRestaurantStore((s) => s.resetForm)

  useEffect(() => { resetForm() }, [resetForm])

  function submit() {
    if (!form.name.trim() || !form.cuisine) {
      Alert.alert(t('restSignup.validationTitle'), t('restSignup.validationMsg'))
      return
    }
    submitRegistration()
  }

  function approve() {
    approveRegistration()
    router.replace('/(passenger)/delivery-food')
    Alert.alert(t('restSignup.successTitle'), t('restSignup.successMsg'))
  }

  if (regStatus === 'pending') {
    return (
      <View style={styles.container}>
        <TopBar title={t('restSignup.pendingTopBarTitle')} showBack />
        <ScrollView contentContainerStyle={styles.pending} showsVerticalScrollIndicator={false}>
          <Icon name="clock-outline" size={80} color={Colors.gold} />
          <Txt weight="black" size={22} center style={{ marginTop: Spacing.lg }}>{t('restSignup.reviewTitle')}</Txt>
          <Txt size={14} color={Colors.muted} center style={{ marginTop: Spacing.sm }}>{t('restSignup.reviewSub')}</Txt>
          <Card radius={14} style={styles.statusCard}>
            <Txt weight="bold" size={14}>{t('restSignup.statusTitle')}</Txt>
            <StatusRow icon="check-circle" color={Colors.success} label={t('restSignup.infoRow')} value={t('driver.complete')} />
            <StatusRow icon="check-circle" color={Colors.success} label={t('restSignup.cuisineRow')} value={t('restSignup.defined')} />
            <StatusRow icon="clock-outline" color={Colors.gold} label={t('driver.adminReview')} value={t('driver.inProgress')} />
          </Card>
        </ScrollView>
        <View style={{ paddingHorizontal: Spacing.screenPadding, paddingBottom: insets.bottom + Spacing.lg, gap: Spacing.sm }}>
          <Button label={t('restSignup.activate')} onPress={approve} />
          <Button label={t('restSignup.back')} variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TopBar title={t('restSignup.title')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoWrap}>
          <PhotoUpload size={96} shape="circle" label={t('restSignup.logoLabel')} initialUri={form.logoUri} onPhotoSelected={setLogo} />
        </View>

        <Input label={t('restSignup.nameLabel')} required value={form.name} onChangeText={(text) => updateForm('name', text)} leftIcon="storefront-outline" placeholder={t('restSignup.namePh')} />
        <View style={{ height: Spacing.md }} />

        <Txt size={12} color={Colors.muted} style={{ marginBottom: Spacing.sm, marginRight: 4 }}>{t('restSignup.cuisineType')}</Txt>
        <View style={styles.cuisineGrid}>
          {cuisines.map((c) => {
            const active = form.cuisine === c.key
            return (
              <Pressable key={c.key} style={[styles.cuisineChip, active && styles.cuisineChipActive]} onPress={() => updateForm('cuisine', c.key)}>
                <Icon name={c.icon} size={18} color={active ? Colors.dark1 : Colors.gold} />
                <Txt size={12} weight="semibold" color={active ? Colors.dark1 : Colors.white}>{t(c.labelKey)}</Txt>
              </Pressable>
            )
          })}
        </View>

        <View style={{ height: Spacing.md }} />
        <Input label={t('restSignup.areaLabel')} value={form.area} onChangeText={(text) => updateForm('area', text)} leftIcon="map-marker-outline" placeholder={t('restSignup.areaPh')} />
        <View style={{ height: Spacing.md }} />
        <Input label={t('form.phone')} type="phone" value={form.phone} onChangeText={(text) => updateForm('phone', text)} placeholder="555 00 00 00" />
        <View style={{ height: Spacing.md }} />
        <Input label={t('restSignup.receptionLabel')} value={form.reception} onChangeText={(text) => updateForm('reception', text)} leftIcon="account-tie" placeholder={t('restSignup.receptionPh')} />

        <View style={styles.note}>
          <Icon name="information-outline" size={18} color={Colors.muted} />
          <Txt size={12} color={Colors.muted} style={{ flex: 1 }}>{t('restSignup.note')}</Txt>
        </View>

        <View style={{ height: Spacing.lg }} />
        <Button label={t('restSignup.submit')} icon="send" onPress={submit} />
        <View style={{ height: insets.bottom + Spacing.lg }} />
      </ScrollView>
    </View>
  )
}

function StatusRow({ icon, color, label, value }: { icon: string; color: string; label: string; value: string }) {
  const Colors = useColors()
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md }}>
      <Icon name={icon} size={20} color={color} />
      <Txt size={14} style={{ flex: 1 }}>{label}</Txt>
      <Txt size={13} color={color}>{value}</Txt>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding },
    logoWrap: { alignItems: 'center', marginBottom: Spacing.lg },
    cuisineGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.sm },
    cuisineChip: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
      backgroundColor: Colors.dark3, borderRadius: Spacing.radiusFull,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    cuisineChipActive: { backgroundColor: Colors.gold },
    note: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.md, marginTop: Spacing.lg,
    },
    pending: { alignItems: 'center', padding: Spacing.screenPadding, paddingTop: Spacing.xxxl },
    statusCard: { width: '100%', marginTop: Spacing.xxl, gap: Spacing.md },
  })
}
