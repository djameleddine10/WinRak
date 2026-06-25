import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { PhotoUpload } from '../../components/ui/PhotoUpload'
import { ExitConfirmDialog } from '../../components/layout/ExitConfirmDialog'
import { useUserStore } from '../../store/userStore'
import { useT } from '../../hooks/useT'
import { usePassengerName } from '../../i18n/locale'
import { DirIcon } from '../../components/ui/DirIcon'
import { supabase } from '../../lib/supabase'
import { createProfile, getMyProfile } from '../../services/auth.service'

export default function ProfileSetup() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const passenger = useUserStore((s) => s.passenger)
  const setPhotoUri = useUserStore((s) => s.setPhotoUri)
  const setProfile = useUserStore((s) => s.setProfile)
  const storePhone = useUserStore((s) => s.phone)
  const t = useT()
  const passengerName = usePassengerName()

  const [step, setStep] = useState(1)
  const [exit, setExit] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [name, setName] = useState(passenger.firstName)
  const [last, setLast] = useState('')
  const [birth, setBirth] = useState('')

  async function finish() {
    setPhotoUri(photo) // persists the photo + marks it approved

    // New user (no DB profile yet) → create the profiles + passengers rows in Supabase.
    // Existing users editing their photo skip this (profile already exists).
    const existing = useUserStore.getState().profile
    const fullName = `${name} ${last}`.trim()
    if (!existing && fullName) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await createProfile({
            id:         user.id,
            phone:      storePhone || (user.phone ? `+${user.phone}` : ''),
            role:       'passenger',
            fullName,
            fullNameAr: fullName,
          })
          const p = await getMyProfile()
          if (p) setProfile(p)
        }
      } catch (e: any) {
        if (__DEV__) console.warn('[WinRak] createProfile failed:', e.message)
      }
    }

    router.replace('/(passenger)/(tabs)/home')
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.header}>
        <Txt weight="bold" size={18} style={{ flex: 1 }}>
          {step === 1 ? t('setup.step1') : step === 2 ? t('setup.step2') : t('setup.step3')}
        </Txt>
        <Pressable onPress={() => setExit(true)}><Icon name="close" size={22} color={Colors.muted} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={{ gap: Spacing.lg, alignItems: 'center' }}>
            <PhotoUpload shape="square" size={120} required onPhotoSelected={setPhoto} initialUri={photo} />
            <View style={{ width: '100%', gap: Spacing.md }}>
              <Input label={t('form.firstName')} placeholder={t('form.firstName')} value={name} onChangeText={setName} required />
              <Input label={t('form.lastName')} placeholder={t('form.lastName')} value={last} onChangeText={setLast} required />
              <Input label={t('setup.birthDate')} placeholder="YYYY-MM-DD" value={birth} onChangeText={setBirth} />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: Spacing.lg }}>
            <Txt size={14} color={Colors.muted}>{t('setup.selfieTip1')}</Txt>
            <Txt size={14} color={Colors.muted}>{t('setup.selfieTip2')}</Txt>
            <View style={styles.examples}>
              <View style={[styles.exGood]}><Txt size={12} color={Colors.success}>{t('setup.faceFront')}</Txt></View>
              <View style={{ gap: Spacing.sm }}>
                {(['setup.faceSide', 'setup.withGlasses', 'setup.groupPhoto'] as const).map((k) => (
                  <View key={k} style={styles.exBad}><Txt size={10} color={Colors.danger}>❌ {t(k)}</Txt></View>
                ))}
              </View>
            </View>
            <PhotoUpload shape="square" size={130} required onPhotoSelected={setPhoto} initialUri={photo} />
          </View>
        )}

        {step === 3 && (
          <View style={{ alignItems: 'center', gap: Spacing.md }}>
            <Avatar initial={passengerName.charAt(0).toUpperCase()} size={90} imageUri={photo} showBorder />
            <Txt weight="bold" size={16}>{name} {last}</Txt>
            <Txt size={13} color={Colors.muted}>{passenger.city}</Txt>
            <Txt weight="bold" size={20} color={Colors.success} style={{ marginTop: Spacing.md }}>{t('setup.allReady')}</Txt>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={styles.track}><View style={[styles.fill, { width: `${(step / 3) * 100}%` }]} /></View>
        <View style={styles.footRow}>
          <Txt weight="bold" size={13}>{t('setup.stepOf', { step })}</Txt>
          <View style={styles.footBtns}>
            {step > 1 && (
              <Pressable style={styles.smallBtn} onPress={() => setStep(step - 1)}>
                <DirIcon name="arrow-left" size={20} color={Colors.white} />
              </Pressable>
            )}
            {step < 3 ? (
              <Button label={t('onboarding.next')} fullWidth={false} onPress={() => setStep(step + 1)} style={styles.nextBtn} />
            ) : (
              <Button label={t('form.submit')} fullWidth={false} onPress={finish} style={styles.nextBtn} />
            )}
          </View>
        </View>
      </View>

      <ExitConfirmDialog
        visible={exit}
        onConfirm={() => { setExit(false); router.back() }}
        onCancel={() => setExit(false)}
      />
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1, paddingHorizontal: Spacing.screenPadding },
    header: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: Spacing.lg },
    content: { paddingVertical: Spacing.lg },
    examples: { flexDirection: 'row-reverse', gap: Spacing.md },
    exGood: { width: 130, height: 130, borderRadius: Spacing.radiusMd, borderWidth: 2, borderColor: Colors.success, backgroundColor: Colors.dark3, alignItems: 'center', justifyContent: 'center' },
    exBad: { width: 90, height: 38, borderRadius: Spacing.radiusSm, borderWidth: 1.5, borderColor: Colors.danger, backgroundColor: Colors.dark3, alignItems: 'center', justifyContent: 'center' },
    footer: { paddingTop: Spacing.md },
    track: { height: 3, backgroundColor: Colors.dark3, borderRadius: 2, overflow: 'hidden', marginBottom: Spacing.md },
    fill: { height: 3, backgroundColor: Colors.gold },
    footRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
    footBtns: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
    smallBtn: { height: 44, paddingHorizontal: Spacing.lg, backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd, alignItems: 'center', justifyContent: 'center' },
    nextBtn: { paddingHorizontal: Spacing.xxxl },
  })
}
