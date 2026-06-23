import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../ui/Txt'
import { Icon } from '../ui/Icon'
import { useT } from '../../hooks/useT'
import {
  usePaymentStore, selectedMethod, methodIcon, methodLabelKey, methodBrand,
  type SavedMethod,
} from '../../store/paymentStore'

interface Props {
  /** Order amount — used to disable the wallet option when the balance is too low. */
  amount?: number
  /** Section label above the row (defaults to t('pay.title')). */
  label?: string
}

// Reusable payment-method selector: a compact row that opens a bottom-sheet
// radio list. Used in the ride request sheet and the delivery checkout.
export function PaymentMethodPicker({ amount, label }: Props) {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)

  const methods    = usePaymentStore((s) => s.methods)
  const selectedId = usePaymentStore((s) => s.selectedId)
  const balance    = usePaymentStore((s) => s.balance)
  const select     = usePaymentStore((s) => s.selectMethod)

  const current = selectedMethod({ methods, selectedId })
  const cur     = t('common.currency')

  function methodTitle(m: SavedMethod): string {
    const key = methodLabelKey(m.type)
    return key ? t(key) : methodBrand(m.type)
  }

  function walletDisabled(m: SavedMethod): boolean {
    return m.type === 'wallet' && amount !== undefined && balance < amount
  }

  function pick(m: SavedMethod) {
    if (walletDisabled(m)) return
    select(m.id)
    setOpen(false)
  }

  return (
    <View>
      <Txt size={12} color={Colors.muted} style={styles.label}>{label ?? t('pay.title')}</Txt>
      <Pressable style={styles.row} onPress={() => setOpen(true)}>
        <View style={styles.iconWrap}>
          <Icon name={methodIcon(current.type)} size={20} color={Colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt size={14} weight="bold">{methodTitle(current)}</Txt>
          {current.type === 'wallet' ? (
            <Txt size={12} color={Colors.muted}>{t('pay.walletBalance', { n: balance.toLocaleString('en-US'), currency: cur })}</Txt>
          ) : current.last4 ? (
            <Txt size={12} color={Colors.muted}>•••• {current.last4}</Txt>
          ) : null}
        </View>
        <Txt size={12} color={Colors.gold}>{t('pay.change')}</Txt>
        <Icon name="chevron-down" size={20} color={Colors.muted} />
      </Pressable>

      <Modal transparent visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.handle} />
          <Txt weight="bold" size={16} center style={{ marginBottom: Spacing.md }}>{t('pay.choose')}</Txt>

          <ScrollView showsVerticalScrollIndicator={false}>
            {methods.map((m) => {
              const active   = m.id === selectedId
              const disabled = walletDisabled(m)
              return (
                <Pressable key={m.id} onPress={() => pick(m)} disabled={disabled}>
                  <View style={[styles.optRow, active && styles.optActive, disabled && styles.optDisabled]}>
                    <View style={styles.iconWrap}>
                      <Icon name={methodIcon(m.type)} size={20} color={Colors.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt size={14} weight="bold">{methodTitle(m)}</Txt>
                      {m.type === 'wallet' ? (
                        <Txt size={12} color={disabled ? Colors.danger : Colors.muted}>
                          {disabled
                            ? t('pay.insufficientShort')
                            : t('pay.walletBalance', { n: balance.toLocaleString('en-US'), currency: cur })}
                        </Txt>
                      ) : m.last4 ? (
                        <Txt size={12} color={Colors.muted}>•••• {m.last4}</Txt>
                      ) : null}
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                  </View>
                </Pressable>
              )
            })}

            <Pressable style={styles.addRow} onPress={() => { setOpen(false); router.push('/(passenger)/add-card') }}>
              <Icon name="plus" size={18} color={Colors.gold} />
              <Txt size={13} color={Colors.gold}>{t('pay.addCard')}</Txt>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    label: { marginBottom: Spacing.sm },
    row: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.md,
    },
    iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.goldAlpha10, alignItems: 'center', justifyContent: 'center' },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: {
      backgroundColor: Colors.dark2,
      borderTopLeftRadius: Spacing.radiusLg, borderTopRightRadius: Spacing.radiusLg,
      padding: Spacing.screenPadding, maxHeight: '70%',
    },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.dark4, alignSelf: 'center', marginBottom: Spacing.md },
    optRow: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd,
      borderWidth: 1.5, borderColor: 'transparent', padding: Spacing.md, marginBottom: Spacing.sm,
    },
    optActive: { borderColor: Colors.gold },
    optDisabled: { opacity: 0.5 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.dark4, alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: Colors.gold },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gold },
    addRow: {
      flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      borderWidth: 1.5, borderColor: Colors.gold, borderStyle: 'dashed',
      borderRadius: Spacing.radiusMd, paddingVertical: Spacing.md, marginTop: 4,
    },
  })
}
