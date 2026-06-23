import { useMemo } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Badge'
import { TopBar } from '../../components/layout/TopBar'
import {
  usePaymentStore, methodIcon, methodLabelKey, methodBrand, type SavedMethod,
} from '../../store/paymentStore'

export default function PaymentMethods() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()

  const methods    = usePaymentStore((s) => s.methods)
  const setDefault  = usePaymentStore((s) => s.setDefault)
  const removeCard  = usePaymentStore((s) => s.removeCard)

  function title(m: SavedMethod): string {
    const key = methodLabelKey(m.type)
    return key ? t(key) : methodBrand(m.type)
  }

  function confirmRemove(m: SavedMethod) {
    Alert.alert(t('pm.removeTitle'), t('pm.removeMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeCard(m.id) },
    ])
  }

  return (
    <View style={styles.container}>
      <TopBar title={t('pm.title')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Txt size={12} color={Colors.muted} style={{ marginBottom: Spacing.sm }}>{t('pm.subtitle')}</Txt>

        {methods.map((m) => {
          const isCard = m.type === 'baridimob'
          return (
            <View key={m.id} style={styles.row}>
              <View style={styles.iconWrap}>
                <Icon name={methodIcon(m.type)} size={22} color={Colors.gold} />
              </View>
              <Pressable style={{ flex: 1 }} onPress={() => isCard && setDefault(m.id)} disabled={!isCard}>
                <View style={styles.titleRow}>
                  <Txt size={14} weight="bold">{title(m)}</Txt>
                  {m.isDefault && <Badge label={t('wallet.default')} variant="gold" size="sm" />}
                </View>
                {m.last4 && <Txt size={12} color={Colors.muted}>•••• {m.last4}</Txt>}
                {isCard && !m.isDefault && <Txt size={11} color={Colors.gold} style={{ marginTop: 2 }}>{t('pm.tapDefault')}</Txt>}
              </Pressable>
              {isCard && (
                <Pressable hitSlop={8} onPress={() => confirmRemove(m)}>
                  <Icon name="trash-can-outline" size={20} color={Colors.danger} />
                </Pressable>
              )}
            </View>
          )
        })}

        <Pressable style={styles.addRow} onPress={() => router.push('/(passenger)/add-card')}>
          <Icon name="plus" size={18} color={Colors.gold} />
          <Txt size={13} color={Colors.gold}>{t('pm.addNew')}</Txt>
        </Pressable>

        <View style={styles.note}>
          <Icon name="information-outline" size={16} color={Colors.muted} />
          <Txt size={11} color={Colors.muted} style={{ flex: 1 }}>{t('pm.note')}</Txt>
        </View>
      </ScrollView>

      <View style={{ height: insets.bottom }} />
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding, gap: Spacing.sm },
    row: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.md,
    },
    iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.goldAlpha10, alignItems: 'center', justifyContent: 'center' },
    titleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
    addRow: {
      flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      borderWidth: 1.5, borderColor: Colors.gold, borderStyle: 'dashed',
      borderRadius: Spacing.radiusMd, paddingVertical: Spacing.md, marginTop: Spacing.sm,
    },
    note: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  })
}
