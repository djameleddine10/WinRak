import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { TopBar } from '../../components/layout/TopBar'
import { router } from 'expo-router'
import { useUserStore } from '../../store/userStore'
import { useT } from '../../hooks/useT'
import { usePassengerName } from '../../i18n/locale'
import { DirIcon } from '../../components/ui/DirIcon'
import { useIsRTL } from '../../i18n/locale'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ProfileSettings() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const passenger = useUserStore((s) => s.passenger)
  const photoStatus = useUserStore((s) => s.photoStatus)
  const photoUri = useUserStore((s) => s.photoUri)
  const mode = useUserStore((s) => s.mode)
  const t = useT()
  const passengerName = usePassengerName()

  const [name, setName] = useState(passenger.firstName)
  const [last, setLast] = useState(passenger.lastName)
  const [email, setEmail] = useState(passenger.email)

  return (
    <View style={styles.container}>
      <TopBar title={t('profile.editProfile')} showBack onBack={() => mode === 'driver' ? router.replace('/(driver)/home') : router.back()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.avatarWrap} onPress={() => router.push('/(passenger)/profile-setup')}>
          <Avatar initial={passengerName.charAt(0).toUpperCase()} size={90} imageUri={photoUri} showBorder />
          <View style={styles.editBadge}>
            <Icon name="camera" size={16} color={Colors.white} />
          </View>
        </Pressable>

        {photoStatus === 'missing' && (
          <Pressable style={styles.warn} onPress={() => router.push('/(passenger)/profile-setup')}>
            <Txt size={13} color={Colors.white}>{t('profileSettings.photoWarnTitle')}</Txt>
            <Txt size={11} color={Colors.muted} style={{ marginTop: 2 }}>{t('profileSettings.photoWarnSub')}</Txt>
            <View style={styles.warnBtn}><Txt size={11} color={Colors.dark1} weight="bold">{t('home.takePhoto')}</Txt></View>
          </Pressable>
        )}

        <View style={styles.fields}>
          <Input label={t('form.firstName')} placeholder={t('form.firstName')} value={name} onChangeText={setName} />
          <Input label={t('form.lastName')} placeholder={t('form.lastName')} value={last} onChangeText={setLast} />
          <Input label={t('form.email')} placeholder={t('form.emailShort')} value={email} onChangeText={setEmail} />
          <Pressable style={styles.linkRow}>
            <Txt size={14} style={{ flex: 1 }}>{t('form.city')}</Txt>
            <Txt size={14} color={Colors.muted}>{passenger.city}</Txt>
            <DirIcon name="chevron-right" size={20} color={Colors.muted} />
          </Pressable>
          <Pressable style={styles.linkRow}>
            <Txt size={14} style={{ flex: 1 }}>{t('form.phone')}</Txt>
            <Txt size={14} color={Colors.muted}>{passenger.phoneMasked}</Txt>
            <DirIcon name="chevron-right" size={20} color={Colors.muted} />
          </Pressable>
        </View>

        <Button label={t('form.save')} onPress={() => router.back()} />
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding },
    avatarWrap: { alignSelf: 'center', marginVertical: Spacing.lg },
    editBadge: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.dark3, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark1 },
    warn: { backgroundColor: Colors.dangerAlpha10, borderRadius: Spacing.radiusMd, padding: Spacing.md, marginBottom: Spacing.lg },
    warnBtn: { backgroundColor: Colors.white, alignSelf: 'flex-start', borderRadius: Spacing.radiusSm, paddingHorizontal: Spacing.md, paddingVertical: 6, marginTop: Spacing.sm },
    fields: { gap: Spacing.md, marginBottom: Spacing.xl },
    linkRow: { flexDirection: row, alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.dark3, borderRadius: 10, height: 52, paddingHorizontal: Spacing.md },
  })
}
