import { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Button } from '../../components/ui/Button'
import { TopBar } from '../../components/layout/TopBar'
import { adminListPharmacies, adminUpsertPharmacy, genId } from '../../services/admin.service'

export default function PharmacyForm() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const { id } = useLocalSearchParams<{ id?: string }>()
  const isEdit = !!id

  const [name,        setName]        = useState('')
  const [area,        setArea]        = useState('')
  const [distanceKm,  setDistanceKm]  = useState('1.0')
  const [etaMin,      setEtaMin]      = useState('20')
  const [deliveryFee, setDeliveryFee] = useState('150')
  const [open24h,     setOpen24h]     = useState(false)
  const [openNow,     setOpenNow]     = useState(true)
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    if (!id) return
    adminListPharmacies().then((list) => {
      const p = list.find((x) => x.id === id)
      if (!p) return
      setName(p.name)
      setArea(p.area)
      setDistanceKm(String(p.distance_km))
      setEtaMin(String(p.eta_min))
      setDeliveryFee(String(p.delivery_fee))
      setOpen24h(p.open_24h)
      setOpenNow(p.open_now)
    }).catch(console.warn)
  }, [id])

  async function handleSave() {
    if (!name.trim() || !area.trim()) {
      Alert.alert('', t('driverReg.errRequired')); return
    }
    setSaving(true)
    try {
      await adminUpsertPharmacy({
        id:          id ?? genId('ph'),
        name:        name.trim(),
        area:        area.trim(),
        distance_km: parseFloat(distanceKm) || 1.0,
        eta_min:     parseInt(etaMin) || 20,
        delivery_fee: parseInt(deliveryFee) || 150,
        open_24h:    open24h,
        open_now:    openNow,
        status:      'active',
      })
      router.back()
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <TopBar title={isEdit ? t('admin.editPharmacy') : t('admin.addPharmacy')} showBack />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Field label={t('admin.fieldName')} Colors={Colors}>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('admin.fieldName')} placeholderTextColor={Colors.muted} textAlign="right" />
        </Field>

        <Field label={t('admin.fieldArea')} Colors={Colors}>
          <TextInput style={styles.input} value={area} onChangeText={setArea} placeholder={t('admin.fieldArea')} placeholderTextColor={Colors.muted} textAlign="right" />
        </Field>

        <View style={styles.row2}>
          <Field label={t('admin.fieldDistance')} Colors={Colors} style={{ flex: 1 }}>
            <TextInput style={styles.input} value={distanceKm} onChangeText={setDistanceKm} keyboardType="decimal-pad" textAlign="right" />
          </Field>
          <Field label={t('admin.fieldEta')} Colors={Colors} style={{ flex: 1 }}>
            <TextInput style={styles.input} value={etaMin} onChangeText={setEtaMin} keyboardType="numeric" textAlign="right" />
          </Field>
        </View>

        <Field label={t('admin.fieldFee')} Colors={Colors}>
          <TextInput style={styles.input} value={deliveryFee} onChangeText={setDeliveryFee} keyboardType="numeric" textAlign="right" />
        </Field>

        <View style={styles.toggle}>
          <Txt size={14}>{t('admin.fieldOpen')}</Txt>
          <Switch value={openNow} onValueChange={setOpenNow} trackColor={{ true: Colors.gold }} thumbColor={Colors.white} />
        </View>

        <View style={styles.toggle}>
          <Txt size={14}>{t('admin.field24h')}</Txt>
          <Switch value={open24h} onValueChange={setOpen24h} trackColor={{ true: Colors.gold }} thumbColor={Colors.white} />
        </View>

        <Button label={saving ? '…' : t('admin.save')} onPress={handleSave} style={{ marginTop: Spacing.md }} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

function Field({ label, children, Colors, style }: { label: string; children: React.ReactNode; Colors: any; style?: object }) {
  return (
    <View style={[{ marginBottom: Spacing.sm }, style]}>
      <Txt size={12} color={Colors.muted} style={{ marginBottom: 4 }}>{label}</Txt>
      {children}
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding },
    input: {
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd,
      paddingHorizontal: Spacing.md, paddingVertical: 12,
      color: Colors.white, fontSize: 14,
    },
    row2: { flexDirection: 'row-reverse', gap: Spacing.sm },
    toggle: {
      flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm,
    },
  })
}
