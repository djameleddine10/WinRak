import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Spacing } from '../../constants/spacing'
import { type Palette } from '../../constants/colors'
import { useColors, useThemeMode } from '../../hooks/useColors'
import { useSettingsStore, type ThemeMode } from '../../store/settingsStore'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { TopBar } from '../../components/layout/TopBar'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'

const OPTIONS: { mode: ThemeMode; labelKey: TranslationKey }[] = [
  { mode: 'light',  labelKey: 'theme.light' },
  { mode: 'dark',   labelKey: 'theme.dark' },
  { mode: 'system', labelKey: 'theme.system' },
]

export default function Appearance() {
  const Colors = useColors()
  const mode = useThemeMode()
  const setThemeMode = useSettingsStore((s) => s.setThemeMode)
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const t = useT()

  return (
    <View style={styles.container}>
      <TopBar title={t('settings.appearance')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.note}>
          <Txt size={14} color={Colors.muted}>{t('appearance.note')}</Txt>
        </View>

        <Card radius={14} padding={0}>
          {OPTIONS.map((o, i) => {
            const selected = mode === o.mode
            return (
              <Pressable
                key={o.mode}
                style={[styles.row, i < OPTIONS.length - 1 && styles.borderBottom]}
                onPress={() => setThemeMode(o.mode)}
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
    note: {
      backgroundColor: Colors.dark3,
      borderRadius: 14,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    row: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  })
}
