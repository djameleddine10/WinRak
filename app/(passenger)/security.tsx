import { useMemo } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { TopBar } from '../../components/layout/TopBar'
import { DirIcon } from '../../components/ui/DirIcon'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'
import { useIsRTL } from '../../i18n/locale'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const GRID: { icon: string; labelKey: TranslationKey; detailKey: string }[] = [
  { icon: 'shield-check',         labelKey: 'security.g1', detailKey: 'g1' },
  { icon: 'card-account-details', labelKey: 'security.g2', detailKey: 'g2' },
  { icon: 'phone',                labelKey: 'security.g3', detailKey: 'g3' },
  { icon: 'lock',                 labelKey: 'security.g4', detailKey: 'g4' },
]

function goDetail(key: string) {
  router.push({ pathname: '/(passenger)/security-detail', params: { detailKey: key } } as any)
}

export default function Security() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const t = useT()

  return (
    <View style={styles.container}>
      <TopBar title={t('drawer.safety')} showBack />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>

        {/* Top action row */}
        <View style={styles.topRow}>
          <Pressable
            style={({ pressed }) => [styles.topCard, pressed && styles.pressed]}
            onPress={() => router.push('/(passenger)/help')}
          >
            <Icon name="message-text" size={22} color={Colors.gold} />
            <Txt size={13}>{t('drawer.help')}</Txt>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.topCard, pressed && styles.pressed]}
            onPress={() => router.push('/(passenger)/emergency-contacts')}
          >
            <Icon name="account-group" size={22} color={Colors.gold} />
            <Txt size={13}>{t('security.emergencyContacts')}</Txt>
          </Pressable>
        </View>

        {/* Call 17 */}
        <Pressable
          style={({ pressed }) => [styles.sosCall, pressed && { opacity: 0.85 }]}
          onPress={() => Linking.openURL('tel:17')}
          android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
        >
          <Icon name="bell" size={22} color={Colors.pureWhite} />
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size={16} color={Colors.pureWhite}>{t('security.call17')}</Txt>
            <Txt size={12} color="rgba(255,255,255,0.7)">{t('security.police')}</Txt>
          </View>
          <DirIcon name="chevron-right" size={22} color="rgba(255,255,255,0.5)" />
        </Pressable>

        {/* How we protect you */}
        <Txt weight="bold" size={18} style={{ marginTop: Spacing.sm }}>
          {t('security.howWeProtect')}
        </Txt>

        <View style={styles.grid}>
          {GRID.map((g) => (
            <Pressable
              key={g.detailKey}
              style={({ pressed }) => [styles.gridCard, pressed && styles.pressed]}
              onPress={() => goDetail(g.detailKey)}
            >
              <Txt size={13} weight="bold">{t(g.labelKey)}</Txt>
              <Icon name={g.icon} size={28} color={Colors.gold} style={{ alignSelf: 'flex-start' }} />
            </Pressable>
          ))}

          {/* Incidents — full width */}
          <Pressable
            style={({ pressed }) => [styles.gridCard, styles.gridFull, pressed && styles.pressed]}
            onPress={() => goDetail('incidents')}
          >
            <Txt size={13} weight="bold">{t('security.incidents')}</Txt>
            <Icon name="alert" size={28} color={Colors.danger} style={{ alignSelf: 'flex-start' }} />
          </Pressable>
        </View>

      </ScrollView>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding, gap: Spacing.md },
    topRow: { flexDirection: row, gap: Spacing.sm },
    topCard: {
      flex: 1, height: 60, backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd,
      flexDirection: row, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    },
    sosCall: {
      flexDirection: row, alignItems: 'center', gap: Spacing.md,
      backgroundColor: 'rgba(220,60,60,0.9)', borderRadius: Spacing.radiusMd,
      height: 56, paddingHorizontal: Spacing.lg,
    },
    grid: { flexDirection: row, flexWrap: 'wrap', gap: Spacing.sm },
    gridCard: {
      width: '48.5%', height: 120, backgroundColor: Colors.dark3,
      borderRadius: Spacing.radiusMd, padding: Spacing.md, justifyContent: 'space-between',
    },
    gridFull: { width: '100%', height: 90 },
    pressed: { opacity: 0.72 },
  })
}
