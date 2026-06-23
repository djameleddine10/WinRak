import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { DirIcon } from '../../components/ui/DirIcon'
import { TopBar } from '../../components/layout/TopBar'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'

const LIGHT_BG = '#f5f5f5'
const DARK_TEXT = '#1a1a1a'
const SEP = '#e0e0e0'

const SECTIONS: {
  titleKey: TranslationKey
  items: { key: TranslationKey; onPress: () => void }[]
}[] = [
  {
    titleKey: 'help.more',
    items: [
      { key: 'help.appIssues',   onPress: () => Linking.openURL('mailto:support@winrak.dz') },
      { key: 'help.aboutWinRak', onPress: () => router.push('/(passenger)/legal') },
    ],
  },
]

export default function Help() {
  const t = useT()
  return (
    <View style={{ flex: 1, backgroundColor: LIGHT_BG }}>
      <TopBar title={t('drawer.support')} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        {SECTIONS.map((s) => (
          <View key={s.titleKey} style={styles.section}>
            <Txt size={12} color="#888" style={styles.label}>{t(s.titleKey)}</Txt>
            {s.items.map((item, i) => (
              <Pressable
                key={item.key}
                style={[styles.row, i < s.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: SEP }]}
                onPress={item.onPress}
              >
                <Txt size={14} color={DARK_TEXT} style={{ flex: 1 }}>{t(item.key)}</Txt>
                <DirIcon name="chevron-right" size={20} color="#999" />
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: Spacing.screenPadding },
  section: { marginBottom: Spacing.xl },
  label: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: Spacing.md },
})
