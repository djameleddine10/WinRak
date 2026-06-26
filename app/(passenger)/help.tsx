import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Spacing } from '../../constants/spacing'
import { useColors } from '../../hooks/useColors'
import { Txt } from '../../components/ui/Txt'
import { DirIcon } from '../../components/ui/DirIcon'
import { TopBar } from '../../components/layout/TopBar'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'
import { useIsRTL } from '../../i18n/locale'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
  const Colors = useColors()
  const insets = useSafeAreaInsets()
  const isRTL = useIsRTL()
  const t = useT()
  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark1 }}>
      <TopBar title={t('drawer.support')} showBack />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {SECTIONS.map((s) => (
          <View key={s.titleKey} style={styles.section}>
            <Txt size={12} color={Colors.muted} style={styles.label}>{t(s.titleKey)}</Txt>
            {s.items.map((item, i) => (
              <Pressable
                key={item.key}
                style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }, i < s.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}
                onPress={item.onPress}
              >
                <Txt size={14} color={Colors.white} style={{ flex: 1 }}>{t(item.key)}</Txt>
                <DirIcon name="chevron-right" size={20} color={Colors.muted} />
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
  row: { alignItems: 'center', paddingVertical: Spacing.md },
})
