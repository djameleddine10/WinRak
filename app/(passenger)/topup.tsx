import { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { TopBar } from '../../components/layout/TopBar'
import { usePaymentStore, methodBrand, type SavedMethod } from '../../store/paymentStore'
import { useIsRTL } from '../../i18n/locale'

const PRESETS = [500, 1000, 2000, 5000]
const MIN_TOPUP = 200

export default function TopUp() {
  const Colors = useColors()
  const isRTL = useIsRTL()
    const t = useT()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets = useSafeAreaInsets()
  const cur = t('common.currency')

  const balance = usePaymentStore((s) => s.balance)
  const methods = usePaymentStore((s) => s.methods)
  const topUp   = usePaymentStore((s) => s.topUp)

  const cards = methods.filter((m) => m.type === 'baridimob')
  const defaultCard = cards.find((m) => m.isDefault) ?? cards[0]

  const [amount, setAmount]   = useState<number>(1000)
  const [custom, setCustom]   = useState('')
  const [sourceId, setSourceId] = useState(defaultCard?.id ?? '')

  const finalAmount = custom ? parseInt(custom.replace(/\D/g, ''), 10) || 0 : amount
  const valid = finalAmount >= MIN_TOPUP && !!sourceId

  function pickPreset(v: number) {
    setAmount(v)
    setCustom('')
  }

  function confirm() {
    if (finalAmount < MIN_TOPUP) {
      Alert.alert(t('topup.title'), t('topup.min', { n: String(MIN_TOPUP), currency: cur }))
      return
    }
    topUp(finalAmount)
    Alert.alert('✅', t('topup.success', { n: finalAmount.toLocaleString('en-US'), currency: cur }), [
      { text: t('common.ok'), onPress: () => router.back() },
    ])
  }

  return (
    <View style={styles.container}>
      <TopBar title={t('topup.title')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current balance */}
        <View style={styles.balanceCard}>
          <Icon name="wallet" size={26} color={Colors.gold} />
          <View style={{ flex: 1 }}>
            <Txt size={12} color={Colors.muted}>{t('wallet.balance')}</Txt>
            <Txt weight="black" size={24}>{balance.toLocaleString('en-US')} {cur}</Txt>
          </View>
        </View>

        {/* Amount presets */}
        <Txt size={12} color={Colors.muted} style={styles.section}>{t('topup.chooseAmount')}</Txt>
        <View style={styles.presetGrid}>
          {PRESETS.map((v) => {
            const active = !custom && amount === v
            return (
              <Pressable key={v} style={[styles.preset, active && styles.presetActive]} onPress={() => pickPreset(v)}>
                <Txt weight="bold" size={16} color={active ? Colors.dark1 : Colors.white}>{v.toLocaleString('en-US')}</Txt>
                <Txt size={11} color={active ? Colors.dark1 : Colors.muted}>{cur}</Txt>
              </Pressable>
            )
          })}
        </View>

        <View style={{ marginTop: Spacing.md }}>
          <Input
            label={t('topup.custom')}
            placeholder={t('topup.customPh')}
            value={custom}
            onChangeText={(v) => setCustom(v.replace(/\D/g, '').slice(0, 7))}
            leftIcon="cash"
            type="numeric"
          />
        </View>

        {/* Source card */}
        <Txt size={12} color={Colors.muted} style={styles.section}>{t('topup.source')}</Txt>
        {cards.length === 0 ? (
          <Pressable style={styles.addRow} onPress={() => router.push('/(passenger)/add-card')}>
            <Icon name="plus" size={18} color={Colors.gold} />
            <Txt size={13} color={Colors.gold}>{t('pay.addCard')}</Txt>
          </Pressable>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {cards.map((m: SavedMethod) => {
              const active = m.id === sourceId
              return (
                <Pressable key={m.id} onPress={() => setSourceId(m.id)}>
                  <View style={[styles.srcRow, active && styles.srcActive]}>
                    <Icon name="bank-transfer" size={20} color={Colors.gold} />
                    <View style={{ flex: 1 }}>
                      <Txt size={14} weight="bold">{methodBrand(m.type)}</Txt>
                      {m.last4 && <Txt size={12} color={Colors.muted}>•••• {m.last4}</Txt>}
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                  </View>
                </Pressable>
              )
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button
          label={t('topup.confirm', { n: finalAmount.toLocaleString('en-US'), currency: cur })}
          icon="arrow-up-circle"
          onPress={confirm}
          disabled={!valid}
        />
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding },
    balanceCard: {
      flexDirection: row, alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusLg, padding: Spacing.lg,
      borderWidth: 1.5, borderColor: Colors.goldAlpha15,
    },
    section: { marginTop: Spacing.xl, marginBottom: Spacing.sm },
    presetGrid: { flexDirection: row, flexWrap: 'wrap', gap: Spacing.sm },
    preset: {
      width: '48.5%', backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd,
      paddingVertical: Spacing.md, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent',
    },
    presetActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
    srcRow: {
      flexDirection: row, alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd,
      borderWidth: 1.5, borderColor: 'transparent', padding: Spacing.md,
    },
    srcActive: { borderColor: Colors.gold },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.dark4, alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: Colors.gold },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gold },
    addRow: {
      flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      borderWidth: 1.5, borderColor: Colors.gold, borderStyle: 'dashed',
      borderRadius: Spacing.radiusMd, paddingVertical: Spacing.md,
    },
    footer: {
      backgroundColor: Colors.dark2, borderTopWidth: 1, borderTopColor: Colors.border,
      paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md,
    },
  })
}
