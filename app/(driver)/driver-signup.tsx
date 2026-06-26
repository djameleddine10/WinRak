import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { SideDrawer } from '../../components/layout/SideDrawer'
import { useUserStore } from '../../store/userStore'
import { useDriverStore } from '../../store/driverStore'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'
import { DirIcon } from '../../components/ui/DirIcon'
import { useIsRTL } from '../../i18n/locale'

const PERKS: { icon: string; textKey: TranslationKey }[] = [
  { icon: 'clock-outline', textKey: 'driver.perk1' },
  { icon: 'cash', textKey: 'driver.perk2' },
  { icon: 'percent', textKey: 'driver.perk3' },
]

export default function DriverSignup() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets = useSafeAreaInsets()
  const setMode = useUserStore((s) => s.setMode)
  const approveRegistration = useDriverStore((s) => s.approveRegistration)
  const setSheService = useDriverStore((s) => s.setSheService)
  const [drawer, setDrawer] = useState(false)
  const t = useT()


  function startReg(she: boolean) {
    setSheService(she)
    router.push('/(driver)/driver-registration')
  }

  function toPassenger() {
    setMode('passenger')
    router.replace('/(passenger)/(tabs)/home')
  }

  // Existing driver: skip registration, go straight to the radar home.
  function enterExisting() {
    approveRegistration()
    setMode('driver')
    router.replace('/(driver)/home')
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.topRow}>
        <Pressable onPress={() => { setMode('driver'); setDrawer(true) }}>
          <Icon name="menu" size={24} color={Colors.white} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Txt weight="bold" size={22} color={Colors.pureWhite}>{t('driver.earnWithUs')}</Txt>
        <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
          {PERKS.map((p) => (
            <View key={p.textKey} style={styles.perk}>
              <Icon name={p.icon} size={20} color={Colors.pureWhite} />
              <Txt size={14} color={Colors.pureWhite}>{t(p.textKey)}</Txt>
            </View>
          ))}
        </View>
      </View>

      <Card radius={14} style={styles.driverCard} onPress={() => startReg(false)}>
        <View style={styles.carIcon}><Icon name="car" size={30} color={Colors.gold} /></View>
        <Txt weight="bold" size={16} style={{ flex: 1 }}>{t('driver.driverCard')}</Txt>
        <DirIcon name="chevron-right" size={22} color={Colors.muted} />
      </Card>

      <Card radius={14} style={[styles.driverCard, { marginTop: Spacing.md }]} onPress={() => startReg(true)}>
        <View style={styles.carIconShe}><Icon name="car" size={30} color={Colors.purple} /></View>
        <View style={{ flex: 1 }}>
          <Txt weight="bold" size={16} color={Colors.purple}>{t('driver.sheDriverCard')}</Txt>
          <Txt size={12} color={Colors.muted}>{t('driver.sheDriverSub')}</Txt>
        </View>
        <DirIcon name="chevron-right" size={22} color={Colors.muted} />
      </Card>

      <View style={{ flex: 1 }} />

      <View style={{ paddingBottom: insets.bottom + Spacing.lg, gap: Spacing.md }}>
        <Button label={t('driver.haveAccount')} variant="white" onPress={enterExisting} />
        <Pressable onPress={toPassenger}>
          <Txt size={13} color={Colors.muted} center>{t('driver.toPassenger')}</Txt>
        </Pressable>
      </View>

      <SideDrawer visible={drawer} onClose={() => setDrawer(false)} />
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1, paddingHorizontal: Spacing.screenPadding },
    topRow: { flexDirection: row, marginBottom: Spacing.lg },
    hero: { backgroundColor: Colors.driverGreen, borderRadius: 16, padding: Spacing.xl },
    perk: { flexDirection: row, alignItems: 'center', gap: Spacing.md },
    driverCard: { flexDirection: row, alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg },
    carIcon:    { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.goldAlpha10, alignItems: 'center', justifyContent: 'center' },
    carIconShe: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.purpleAlpha15, alignItems: 'center', justifyContent: 'center' },
  })
}
