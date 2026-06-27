import { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { PhotoUpload } from '../../components/ui/PhotoUpload'
import { ExitConfirmDialog } from '../../components/layout/ExitConfirmDialog'
import { useDriverStore } from '../../store/driverStore'
import { useUserStore } from '../../store/userStore'
import { supabase } from '../../lib/supabase'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'
import { DirIcon } from '../../components/ui/DirIcon'
import { useIsRTL } from '../../i18n/locale'

const VEHICLE_TYPES: { type: string; icon: string; labelKey: TranslationKey }[] = [
  { type: 'sedan', icon: 'car',       labelKey: 'driverReg.sedan' },
  { type: 'moto',  icon: 'motorbike', labelKey: 'driverReg.moto' },
]

export default function DriverRegistration() {
  const Colors = useColors()
  const isRTL  = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets = useSafeAreaInsets()
  const {
    registrationStep,
    formData,
    vehicleMode,
    nextStep,
    prevStep,
    updateForm,
    setPhoto,
    setDocPhoto,
    setVehicleMode,
    submitRegistration,
  } = useDriverStore()
  const profile        = useUserStore((s) => s.profile)
  const setProfile     = useUserStore((s) => s.setProfile)
  const step    = registrationStep
  const t       = useT()

  const [exit,    setExit]    = useState(false)
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [photoOk, setPhotoOk] = useState(false)
  const [agree1,  setAgree1]  = useState(false)
  const [agree2,  setAgree2]  = useState(false)
  const [loading, setLoading] = useState(false)

  // ─── Validation ──────────────────────────────────────────────────────────────
  function validateStep1() {
    const e: Record<string, string> = {}
    if (!formData.firstName)  e.firstName = t('driverReg.errRequired')
    if (!formData.lastName)   e.lastName  = t('driverReg.errRequired')
    if (!formData.birthDate)  e.birthDate = t('driverReg.errRequired')
    if (!photoOk)             e.photo     = t('driverReg.errPhoto')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2() {
    const e: Record<string, string> = {}
    if (!formData.licenseNumber)   e.licenseNumber   = t('driverReg.errRequired')
    if (!formData.licenseExpiry)   e.licenseExpiry   = t('driverReg.errRequired')
    if (!formData.grayCardNumber)  e.grayCardNumber  = t('driverReg.errRequired')
    if (!formData.birthPlace)      e.birthPlace      = t('driverReg.errRequired')
    if (!formData.licensePhotoUri) e.licensePhoto    = t('driverReg.errPhoto')
    if (!formData.grayCardPhotoUri) e.grayCardPhoto  = t('driverReg.errPhoto')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep3() {
    const e: Record<string, string> = {}
    if (!formData.vehicleFrontUri) e.vehicleFront = t('driverReg.errPhoto')
    if (!formData.vehicleRearUri)  e.vehicleRear  = t('driverReg.errPhoto')
    if (vehicleMode === 'moto' && !formData.pieceIdentiteUri)
      e.pieceIdentite = t('driverReg.errPhoto')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────
  async function onNext() {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    if (step === 3) {
      if (!validateStep3()) return
      setLoading(true)
      try {
        // ── Résolution de l'ID en cascade ───────────────────────────────
        // 1. profile.id depuis le store (AsyncStorage)
        let userId = profile?.id as string | undefined

        // 2. Supabase Auth session active
        if (!userId) {
          try {
            const { data: { user } } = await supabase.auth.getUser()
            userId = user?.id
            if (user && !profile) {
              const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
              if (p) setProfile(p)
            }
          } catch (_) {}
        }

        // 3. Refresh de session Supabase
        if (!userId) {
          try {
            const { data: refreshed } = await supabase.auth.refreshSession()
            userId = refreshed.user?.id
          } catch (_) {}
        }

        // 4. Aucune source disponible → forcer reconnexion
        if (!userId) {
          Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.')
          router.replace('/(auth)/login')
          return
        }

        await submitRegistration(userId)
      } catch (err: any) {
        console.warn('[WinRak] submitRegistration error:', err)
        if (err?.message === 'no_auth') {
          Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.')
          router.replace('/(auth)/login')
          return
        }
        // Autres erreurs (réseau, upload) → on navigue quand même
        // Les docs peuvent être re-soumises depuis driver-documents
      } finally {
        setLoading(false)
      }
      router.replace('/(driver)/driver-pending')
      return
    }
    setErrors({})
    nextStep()
  }

  const stepTitle =
    step === 1 ? t('driverReg.step1')
    : step === 2 ? t('driverReg.step2')
    : t('driverReg.step3')

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.header}>
        <Pressable onPress={() => setExit(true)}>
          <Icon name="close" size={22} color={Colors.white} />
        </Pressable>
        <Txt weight="bold" size={18} style={{ flex: 1, textAlign: 'center' }}>{stepTitle}</Txt>
        <Txt size={13} color={Colors.blue}>{t('driverReg.help')}</Txt>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── STEP 1: معلومات شخصية + صورة السيلفي ─────────────────── */}
        {step === 1 && (
          <View style={{ gap: Spacing.lg, alignItems: 'center' }}>
            <PhotoUpload
              shape="square"
              size={120}
              required={!photoOk}
              onPhotoSelected={(u) => { setPhoto(u); setPhotoOk(true) }}
            />
            {errors.photo && <Txt size={12} color={Colors.danger}>{errors.photo}</Txt>}
            <View style={{ width: '100%', gap: Spacing.md }}>
              <Input
                label={t('form.firstName')}
                placeholder={t('form.firstName')}
                value={formData.firstName}
                onChangeText={(v) => updateForm('firstName', v)}
                required
                error={errors.firstName}
              />
              <Input
                label={t('form.lastName')}
                placeholder={t('form.lastName')}
                value={formData.lastName}
                onChangeText={(v) => updateForm('lastName', v)}
                required
                error={errors.lastName}
              />
              <Input
                label={t('driverReg.birthDate')}
                placeholder="YYYY-MM-DD"
                value={formData.birthDate}
                onChangeText={(v) => updateForm('birthDate', v)}
                required
                error={errors.birthDate}
              />
            </View>
          </View>
        )}

        {/* ── STEP 2: وثائق السيارة (نصوص + صور permis + carte_grise) ── */}
        {step === 2 && (
          <View style={{ gap: Spacing.md }}>
            <Txt size={14} color={Colors.muted}>{t('driverReg.requiredDocs')}</Txt>
            <Input
              label={t('driverReg.licenseNum')}
              placeholder={t('driverReg.licenseNumPh')}
              leftIcon="card-account-details"
              value={formData.licenseNumber}
              onChangeText={(v) => updateForm('licenseNumber', v)}
              required
              error={errors.licenseNumber}
            />
            <Input
              label={t('driverReg.licenseExpiry')}
              placeholder="YYYY-MM-DD"
              leftIcon="calendar"
              value={formData.licenseExpiry}
              onChangeText={(v) => updateForm('licenseExpiry', v)}
              required
              error={errors.licenseExpiry}
            />
            <Input
              label={t('driverReg.grayCard')}
              placeholder={t('driverReg.grayCardPh')}
              leftIcon="car"
              value={formData.grayCardNumber}
              onChangeText={(v) => updateForm('grayCardNumber', v)}
              required
              error={errors.grayCardNumber}
            />
            <Input
              label={t('driverReg.birthPlace')}
              placeholder={t('driverReg.birthPlacePh')}
              leftIcon="map-marker"
              value={formData.birthPlace}
              onChangeText={(v) => updateForm('birthPlace', v)}
              required
              error={errors.birthPlace}
            />

            {/* صور الوثائق */}
            <View style={styles.docRow}>
              <View style={styles.docItem}>
                <PhotoUpload
                  shape="square"
                  size={140}
                  label={t('driverReg.licenseDoc')}
                  initialUri={formData.licensePhotoUri ?? undefined}
                  onPhotoSelected={(u) => setDocPhoto('licensePhotoUri', u)}
                />
                {errors.licensePhoto && (
                  <Txt size={11} color={Colors.danger} center>{errors.licensePhoto}</Txt>
                )}
              </View>
              <View style={styles.docItem}>
                <PhotoUpload
                  shape="square"
                  size={140}
                  label={t('driverReg.grayCardDoc')}
                  initialUri={formData.grayCardPhotoUri ?? undefined}
                  onPhotoSelected={(u) => setDocPhoto('grayCardPhotoUri', u)}
                />
                {errors.grayCardPhoto && (
                  <Txt size={11} color={Colors.danger} center>{errors.grayCardPhoto}</Txt>
                )}
              </View>
            </View>

            <View style={styles.infoBanner}>
              <Icon name="help-circle" size={18} color={Colors.gold} />
              <Txt size={12} color={Colors.white} style={{ flex: 1 }}>
                {t('driverReg.reviewTime')}
              </Txt>
            </View>
          </View>
        )}

        {/* ── STEP 3: معلومات المركبة + صور السيارة ─────────────────── */}
        {step === 3 && (
          <View style={{ gap: Spacing.md }}>
            <Txt size={13} color={Colors.muted}>{t('driverReg.vehicleType')}</Txt>

            {/* نوع المركبة */}
            <View style={styles.typeRow}>
              {VEHICLE_TYPES.map((v) => {
                const on = formData.vehicleType === v.type
                return (
                  <Pressable
                    key={v.type}
                    style={[styles.typeChip, on && styles.typeChipOn]}
                    onPress={() => {
                      updateForm('vehicleType', v.type)
                      setVehicleMode(v.type === 'moto' ? 'moto' : 'vtc')
                    }}
                  >
                    <Icon name={v.icon} size={22} color={on ? Colors.gold : Colors.muted} />
                    <Txt size={11} color={on ? Colors.gold : Colors.muted}>{t(v.labelKey)}</Txt>
                  </Pressable>
                )
              })}
            </View>

            <Input
              label={t('driverReg.brand')}
              placeholder={t('driverReg.brandPh')}
              value={formData.vehicleBrand}
              onChangeText={(v) => updateForm('vehicleBrand', v)}
            />
            <Input
              label={t('driverReg.color')}
              placeholder={t('driverReg.colorPh')}
              value={formData.vehicleColor}
              onChangeText={(v) => updateForm('vehicleColor', v)}
            />
            <Input
              label={t('driverReg.year')}
              placeholder="2022"
              type="numeric"
              value={formData.vehicleYear}
              onChangeText={(v) => updateForm('vehicleYear', v)}
            />
            <Input
              label={t('driverReg.plate')}
              placeholder="000-000-16"
              value={formData.vehiclePlate}
              onChangeText={(v) => updateForm('vehiclePlate', v)}
            />

            {/* صور المركبة */}
            <Txt size={13} color={Colors.muted} style={{ marginTop: Spacing.sm }}>
              {t('driverReg.vehiclePhotos')}
            </Txt>
            <View style={styles.docRow}>
              <View style={styles.docItem}>
                <PhotoUpload
                  shape="square"
                  size={140}
                  label={t('driverReg.vehicleFront')}
                  initialUri={formData.vehicleFrontUri ?? undefined}
                  onPhotoSelected={(u) => setDocPhoto('vehicleFrontUri', u)}
                />
                {errors.vehicleFront && (
                  <Txt size={11} color={Colors.danger} center>{errors.vehicleFront}</Txt>
                )}
              </View>
              <View style={styles.docItem}>
                <PhotoUpload
                  shape="square"
                  size={140}
                  label={t('driverReg.vehicleRear')}
                  initialUri={formData.vehicleRearUri ?? undefined}
                  onPhotoSelected={(u) => setDocPhoto('vehicleRearUri', u)}
                />
                {errors.vehicleRear && (
                  <Txt size={11} color={Colors.danger} center>{errors.vehicleRear}</Txt>
                )}
              </View>
            </View>

            {/* piece_identite — Moto uniquement */}
            {vehicleMode === 'moto' && (
              <View style={{ gap: Spacing.sm }}>
                <Txt size={13} color={Colors.muted}>{t('driverReg.pieceIdentiteHint')}</Txt>
                <View style={styles.docRowCenter}>
                  <View style={styles.docItem}>
                    <PhotoUpload
                      shape="square"
                      size={160}
                      label={t('driverReg.pieceIdentite')}
                      initialUri={formData.pieceIdentiteUri ?? undefined}
                      onPhotoSelected={(u) => setDocPhoto('pieceIdentiteUri', u)}
                    />
                    {errors.pieceIdentite && (
                      <Txt size={11} color={Colors.danger} center>{errors.pieceIdentite}</Txt>
                    )}
                  </View>
                </View>
              </View>
            )}

            <Checkbox checked={agree1} onToggle={() => setAgree1(!agree1)} label={t('driverReg.agreeInfo')} />
            <Checkbox checked={agree2} onToggle={() => setAgree2(!agree2)} label={t('driverReg.agreeTerms')} />
          </View>
        )}

        <View style={{ height: Spacing.lg }} />
      </ScrollView>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(step / 3) * 100}%` }]} />
        </View>
        <View style={styles.footRow}>
          <Txt weight="bold" size={13}>{t('driverReg.stepOf', { step: String(step) })}</Txt>
          <View style={styles.footBtns}>
            <Pressable
              style={[styles.backBtn, step === 1 && { opacity: 0.35 }]}
              onPress={step === 1 ? undefined : prevStep}
              disabled={step === 1}
            >
              <DirIcon name="arrow-left" size={20} color={Colors.white} />
            </Pressable>
            <Button
              label={step === 3 ? (loading ? '...' : t('driverReg.submit')) : t('driverReg.next')}
              fullWidth={false}
              disabled={(step === 3 && (!agree1 || !agree2)) || loading}
              onPress={onNext}
              style={styles.nextBtn}
            />
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

// ─── Checkbox ────────────────────────────────────────────────────────────────
function Checkbox({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  const Colors = useColors()
  const isRTL  = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  return (
    <Pressable style={styles.checkRow} onPress={onToggle}>
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked && <Icon name="check" size={14} color={Colors.dark1} />}
      </View>
      <Txt size={13} style={{ flex: 1 }}>{label}</Txt>
    </Pressable>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container:  { flex: 1, backgroundColor: Colors.dark1, paddingHorizontal: Spacing.screenPadding },
    header:     { flexDirection: row, alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
    content:    { paddingVertical: Spacing.sm },
    docRow:     { flexDirection: row, gap: Spacing.md, justifyContent: 'center' },
    docRowCenter: { alignItems: 'center' },
    docItem:    { gap: 4, alignItems: 'center' },
    infoBanner: {
      flexDirection: row,
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: Colors.goldAlpha15,
      borderRadius: 10,
      padding: Spacing.md,
    },
    typeRow:    { flexDirection: row, gap: Spacing.sm },
    typeChip: {
      flex: 1,
      height: 60,
      borderRadius: Spacing.radiusMd,
      borderWidth: 1.5,
      borderColor: 'transparent',
      backgroundColor: Colors.dark3,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    typeChipOn: { borderColor: Colors.gold, backgroundColor: Colors.goldAlpha10 },
    checkRow: {
      flexDirection: row,
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: Colors.dark3,
      borderRadius: Spacing.radiusSm,
      padding: Spacing.md,
    },
    box: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: Colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxOn:    { backgroundColor: Colors.gold, borderColor: Colors.gold },
    footer:   { paddingTop: Spacing.md },
    track:    { height: 3, backgroundColor: Colors.dark3, borderRadius: 2, overflow: 'hidden', marginBottom: Spacing.md },
    fill:     { height: 3, backgroundColor: Colors.gold },
    footRow:  { flexDirection: row, alignItems: 'center', justifyContent: 'space-between' },
    footBtns: { flexDirection: row, alignItems: 'center', gap: Spacing.sm },
    backBtn: {
      height: 44,
      paddingHorizontal: Spacing.lg,
      backgroundColor: Colors.dark3,
      borderRadius: Spacing.radiusMd,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextBtn: { paddingHorizontal: Spacing.xxl },
  })
}
