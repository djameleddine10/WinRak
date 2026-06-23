import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Spacing } from '../../constants/spacing'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useSettingsStore, type Language } from '../../store/settingsStore'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { TopBar } from '../../components/layout/TopBar'
import { useT } from '../../hooks/useT'
import { useIsRTL } from '../../i18n/locale'

const OPTIONS: { lang: Language; label: string; sub: string; flag: string }[] = [
  { lang: 'ar', label: 'العربية',  sub: 'Arabic',   flag: '🇩🇿' },
  { lang: 'fr', label: 'Français', sub: 'French',   flag: '🇫🇷' },
  { lang: 'en', label: 'English',  sub: 'English',  flag: '🇬🇧' },
]

export default function LanguageScreen() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const t = useT()

  return (
    <View style={styles.container}>
      <TopBar title={t('settings.language')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card radius={14} padding={0}>
          {OPTIONS.map((o, i) => {
            const selected = language === o.lang
            return (
              <Pressable
                key={o.lang}
                style={({ pressed }) => [
                  styles.row,
                  i < OPTIONS.length - 1 && styles.borderBottom,
                  selected && styles.rowSelected,
                  pressed && styles.rowPressed,
                ]}
                onPress={() => setLanguage(o.lang)}
              >
                <Txt size={22}>{o.flag}</Txt>
                <View style={styles.labels}>
                  <Txt size={15} weight={selected ? 'bold' : 'regular'}>{o.label}</Txt>
                  <Txt size={12} color={Colors.muted}>{o.sub}</Txt>
                </View>
                {selected
                  ? <Icon name="check-circle" size={24} color={Colors.gold} />
                  : <Icon name="radiobox-blank" size={24} color={Colors.dark4} />
                }
              </Pressable>
            )
          })}
        </Card>
        <Txt size={12} color={Colors.muted} style={styles.note}>
          {t('language.note')}
        </Txt>
      </ScrollView>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding, gap: Spacing.sm },
    row: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: 14,
    },
    rowSelected: {
      backgroundColor: Colors.goldAlpha10,
    },
    rowPressed: {
      opacity: 0.7,
    },
    borderBottom: {
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    labels: {
      flex: 1,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    note: {
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
  })
}
