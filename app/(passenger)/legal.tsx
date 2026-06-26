import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Spacing } from '../../constants/spacing'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { DirIcon } from '../../components/ui/DirIcon'
import { Card } from '../../components/ui/Card'
import { TopBar } from '../../components/layout/TopBar'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'
import { useIsRTL } from '../../i18n/locale'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const DOCS: { key: string; labelKey: TranslationKey }[] = [
  { key: 'terms',   labelKey: 'login.terms' },
  { key: 'privacy', labelKey: 'login.privacy' },
  { key: 'license', labelKey: 'legal.license' },
]

export default function Legal() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const t = useT()
  return (
    <View style={styles.container}>
      <TopBar title={t('settings.legal')} showBack />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <Card radius={14} padding={0}>
          {DOCS.map((d, i) => (
            <Pressable
              key={d.key}
              style={[styles.row, i < DOCS.length - 1 && styles.borderBottom]}
              onPress={() => router.push({ pathname: '/(passenger)/legal-doc', params: { key: d.key, title: t(d.labelKey) } })}
            >
              <Icon name="file-document" size={22} color={Colors.gold} />
              <Txt size={15} style={{ flex: 1 }}>{t(d.labelKey)}</Txt>
              <DirIcon name="chevron-right" size={20} color={Colors.muted} />
            </Pressable>
          ))}
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
