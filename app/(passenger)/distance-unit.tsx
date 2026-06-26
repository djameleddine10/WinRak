import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Spacing } from '../../constants/spacing'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useSettingsStore, type DistanceUnit } from '../../store/settingsStore'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { TopBar } from '../../components/layout/TopBar'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'
import { useIsRTL } from '../../i18n/locale'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const OPTIONS: { unit: DistanceUnit; labelKey: TranslationKey }[] = [
  { unit: 'km', labelKey: 'distance.km' },
  { unit: 'mi', labelKey: 'distance.mi' },
]

export default function DistanceUnitScreen() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const distanceUnit = useSettingsStore((s) => s.distanceUnit)
  const setDistanceUnit = useSettingsStore((s) => s.setDistanceUnit)
  const t = useT()

  return (
    <View style={styles.container}>
      <TopBar title={t('settings.distanceUnit')} showBack />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <Card radius={14} padding={0}>
          {OPTIONS.map((o, i) => {
            const selected = distanceUnit === o.unit
            return (
              <Pressable
                key={o.unit}
                style={[styles.row, i < OPTIONS.length - 1 && styles.borderBottom]}
                onPress={() => setDistanceUnit(o.unit)}
              >
                <Txt size={15} style={{ flex: 1 }}>{t(o.labelKey)}</Txt>
                <Icon
                  name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                  size={24}
                  color={selected ? Colors.gold : Colors.muted}
                />
              </Pressable>
            )
          })}
        </Card>
      </ScrollView>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding },
    row: { flexDirection: row, alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  })
}
