import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'
import { SideDrawer } from '../../components/layout/SideDrawer'
import { DriverTabBar } from '../../components/driver/DriverTabBar'
import { useExitOnBack } from '../../hooks/useExitOnBack'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'
import { DirIcon } from '../../components/ui/DirIcon'
import { useUserStore } from '../../store/userStore'
import { useDriverName } from '../../i18n/locale'
import { useState } from 'react'
import { useIsRTL } from '../../i18n/locale'

const LEVEL_KEY: Record<string, TranslationKey> = {
  bronze: 'driver.levelBronze', silver: 'driver.levelSilver', gold: 'driver.levelGold', platinum: 'driver.levelPlatinum',
}

export default function Performance() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets = useSafeAreaInsets()
  const driver      = useUserStore((s) => s.driver)
  const driverStats = useUserStore((s) => s.driverStats)
  const driverName  = useDriverName()
  const displayRating = driverStats?.rating ?? driver.rating
  const [drawer, setDrawer] = useState(false)
  const t = useT()

  const cur = t('common.currency')

  // Same root behavior as the radar: back stays in driver mode (closes drawer, then exits).
  useExitOnBack(() => {
    if (drawer) { setDrawer(false); return true }
    return false
  })

  // Tier thresholds: Bronze→Silver at 50 trips, Silver→Gold at 150, Gold→Platinum at 500
  const TIERS: Record<string, { base: number; threshold: number; hasNext: boolean }> = {
    bronze:   { base: 0,   threshold: 50,  hasNext: true  },
    silver:   { base: 50,  threshold: 150, hasNext: true  },
    gold:     { base: 150, threshold: 500, hasNext: true  },
    platinum: { base: 500, threshold: 500, hasNext: false },
  }
  const totalTrips = driverStats?.totalTrips ?? 0
  const tier       = TIERS[driver.level] ?? TIERS.bronze
  const ridesToNext = tier.hasNext ? Math.max(0, tier.threshold - totalTrips) : 0
  const progress    = tier.hasNext
    ? Math.min(1, (totalTrips - tier.base) / (tier.threshold - tier.base))
    : 1

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }} showsVerticalScrollIndicator={false}>
        {/* Level header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <Pressable onPress={() => setDrawer(true)} style={{ alignSelf: 'flex-end' }} hitSlop={8}>
            <Icon name="menu" size={26} color={Colors.white} />
          </Pressable>

          <View style={styles.levelRow}>
            <Avatar initial={driverName.charAt(0).toUpperCase()} size={64} showBorder />
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Txt weight="black" size={26}>{LEVEL_KEY[driver.level] ? t(LEVEL_KEY[driver.level]) : t('driver.levelBase')}</Txt>
                <Icon name="rhombus" size={22} color={Colors.blue} />
              </View>
              <Txt size={14} color={Colors.muted}>{t('driver.levelThisWeek')}</Txt>
            </View>
            <View style={styles.ratingPill}>
              <Icon name="star" size={14} color={Colors.gold} />
              <Txt weight="bold" size={13} color={Colors.pureWhite}>{displayRating.toFixed(1)}</Txt>
            </View>
          </View>

          <Card radius={14} style={styles.progressCard}>
            <Txt weight="bold" size={15}>{t('driver.ridesToNext', { n: ridesToNext })}</Txt>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
              <View style={styles.diamondTip}><Icon name="rhombus" size={16} color={Colors.purple} /></View>
            </View>
            <Txt size={13} color={Colors.muted}>{t('driver.reachRating')}</Txt>
          </Card>

          <Pressable style={styles.benefitsBtn} onPress={() => router.push('/(driver)/benefits')}>
            <Txt weight="bold" size={15}>{t('driver.viewBenefits')}</Txt>
          </Pressable>
        </View>

        {/* Today revenue */}
        <View style={styles.body}>
          <Pressable onPress={() => router.push('/(driver)/earnings')}>
            <Card radius={14}>
              <View style={styles.rowBetween}>
                <Txt size={14} color={Colors.muted}>{t('driver.todayIncome')}</Txt>
                <DirIcon name="chevron-right" size={20} color={Colors.muted} />
              </View>
              <Txt weight="black" size={30}>{driver.earnings.today.toLocaleString('en-US')} {cur}</Txt>
              <View style={styles.goalBtn}>
                <Icon name="plus" size={18} color={Colors.white} />
                <Txt size={14}>{t('driver.addDailyGoal')}</Txt>
              </View>
            </Card>
          </Pressable>

          <Pressable onPress={() => router.push('/(driver)/benefits')}>
            <Card radius={14} style={styles.achRow}>
              <Icon name="flag-variant" size={22} color={Colors.gold} />
              <Txt size={15} weight="bold" style={{ flex: 1 }}>{t('driver.achievements')}</Txt>
              <DirIcon name="chevron-right" size={20} color={Colors.muted} />
            </Card>
          </Pressable>
        </View>
      </ScrollView>

      <DriverTabBar active="performance" />
      <SideDrawer visible={drawer} onClose={() => setDrawer(false)} />
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    header: { backgroundColor: Colors.dark2, paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.lg, gap: Spacing.lg, borderBottomLeftRadius: Spacing.radiusLg, borderBottomRightRadius: Spacing.radiusLg },
    levelRow: { flexDirection: row, alignItems: 'center', gap: Spacing.md },
    nameRow: { flexDirection: row, alignItems: 'center', gap: Spacing.sm },
    ratingPill: { flexDirection: row, alignItems: 'center', gap: 4, backgroundColor: Colors.dark4, borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.md, paddingVertical: 6 },
    progressCard: { gap: Spacing.sm, backgroundColor: Colors.dark3 },
    track: { height: 8, backgroundColor: Colors.dark4, borderRadius: 4, justifyContent: 'center' },
    fill: { position: 'absolute', right: 0, top: 0, bottom: 0, backgroundColor: Colors.white, borderRadius: 4 },
    diamondTip: { position: 'absolute', left: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.dark1, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.purple },
    benefitsBtn: { backgroundColor: Colors.dark1, borderRadius: Spacing.radiusMd, paddingVertical: Spacing.md, alignItems: 'center' },
    body: { padding: Spacing.screenPadding, gap: Spacing.md },
    rowBetween: { flexDirection: row, alignItems: 'center', justifyContent: 'space-between' },
    goalBtn: { flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd, paddingVertical: Spacing.md, marginTop: Spacing.md },
    achRow: { flexDirection: row, alignItems: 'center', gap: Spacing.md },
  })
}
