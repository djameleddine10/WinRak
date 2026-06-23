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

const OPTIONS: { unit: DistanceUnit; labelKey: TranslationKey }[] = [
  { unit: 'km', labelKey: 'distance.km' },
  { unit: 'mi', labelKey: 'distance.mi' },
]

export default function DistanceUnitScreen() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const distanceUnit = useSettingsStore((s) => s.distanceUnit)
  const setDistanceUnit = useSettingsStore((s) => s.setDistanceUnit)
  const t = useT()

  return (
    <View style={styles.container}>
      <TopBar title={t('settings.distanceUnit')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding },
    row: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  })
}
