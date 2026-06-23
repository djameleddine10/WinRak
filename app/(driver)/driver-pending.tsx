import { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useUserStore } from '../../store/userStore'
import { useDriverStore } from '../../store/driverStore'
import { useT } from '../../hooks/useT'

export default function DriverPending() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const setMode = useUserStore((s) => s.setMode)
  const approveRegistration = useDriverStore((s) => s.approveRegistration)
  const t = useT()

  function toPassenger() {
    setMode('passenger')
    router.replace('/(passenger)/(tabs)/home')
  }

  function enterDriver() {
    approveRegistration()
    setMode('driver')
    router.replace('/(driver)/home')
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xxxl }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Icon name="clock-outline" size={80} color={Colors.gold} />
        <Txt weight="black" size={22} center style={{ marginTop: Spacing.lg }}>{t('driver.pendingTitle')}</Txt>
        <Txt size={14} color={Colors.muted} center style={{ marginTop: Spacing.sm }}>{t('driver.pendingSub')}</Txt>
        <Txt size={13} color={Colors.muted} center>{t('driver.pendingNotify')}</Txt>

        <Card radius={14} style={styles.statusCard}>
          <Txt weight="bold" size={14}>{t('driver.requestStatus')}</Txt>
          <StatusRow icon="check-circle" color={Colors.success} label={t('driver.personalInfo')} value={t('driver.complete')} />
          <StatusRow icon="check-circle" color={Colors.success} label={t('driver.vehicleDocs')} value={t('driver.complete')} />
          <StatusRow icon="clock-outline" color={Colors.gold} label={t('driver.adminReview')} value={t('driver.inProgress')} />
        </Card>
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + Spacing.lg, gap: Spacing.sm }}>
        <Button label={t('driver.enterAsDriver')} onPress={enterDriver} />
        <Button label={t('driver.backToPassenger')} variant="ghost" onPress={toPassenger} />
        <Txt size={13} color={Colors.muted} center>{t('driver.updateDocs')}</Txt>
      </View>
    </View>
  )
}

function StatusRow({ icon, color, label, value }: { icon: string; color: string; label: string; value: string }) {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  return (
    <View style={styles.statusRow}>
      <Icon name={icon} size={20} color={color} />
      <Txt size={14} style={{ flex: 1 }}>{label}</Txt>
      <Txt size={13} color={color}>{value}</Txt>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1, paddingHorizontal: Spacing.screenPadding },
    content: { alignItems: 'center', paddingBottom: Spacing.xl },
    statusCard: { width: '100%', marginTop: Spacing.xxl, gap: Spacing.md },
    statusRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
  })
}
