import { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { Divider } from '../../components/ui/Divider'
import { Button } from '../../components/ui/Button'
import { TopBar } from '../../components/layout/TopBar'
import { useUserStore } from '../../store/userStore'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'
import { getDriverWallet, getDriverTransactions, requestPayout } from '../../services/finance.service'

type Period = 'today' | 'week' | 'month'
const PERIODS: Period[] = ['today', 'week', 'month']
const TAB_KEYS: Record<Period, TranslationKey> = {
  today: 'earnings.today',
  week:  'earnings.week',
  month: 'earnings.month',
}
const DAY_KEYS: TranslationKey[] = [
  'earnings.d0', 'earnings.d1', 'earnings.d2', 'earnings.d3',
  'earnings.d4', 'earnings.d5', 'earnings.d6',
]

export default function Earnings() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const driver      = useUserStore((s) => s.driver)
  const driverStats = useUserStore((s) => s.driverStats)
  const profile     = useUserStore((s) => s.profile)
  const [period, setPeriod] = useState<Period>('today')
  const t = useT()
  const cur = t('common.currency')
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [txList, setTxList] = useState<any[]>([])

  useEffect(() => {
    if (!profile?.id) return
    getDriverWallet(profile.id)
      .then((w) => setWalletBalance(w.wallet_balance))
      .catch(console.warn)
    getDriverTransactions(profile.id)
      .then(setTxList)
      .catch(console.warn)
  }, [profile?.id])

  // Compute period totals from real transactions
  const realTotals = useMemo(() => {
    const now = Date.now()
    const day = 86_400_000
    const r = { today: 0, week: 0, month: 0 }
    txList.forEach((tx) => {
      const age = now - new Date(tx.created_at).getTime()
      const amt = tx.driver_amount ?? 0
      if (age < day)       r.today += amt
      if (age < 7 * day)   r.week  += amt
      if (age < 30 * day)  r.month += amt
    })
    return r
  }, [txList])

  const total         = realTotals[period]
  const gross         = total > 0 ? Math.round(total / 0.88) : 0
  const platformShare = gross - total

  // 7-day bar chart — real data only
  const last7Real = useMemo(() => {
    const now = Date.now()
    const day = 86_400_000
    const bars = Array(7).fill(0)
    txList.forEach((tx) => {
      const ageDays = Math.floor((now - new Date(tx.created_at).getTime()) / day)
      if (ageDays < 7) bars[6 - ageDays] += tx.driver_amount ?? 0
    })
    return bars
  }, [txList])

  const values = last7Real
  const maxV   = Math.max(...values, 1)

  // Ride count for the selected period
  const realTripCount = useMemo(() => {
    const cutoffs = { today: 1, week: 7, month: 30 }
    const cutoff  = Date.now() - cutoffs[period] * 86_400_000
    return txList.filter((tx) => new Date(tx.created_at).getTime() > cutoff).length
  }, [txList, period])

  async function handleWithdraw() {
    const balance = walletBalance ?? 0
    if (balance < 500) {
      Alert.alert(t('earnings.withdrawTitle'), t('earnings.withdrawMinError'))
      return
    }
    Alert.alert(
      t('earnings.withdrawTitle'),
      `${t('earnings.withdrawConfirm')} ${balance.toLocaleString('en-US')} ${cur}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('earnings.withdraw'),
          onPress: async () => {
            if (!profile?.id) return
            try {
              await requestPayout({ driverId: profile.id, amount: balance, method: 'cash' })
              Alert.alert('✅', t('earnings.withdrawSuccess'))
              setWalletBalance(0)
            } catch (e: any) {
              Alert.alert(t('earnings.withdrawTitle'), e.message ?? t('earnings.withdrawError'))
            }
          },
        },
      ],
    )
  }

  return (
    <View style={styles.container}>
      <TopBar title={t('earnings.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.tabs}>
          {PERIODS.map((p) => {
            const on = period === p
            return (
              <View key={p} style={styles.tabWrap}>
                <Txt size={14} color={on ? Colors.white : Colors.muted} weight={on ? 'bold' : 'regular'} center onPress={() => setPeriod(p)}>
                  {t(TAB_KEYS[p])}
                </Txt>
                {on && <View style={styles.tabUnderline} />}
              </View>
            )
          })}
        </View>

        <Card radius={14} leftAccent={Colors.gold}>
          <Txt size={12} color={Colors.muted}>{t('earnings.totalLabel')}</Txt>
          <Txt weight="black" size={36}>{total.toLocaleString('en-US')} {cur}</Txt>
        </Card>

        <Card radius={14}>
          <Txt weight="bold" size={14} color={Colors.gold}>{t('earnings.sharingTitle')}</Txt>
          <Divider spacing={Spacing.md} />
          <Row label={t('earnings.grossTotal')} value={`${gross.toLocaleString('en-US')} ${cur}`} />
          <Row label={t('earnings.platformShare')} value={`${platformShare.toLocaleString('en-US')} ${cur}`} />
          <Divider spacing={Spacing.md} />
          <Row label={t('earnings.netEarnings')} value={`${total.toLocaleString('en-US')} ${cur}`} bold />
        </Card>

        <View style={styles.grid}>
          <Stat icon="car"          value={t('earnings.statRides',  { n: String(realTripCount) })} />
          <Stat icon="star"         value={t('earnings.statRating', { n: (driverStats?.rating ?? driver.rating).toFixed(1) })} />
          <Stat icon="cash"         value={t('earnings.statGross',  { n: gross.toLocaleString('en-US'), currency: cur })} />
          <Stat icon="percent"      value={t('earnings.statShare',  { n: platformShare.toLocaleString('en-US'), currency: cur })} />
        </View>

        <Card radius={14}>
          <Txt weight="bold" size={14} style={{ marginBottom: Spacing.md }}>{t('earnings.last7')}</Txt>
          <View style={styles.chart}>
            {values.map((v, i) => {
              const today = i === values.length - 1
              return (
                <View key={i} style={styles.barCol}>
                  {today && <Txt size={11} color={Colors.gold} weight="bold">{(v / 1000).toFixed(1)}k</Txt>}
                  <View style={[styles.bar, { height: (v / maxV) * 120, backgroundColor: today ? Colors.gold : Colors.dark4 }]} />
                  <Txt size={11} color={Colors.muted}>{t(DAY_KEYS[i])}</Txt>
                </View>
              )
            })}
          </View>
        </Card>

        <Button label={t('earnings.withdraw')} onPress={handleWithdraw} />
        <Txt size={12} color={Colors.muted} center>{t('earnings.available', { n: (walletBalance ?? 0).toLocaleString('en-US'), currency: cur })}</Txt>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  return (
    <View style={styles.shareRow}>
      <Txt size={13} color={Colors.muted} style={{ flex: 1 }}>{label}</Txt>
      <Txt size={bold ? 18 : 13} weight={bold ? 'bold' : 'regular'} color={bold ? Colors.white : Colors.white}>{value}</Txt>
    </View>
  )
}

function Stat({ icon, value }: { icon: string; value: string }) {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  return (
    <View style={styles.statCard}>
      <Icon name={icon} size={22} color={Colors.gold} />
      <Txt size={13}>{value}</Txt>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding, gap: Spacing.md },
    tabs: { flexDirection: 'row-reverse', gap: Spacing.lg, justifyContent: 'center' },
    tabWrap: { alignItems: 'center', gap: 4 },
    tabUnderline: { width: 24, height: 3, borderRadius: 2, backgroundColor: Colors.gold },
    grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.sm },
    statCard: { width: '48.5%', backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd, padding: Spacing.lg, flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
    shareRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 4 },
    chart: { flexDirection: 'row-reverse', alignItems: 'flex-end', justifyContent: 'space-between', height: 160 },
    barCol: { alignItems: 'center', gap: 4, flex: 1 },
    bar: { width: 24, borderRadius: 4 },
  })
}
