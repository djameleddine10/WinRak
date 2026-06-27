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
import { PhotoUpload } from '../../components/ui/PhotoUpload'
import { ExitConfirmDialog } from '../../components/layout/ExitConfirmDialog'
import { useDriverStore } from '../../store/driverStore'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'
import { DirIcon } from '../../components/ui/DirIcon'
import { useIsRTL } from '../../i18n/locale'

// الأنواع المدعومة فعلياً في WinRak. القيمة المخزّنة (type) متوافقة مع قيود قاعدة البيانات.
const VEHICLE_TYPES: { type: string; icon: string; labelKey: TranslationKey }[] = [
  { type: 'economique', icon: 'car-hatchback', labelKey: 'driverReg.economique' },
  { type: 'confort',    icon: 'car-estate',    labelKey: 'driverReg.confort' },
  { type: 'sedan',      icon: 'car',           labelKey: 'driverReg.sedan' },
  { type: 'moto',       icon: 'motorbike',     labelKey: 'driverReg.moto' },
]

export default function DriverRegistration() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets = useSafeAreaInsets()
  const { registrationStep, formData, nextStep, prevStep, updateForm, setPhoto, submitRegistration } = useDriverStore()
  const step = registrationStep
  const t = useT()
  const [exit, setExit] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoOk, setPhotoOk] = useState(false)
  const [agree1, setAgree1] = useState(false)
  const [agree2, setAgree2] = useState(false)
  const [showAgreeErr, setShowAgreeErr] = useState(false)

  function validateStep1() {
    const e: Record<string, string> = {}
    if (!formData.firstName) e.firstName = t('driverReg.errRequired')
    if (!formData.lastName) e.lastName = t('driverReg.errRequired')
    if (!formData.birthDate) e.birthDate = t('driverReg.errRequired')
    if (!photoOk) e.photo = t('driverReg.errPhoto')
    setErrors(e)
    return Object.keys(e).length === 0
  }
  function validateStep2() {
    const e: Record<string, string> = {}
    if (!formData.licenseNumber) e.licenseNumber = t('driverReg.errRequired')
    if (!formData.licenseExpiry) e.licenseExpiry = t('driverReg.errRequired')
    if (!formData.grayCardNumber) e.grayCardNumber = t('driverReg.errRequired')
    if (!formData.birthPlace) e.birthPlace = t('driverReg.errRequired')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function onNext() {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    if (step === 3) {
      if (!agree1 || !agree2) { setShowAgreeErr(true); return }
      submitRegistration()
      router.replace('/(driver)/driver-setup-loading')
      return
    }
    setErrors({})
    nextStep()
  }

  const stepTitle = step === 1 ? t('driverReg.step1') : step === 2 ? t('driverReg.step2') : t('driverReg.step3')

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.header}>
        <Pressable onPress={() => setExit(true)}><Icon name="close" size={22} color={Colors.white} /></Pressable>
        <Txt weight="bold" size={18} style={{ flex: 1, textAlign: 'center' }}>{stepTitle}</Txt>
        <Txt size={13} color={Colors.blue}>{t('driverReg.help')}</Txt>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={{ gap: Spacing.lg, alignItems: 'center' }}>
            <PhotoUpload shape="square" size={120} required={!photoOk} onPhotoSelected={(u) => { setPhoto(u); setPhotoOk(true) }} />
            {errors.photo && <Txt size={12} color={Colors.danger}>{errors.photo}</Txt>}
            <View style={{ width: '100%', gap: Spacing.md }}>
              <Input label={t('form.firstName')} placeholder={t('form.firstName')} value={formData.firstName} onChangeText={(text) => updateForm('firstName', text)} required error={errors.firstName} />
              <Input label={t('form.lastName')} placeholder={t('form.lastName')} value={formData.lastName} onChangeText={(text) => updateForm('lastName', text)} required error={errors.lastName} />
              <Input label={t('driverReg.birthDate')} placeholder="YYYY-MM-DD" value={formData.birthDate} onChangeText={(text) => updateForm('birthDate', text)} required error={errors.birthDate} />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: Spacing.md }}>
            <Txt size={14} color={Colors.muted}>{t('driverReg.requiredDocs')}</Txt>
            <Input label={t('driverReg.licenseNum')} placeholder={t('driverReg.licenseNumPh')} leftIcon="card-account-details" value={formData.licenseNumber} onChangeText={(text) => updateForm('licenseNumber', text)} required error={errors.licenseNumber} />
            <Input label={t('driverReg.licenseExpiry')} placeholder="YYYY-MM-DD" leftIcon="calendar" value={formData.licenseExpiry} onChangeText={(text) => updateForm('licenseExpiry', text)} required error={errors.licenseExpiry} />
            <Input label={t('driverReg.grayCard')} placeholder={t('driverReg.grayCardPh')} leftIcon="car" value={formData.grayCardNumber} onChangeText={(text) => updateForm('grayCardNumber', text)} required error={errors.grayCardNumber} />
            <Input label={t('driverReg.birthPlace')} placeholder={t('driverReg.birthPlacePh')} leftIcon="map-marker" value={formData.birthPlace} onChangeText={(text) => updateForm('birthPlace', text)} required error={errors.birthPlace} />
            <View style={styles.docRow}>
              <PhotoUpload shape="square" size={140} label={t('driverReg.licenseDoc')} onPhotoSelected={() => {}} />
              <PhotoUpload shape="square" size={140} label={t('driverReg.grayCardDoc')} onPhotoSelected={() => {}} />
            </View>
            <View style={styles.infoBanner}>
              <Icon name="help-circle" size={18} color={Colors.gold} />
              <Txt size={12} color={Colors.white} style={{ flex: 1 }}>{t('driverReg.reviewTime')}</Txt>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={{ gap: Spacing.md }}>
            <Txt size={13} color={Colors.muted}>{t('driverReg.vehicleType')}</Txt>
            <View style={styles.typeRow}>
              {VEHICLE_TYPES.map((v) => {
                const on = formData.vehicleType === v.type
                return (
                  <Pressable key={v.type} style={[styles.typeChip, on && styles.typeChipOn]} onPress={() => updateForm('vehicleType', v.type)}>
                    <Icon name={v.icon} size={22} color={on ? Colors.gold : Colors.muted} />
                    <Txt size={11} color={on ? Colors.gold : Colors.muted}>{t(v.labelKey)}</Txt>
                  </Pressable>
                )
              })}
            </View>
            <Input label={t('driverReg.brand')} placeholder={t('driverReg.brandPh')} value={formData.vehicleBrand} onChangeText={(text) => updateForm('vehicleBrand', text)} />
            <Input label={t('driverReg.color')} placeholder={t('driverReg.colorPh')} value={formData.vehicleColor} onChangeText={(text) => updateForm('vehicleColor', text)} />
            <Input label={t('driverReg.year')} placeholder="2022" type="numeric" value={formData.vehicleYear} onChangeText={(text) => updateForm('vehicleYear', text)} />
            <Input label={t('driverReg.plate')} placeholder="000-000-16" value={formData.vehiclePlate} onChangeText={(text) => updateForm('vehiclePlate', text)} />

            <Checkbox checked={agree1} onToggle={() => { setAgree1(!agree1); setShowAgreeErr(false) }} label={t('driverReg.agreeInfo')} error={showAgreeErr && !agree1} />
            <Checkbox checked={agree2} onToggle={() => { setAgree2(!agree2); setShowAgreeErr(false) }} label={t('driverReg.agreeTerms')} error={showAgreeErr && !agree2} />
            {showAgreeErr && (!agree1 || !agree2) && (
              <Txt size={12} color={Colors.danger}>{t('driverReg.errAgree')}</Txt>
            )}
          </View>
        )}
        <View style={{ height: Spacing.lg }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={styles.track}><View style={[styles.fill, { width: `${(step / 3) * 100}%` }]} /></View>
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
              label={step === 3 ? t('driverReg.submit') : t('driverReg.next')}
              fullWidth={false}
              onPress={onNext}
              style={styles.nextBtn}
            />
          </View>
        </View>
      </View>

      <ExitConfirmDialog visible={exit} onConfirm={() => { setExit(false); router.back() }} onCancel={() => setExit(false)} />
    </View>
  )
}

