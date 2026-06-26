import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { type Palette } from '../../../constants/colors'
import { useColors } from '../../../hooks/useColors'
import { Spacing } from '../../../constants/spacing'
import { Txt } from '../../../components/ui/Txt'
import { Icon } from '../../../components/ui/Icon'
import { Card } from '../../../components/ui/Card'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'
import { TopBar } from '../../../components/layout/TopBar'
import { useUserStore } from '../../../store/userStore'
import { useT } from '../../../hooks/useT'
import { usePassengerName } from '../../../i18n/locale'
import { DirIcon } from '../../../components/ui/DirIcon'
import { type TranslationKey } from '../../../i18n/translations'
import { useIsRTL } from '../../../i18n/locale'

interface MenuItem { icon: string; labelKey: TranslationKey; route: string; danger?: boolean }

const MENU: MenuItem[] = [
  { icon: 'account', labelKey: 'profile.editProfile', route: '/(passenger)/profile-settings' },
  { icon: 'map-marker-radius', labelKey: 'rides.title', route: '/(passenger)/(tabs)/rides-history' },
  { icon: 'wallet', labelKey: 'nav.wallet', route: '/(passenger)/(tabs)/wallet' },
  { icon: 'shield-check', labelKey: 'drawer.safety', route: '/(passenger)/security' },
  { icon: 'bell', labelKey: 'drawer.notifications', route: '/(passenger)/notifications' },
  { icon: 'cog', labelKey: 'settings.title', route: '/(passenger)/settings' },
  { icon: 'help-circle', labelKey: 'drawer.help', route: '/(passenger)/help' },
  { icon: 'card-account-details', labelKey: 'drawer.registerDriver', route: '/(driver)/driver-signup' },
]

export default function Profile() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const passenger = useUserStore((s) => s.passenger)
  const photoStatus = useUserStore((s) => s.photoStatus)
  const photoUri = useUserStore((s) => s.photoUri)
  const t = useT()
  const displayName = usePassengerName()


  return (
    <View style={styles.container}>
      <TopBar title={t('nav.account')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card radius={14} style={styles.head} onPress={() => router.push('/(passenger)/profile-settings')}>
          <Avatar initial={displayName.charAt(0).toUpperCase()} size={64} imageUri={photoUri} showBorder />
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size={18}>{displayName}</Txt>
            <View style={styles.metaRow}>
              <Icon name="star" size={14} color={Colors.gold} />
              <Txt size={13} color={Colors.gold}>{passenger.rating}</Txt>
              <Txt size={13} color={Colors.muted}>• {t('profile.rides', { n: passenger.totalRides })}</Txt>
            </View>
          </View>
          <DirIcon name="chevron-right" size={22} color={Colors.muted} />
        </Card>

        {photoStatus === 'missing' && (
          <Badge label={t('profile.photoNotUploaded')} variant="red" />
        )}

        <Card radius={14} padding={0} style={{ marginTop: Spacing.md }}>
          {MENU.map((m, i) => (
            <Pressable key={m.labelKey} style={[styles.row, i < MENU.length - 1 && styles.rowBorder]} onPress={() => router.push(m.route as any)}>
              <Icon name={m.icon} size={22} color={Colors.gold} />
              <Txt size={14} style={{ flex: 1 }}>{t(m.labelKey)}</Txt>
              <DirIcon name="chevron-right" size={20} color={Colors.muted} />
            </Pressable>
          ))}
        </Card>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding },
    head: { flexDirection: row, alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
    metaRow: { flexDirection: row, alignItems: 'center', gap: 4, marginTop: 4 },
    row: { flexDirection: row, alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  })
}
