import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
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
import { usePaymentStore } from '../../store/paymentStore'
import { useIsRTL } from '../../i18n/locale'

// Mock BaridiMob linkage — only last 4 digits of phone are stored for display.
export default function AddCard() {
  const Colors = useColors()
  const isRTL = useIsRTL()
    const t = useT()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets = useSafeAreaInsets()
  const addCard = usePaymentStore((s) => s.addCard)

  const [phone, setPhone] = useState('')
  const [error, setError]  = useState<string | null>(null)

  const digits = phone.replace(/\D/g, '').slice(0, 10)
  const valid  = digits.length === 10 && /^(05|06|07)/.test(digits)

  function onPhoneChange(v: string) {
    setPhone(v.replace(/\D/g, '').slice(0, 10))
    setError(null)
  }

  function save() {
    if (!valid) { setError(t('card.invalid')); return }
    addCard(digits.slice(-4))
    router.back()
  }

  // Format display: 07XX XXXX XX
  const formatted = digits.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3').trim()

  return (
    <View style={styles.container}>
      <TopBar title={t('card.title')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Visual card preview */}
        <View style={[styles.preview, { backgroundColor: Colors.gold }]}>
          <View style={styles.previewTop}>
            <Icon name="bank-transfer" size={28} color={Colors.dark1} />
            <Txt weight="black" size={18} color={Colors.dark1}>BaridiMob</Txt>
          </View>
          <Txt weight="bold" size={20} color={Colors.dark1} style={{ letterSpacing: 3, marginTop: Spacing.lg }}>
            {formatted || '07XX XXXX XX'}
          </Txt>
          <View style={styles.previewBottom}>
            <Txt size={13} color={Colors.dark1} style={{ opacity: 0.75 }}>Algérie Poste</Txt>
            <Icon name="cellphone" size={20} color={Colors.dark1} />
          </View>
        </View>

        {/* Phone input */}
        <View style={{ gap: Spacing.md, marginTop: Spacing.xl }}>
          <Input
            label={t('card.number')}
            placeholder={t('card.numberPh')}
            value={formatted}
            onChangeText={onPhoneChange}
            leftIcon="cellphone"
            type="numeric"
          />
          {!!error && <Txt size={12} color={Colors.danger}>{error}</Txt>}
        </View>

        <View style={styles.secureNote}>
          <Icon name="shield-check" size={16} color={Colors.success} />
          <Txt size={11} color={Colors.muted} style={{ flex: 1 }}>{t('card.secureNote')}</Txt>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button label={t('card.save')} icon="check" onPress={save} disabled={!valid} />
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding },
    preview: {
      borderRadius: Spacing.radiusLg, padding: Spacing.lg, height: 160, justifyContent: 'space-between',
    },
    previewTop: { flexDirection: row, alignItems: 'center', justifyContent: 'space-between' },
    previewBottom: { flexDirection: row, alignItems: 'center', justifyContent: 'space-between' },
    secureNote: {
      flexDirection: row, alignItems: 'center', gap: Spacing.sm,
      backgroundColor: Colors.successAlpha15, borderRadius: Spacing.radiusMd, padding: Spacing.md, marginTop: Spacing.xl,
    },
    footer: {
      backgroundColor: Colors.dark2, borderTopWidth: 1, borderTopColor: Colors.border,
      paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md,
    },
  })
}