function Checkbox({ checked, onToggle, label, error }: { checked: boolean; onToggle: () => void; label: string; error?: boolean }) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  return (
    <Pressable style={[styles.checkRow, error && styles.checkRowErr]} onPress={onToggle}>
      <View style={[styles.box, checked && styles.boxOn, error && !checked && styles.boxErr]}>
        {checked && <Icon name="check" size={14} color={Colors.dark1} />}
      </View>
      <Txt size={13} style={{ flex: 1 }}>{label}</Txt>
    </Pressable>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1, paddingHorizontal: Spacing.screenPadding },
    header: { flexDirection: row, alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
    content: { paddingVertical: Spacing.sm },
    docRow: { flexDirection: row, gap: Spacing.md, justifyContent: 'center' },
    infoBanner: { flexDirection: row, alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.goldAlpha15, borderRadius: 10, padding: Spacing.md },
    typeRow: { flexDirection: row, gap: Spacing.sm },
    typeChip: { flex: 1, height: 60, borderRadius: Spacing.radiusMd, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: Colors.dark3, alignItems: 'center', justifyContent: 'center', gap: 4 },
    typeChipOn: { borderColor: Colors.gold, backgroundColor: Colors.goldAlpha10 },
    checkRow: { flexDirection: row, alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.dark3, borderRadius: Spacing.radiusSm, padding: Spacing.md, borderWidth: 1, borderColor: 'transparent' },
    checkRowErr: { borderColor: Colors.danger },
    box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.muted, alignItems: 'center', justifyContent: 'center' },
    boxOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
    boxErr: { borderColor: Colors.danger },
    footer: { paddingTop: Spacing.md },
    track: { height: 3, backgroundColor: Colors.dark3, borderRadius: 2, overflow: 'hidden', marginBottom: Spacing.md },
    fill: { height: 3, backgroundColor: Colors.gold },
    footRow: { flexDirection: row, alignItems: 'center', justifyContent: 'space-between' },
    footBtns: { flexDirection: row, alignItems: 'center', gap: Spacing.sm },
    backBtn: { height: 44, paddingHorizontal: Spacing.lg, backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd, alignItems: 'center', justifyContent: 'center' },
    nextBtn: { paddingHorizontal: Spacing.xxl },
  })
}
