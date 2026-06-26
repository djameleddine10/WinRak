import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { type Palette } from '../../../constants/colors'
import { useColors } from '../../../hooks/useColors'
import { Spacing } from '../../../constants/spacing'
import { Txt } from '../../../components/ui/Txt'
import { Icon } from '../../../components/ui/Icon'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { TopBar } from '../../../components/layout/TopBar'
import { useT } from '../../../hooks/useT'
import {
import { useIsRTL } from '../../../i18n/locale'
  usePaymentStore, methodIcon, methodLabelKey, methodBrand, type SavedMethod, type LocalTx,
} from '../../../store/paymentStore'

export default function Wallet() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const t = useT()
  const cur = t('common.currency')

  const balance      = usePaymentStore((s) => s.balance)
  const points       = usePaymentStore((s) => s.points)
  const methods      = usePaymentStore((s) => s.methods)
  const transactions = usePaymentStore((s) => s.transactions)

  function methodTitle(m: SavedMethod): string {
    const key = methodLabelKey(m.type)
    return key ? t(key) : methodBrand(m.type)
  }

  return (
    <View style={styles.container}>
      <TopBar title={t('nav.wallet')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card radius={14} leftAccent={Colors.gold}>
          <Txt size={12} color={Colors.muted}>{t('wallet.balance')}</Txt>
          <Txt weight="black" size={36}>{balance.toLocaleString('en-US')} {cur}</Txt>
          <Txt size={13} color={Colors.gold} style={{ marginTop: 4 }}>{t('wallet.points', { pts: points })}</Txt>
        </Card>

        <View style={styles.actions}>
          <Action icon="arrow-up-circle" label={t('wallet.topup')} color={Colors.gold} onPress={() => router.push('/(passenger)/topup')} />
          <Action icon="credit-card-plus-outline" label={t('wallet.addMethod')} color={Colors.blue} onPress={() => router.push('/(passenger)/add-card')} />
          <Action icon="cog-outline" label={t('pay.manage')} color={Colors.muted} onPress={() => router.push('/(passenger)/payment-methods')} />
        </View>

        <View style={styles.sectionRow}>
          <Txt size={12} color={Colors.muted}>{t('wallet.savedMethods')}</Txt>
          <Txt size={12} color={Colors.gold} onPress={() => router.push('/(passenger)/payment-methods')}>{t('pay.manage')}</Txt>
        </View>
        {methods.map((m) => (
          <Card key={m.id} radius={Spacing.radiusMd} style={styles.pmRow}>
            <Icon name={methodIcon(m.type)} size={22} color={Colors.gold} />
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="bold">{methodTitle(m)}</Txt>
              {m.type === 'wallet'
                ? <Txt size={12} color={Colors.muted}>{balance.toLocaleString('en-US')} {cur}</Txt>
                : m.last4 && <Txt size={12} color={Colors.muted}>•••• {m.last4}</Txt>}
            </View>
            {m.isDefault && <Badge label={t('wallet.default')} variant="gold" size="sm" />}
          </Card>
        ))}
        <Pressable style={styles.addPm} onPress={() => router.push('/(passenger)/add-card')}>
          <Icon name="plus" size={18} color={Colors.gold} />
          <Txt size={13} color={Colors.gold}>{t('wallet.addMethod')}</Txt>
        </Pressable>

        <View style={styles.txHeader}>
          <Txt size={12} color={Colors.muted}>{t('wallet.recentTx')}</Txt>
        </View>
        {transactions.map((tx: LocalTx) => {
          const credit = tx.type === 'credit'
          const label  = t(tx.labelKey, tx.vars)
          return (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: credit ? Colors.successAlpha15 : Colors.dangerAlpha10 }]}>
                <Icon name={credit ? 'arrow-up-circle' : 'arrow-down-circle'} size={18} color={credit ? Colors.success : Colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={14}>{label}</Txt>
                <Txt size={11} color={Colors.muted}>{String(tx.date).slice(0, 10)}</Txt>
              </View>
              <Txt size={14} weight="bold" color={credit ? Colors.success : Colors.white}>
                {credit ? '+' : '−'}{tx.amount.toLocaleString('en-US')} {cur}
              </Txt>
            </View>
          )
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

function Action({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <Icon name={icon} size={24} color={color} />
      <Txt size={13}>{label}</Txt>
    </Pressable>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding, gap: Spacing.md },
    actions: { flexDirection: row, gap: Spacing.sm },
    action: { flex: 1, height: 64, backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd, alignItems: 'center', justifyContent: 'center', gap: 4 },
    sectionRow: { flexDirection: row, justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
    pmRow: { flexDirection: row, alignItems: 'center', gap: Spacing.md },
    addPm: { flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1.5, borderColor: Colors.gold, borderStyle: 'dashed', borderRadius: Spacing.radiusMd, paddingVertical: Spacing.md },
    txHeader: { flexDirection: row, justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
    txRow: { flexDirection: row, alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
    txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  })
}
