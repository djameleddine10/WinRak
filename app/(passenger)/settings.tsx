import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Spacing } from '../../constants/spacing'
import { type Palette } from '../../constants/colors'
import { useColors, useThemeMode } from '../../hooks/useColors'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { TopBar } from '../../components/layout/TopBar'
import { useUserStore } from '../../store/userStore'
import { useSettingsStore, type ThemeMode, type DistanceUnit, type Language } from '../../store/settingsStore'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'
import { DirIcon } from '../../components/ui/DirIcon'
import { useIsRTL } from '../../i18n/locale'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const THEME_KEY: Record<ThemeMode, TranslationKey> = { light: 'theme.light', dark: 'theme.dark', system: 'theme.system' }
const DISTANCE_KEY: Record<DistanceUnit, TranslationKey> = { km: 'distance.km', mi: 'distance.mi' }
const LANG_LABEL: Record<Language, string> = { ar: 'العربية', fr: 'Français', en: 'English' }

export default function Settings() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const logout = useUserStore((s) => s.logout)
  const mode = useUserStore((s) => s.mode)
  const themeMode = useThemeMode()
  const distanceUnit = useSettingsStore((s) => s.distanceUnit)
  const language = useSettingsStore((s) => s.language)
  const t = useT()
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  function doLogout() {
    logout()
    router.replace('/(auth)/login')
  }

  function handleDeleteConfirmed() {
    setDeleteConfirm(false)
    logout()
    router.replace('/(auth)/login')
  }

  return (
    <View style={styles.container}>
      <TopBar title={t('settings.title')} showBack onBack={() => mode === 'driver' ? router.replace('/(driver)/home') : router.back()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <Card radius={14} padding={0}>
          <Row icon="weather-night" label={t('settings.appearance')} value={t(THEME_KEY[themeMode])} onPress={() => router.push('/(passenger)/appearance')} />
          <Row icon="map-marker-distance" label={t('settings.distanceUnit')} value={t(DISTANCE_KEY[distanceUnit])} onPress={() => router.push('/(passenger)/distance-unit')} />
          <Row icon="translate" label={t('settings.language')} value={LANG_LABEL[language]} onPress={() => router.push('/(passenger)/language')} last />
        </Card>

        <Card radius={14} padding={0} style={{ marginTop: Spacing.md }}>
          <Row icon="file-document" label={t('settings.legal')} onPress={() => router.push('/(passenger)/legal')} />
          <Row icon="cog" label={t('settings.appVersion')} value="1.0.0" noChevron last />
        </Card>

        <Card radius={14} padding={0} style={{ marginTop: Spacing.md }}>
          <Pressable style={styles.row} onPress={doLogout}>
            <Icon name="logout" size={22} color={Colors.white} />
            <Txt size={14} style={{ flex: 1 }}>{t('settings.logout')}</Txt>
          </Pressable>
          <Pressable style={[styles.row, styles.borderTop]} onPress={() => setDeleteConfirm(true)}>
            <Icon name="trash-can" size={22} color={Colors.danger} />
            <Txt size={14} color={Colors.danger} style={{ flex: 1 }}>{t('settings.deleteAccount')}</Txt>
          </Pressable>
        </Card>

        <Pressable style={styles.info} onPress={() => router.push('/(passenger)/profile-settings')}>
          <Txt size={13} color={Colors.pureWhite}>{t('settings.movedInfo')}</Txt>
          <View style={styles.infoBtn}><Txt size={12} color="#16181b" weight="bold">{t('settings.changePhone')}</Txt></View>
        </Pressable>
      </ScrollView>

      {/* Delete account confirmation modal */}
      <Modal visible={deleteConfirm} transparent animationType="fade" onRequestClose={() => setDeleteConfirm(false)}>
        <Pressable style={styles.overlay} onPress={() => setDeleteConfirm(false)}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            {/* Danger icon */}
            <View style={styles.dialogIconWrap}>
              <Icon name="trash-can" size={34} color={Colors.danger} />
            </View>

            <Txt weight="bold" size={19} center style={{ marginTop: Spacing.md }}>
              {t('settings.deleteTitle')}
            </Txt>
            <Txt size={14} color={Colors.muted} center style={{ marginTop: Spacing.sm, lineHeight: 22 }}>
              {t('settings.deleteMsg')}
            </Txt>

            <View style={styles.dialogBtns}>
              <Button
                label={t('settings.deleteConfirm')}
                variant="danger"
                size="md"
                onPress={handleDeleteConfirmed}
              />
              <Button
                label={t('common.cancel')}
                icon="close"
                variant="outline"
                size="md"
                onPress={() => setDeleteConfirm(false)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

function Row({ icon, label, value, last, noChevron, onPress }: { icon: string; label: string; value?: string; last?: boolean; noChevron?: boolean; onPress?: () => void }) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const body = (
    <View style={[styles.row, !last && styles.borderBottom]}>
      <Icon name={icon} size={22} color={Colors.gold} />
      <Txt size={14} style={{ flex: 1 }}>{label}</Txt>
      {value && <Txt size={13} color={Colors.muted}>{value}</Txt>}
      {!noChevron && <DirIcon name="chevron-right" size={20} color={Colors.muted} />}
    </View>
  )
  if (onPress) {
    return <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>{body}</Pressable>
  }
  return body
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding },
    row: { flexDirection: row, alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    borderTop: { borderTopWidth: 1, borderTopColor: Colors.border },
    info: { backgroundColor: Colors.blue, borderRadius: 14, padding: Spacing.lg, marginTop: Spacing.lg, gap: Spacing.md },
    infoBtn: { backgroundColor: Colors.pureWhite, alignSelf: 'flex-start', borderRadius: Spacing.radiusSm, paddingHorizontal: Spacing.md, paddingVertical: 8 },
    overlay: {
      flex: 1, backgroundColor: Colors.overlay,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
    },
    dialog: {
      width: '100%', backgroundColor: Colors.dark2,
      borderRadius: 20, padding: Spacing.xl,
      alignItems: 'center',
    },
    dialogIconWrap: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: Colors.dangerAlpha10,
      alignItems: 'center', justifyContent: 'center',
      alignSelf: 'center',
    },
    dialogBtns: {
      flexDirection: 'column', gap: Spacing.sm,
      marginTop: Spacing.xl, width: '100%',
    },
  })
}
