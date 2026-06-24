import { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Switch, TextInput, View, Pressable } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Button } from '../../components/ui/Button'
import { TopBar } from '../../components/layout/TopBar'
import { cuisines, cuisineMeta } from '../../mock/restaurants'
import {
  adminListRestaurants, adminUpsertRestaurant, adminListMenuItems,
  adminUpsertMenuItem, adminDeleteMenuItem, genId,
  type AdminRestaurant, type AdminMenuItem,
} from '../../services/admin.service'

export default function RestaurantForm() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const { id } = useLocalSearchParams<{ id?: string }>()
  const isEdit = !!id

  const [name,        setName]        = useState('')
  const [cuisine,     setCuisine]     = useState('fastfood')
  const [area,        setArea]        = useState('')
  const [phone,       setPhone]       = useState('')
  const [reception,   setReception]   = useState('')
  const [etaMin,      setEtaMin]      = useState('30')
  const [deliveryFee, setDeliveryFee] = useState('150')
  const [isOpen,      setIsOpen]      = useState(true)
  const [saving,      setSaving]      = useState(false)

  const [menuItems,   setMenuItems]   = useState<AdminMenuItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice,setNewItemPrice]= useState('')

  useEffect(() => {
    if (!id) return
    adminListRestaurants().then((list) => {
      const r = list.find((x) => x.id === id)
      if (!r) return
      setName(r.name)
      setCuisine(r.cuisine)
      setArea(r.area)
      setPhone(r.phone ?? '')
      setReception(r.reception ?? '')
      setEtaMin(String(r.eta_min))
      setDeliveryFee(String(r.delivery_fee))
      setIsOpen(r.is_open)
    }).catch(console.warn)
    adminListMenuItems(id).then(setMenuItems).catch(console.warn)
  }, [id])

  async function handleSave() {
    if (!name.trim() || !area.trim()) {
      Alert.alert('', t('driverReg.errRequired')); return
    }
    setSaving(true)
    const meta = cuisineMeta(cuisine as any)
    const record: Omit<AdminRestaurant, 'rating'> = {
      id:               id ?? genId('r'),
      name:             name.trim(),
      cuisine,
      cuisine_label_key: meta.labelKey,
      area:             area.trim(),
      phone:            phone.trim(),
      reception:        reception.trim(),
      eta_min:          parseInt(etaMin) || 30,
      delivery_fee:     parseInt(deliveryFee) || 150,
      is_open:          isOpen,
      icon:             meta.icon,
      status:           'active',
    }
    try {
      await adminUpsertRestaurant(record)
      router.back()
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddItem() {
    if (!newItemName.trim() || !newItemPrice.trim()) return
    if (!id) { Alert.alert('', 'احفظ المطعم أولاً قبل إضافة الأصناف'); return }
    const item: AdminMenuItem = {
      id:            genId('mi'),
      restaurant_id: id,
      name:          newItemName.trim(),
      price:         parseInt(newItemPrice) || 0,
      is_available:  true,
    }
    try {
      await adminUpsertMenuItem(item)
      setMenuItems((prev) => [...prev, item])
      setNewItemName(''); setNewItemPrice('')
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  function handleDeleteItem(itemId: string) {
    adminDeleteMenuItem(itemId)
      .then(() => setMenuItems((prev) => prev.filter((x) => x.id !== itemId)))
      .catch((e) => Alert.alert('Error', e.message))
  }

  return (
    <View style={styles.container}>
      <TopBar title={isEdit ? t('admin.editRestaurant') : t('admin.addRestaurant')} showBack />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Field label={t('admin.fieldName')}>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('admin.fieldName')} placeholderTextColor={Colors.muted} textAlign="right" />
        </Field>

        <Field label={t('admin.fieldArea')}>
          <TextInput style={styles.input} value={area} onChangeText={setArea} placeholder={t('admin.fieldArea')} placeholderTextColor={Colors.muted} textAlign="right" />
        </Field>

        <Field label={t('admin.fieldCuisine')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {cuisines.map((c) => (
              <Pressable key={c.key} style={[styles.chip, cuisine === c.key && styles.chipActive]} onPress={() => setCuisine(c.key)}>
                <Icon name={c.icon} size={16} color={cuisine === c.key ? Colors.dark1 : Colors.muted} />
                <Txt size={12} color={cuisine === c.key ? Colors.dark1 : Colors.muted}>{t(c.labelKey)}</Txt>
              </Pressable>
            ))}
          </ScrollView>
        </Field>

        <Field label={t('admin.fieldPhone')}>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+213 5XX XX XX XX" placeholderTextColor={Colors.muted} keyboardType="phone-pad" textAlign="right" />
        </Field>

        <Field label={t('admin.fieldReception')}>
          <TextInput style={styles.input} value={reception} onChangeText={setReception} placeholder={t('admin.fieldReception')} placeholderTextColor={Colors.muted} textAlign="right" />
        </Field>

        <View style={styles.row2}>
          <Field label={t('admin.fieldEta')} style={{ flex: 1 }}>
            <TextInput style={styles.input} value={etaMin} onChangeText={setEtaMin} keyboardType="numeric" textAlign="right" />
          </Field>
          <Field label={t('admin.fieldFee')} style={{ flex: 1 }}>
            <TextInput style={styles.input} value={deliveryFee} onChangeText={setDeliveryFee} keyboardType="numeric" textAlign="right" />
          </Field>
        </View>

        <View style={styles.toggle}>
          <Txt size={14}>{t('admin.fieldOpen')}</Txt>
          <Switch value={isOpen} onValueChange={setIsOpen} trackColor={{ true: Colors.gold }} thumbColor={Colors.white} />
        </View>

        <Button label={saving ? '…' : t('admin.save')} onPress={handleSave} style={{ marginTop: Spacing.md }} />

        {/* Menu items — only shown when editing */}
        {isEdit && (
          <>
            <Txt weight="bold" size={15} style={{ marginTop: Spacing.xl, marginBottom: Spacing.sm }}>{t('admin.menuItems')}</Txt>

            {menuItems.map((m) => (
              <View key={m.id} style={styles.menuRow}>
                <Txt size={13} style={{ flex: 1 }}>{m.name}</Txt>
                <Txt size={13} color={Colors.gold} weight="bold">{m.price} {t('common.currency')}</Txt>
                <Pressable onPress={() => handleDeleteItem(m.id)} hitSlop={8}>
                  <Icon name="trash-can-outline" size={18} color={Colors.danger} />
                </Pressable>
              </View>
            ))}

            <View style={styles.addItem}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder={t('admin.itemName')}
                placeholderTextColor={Colors.muted}
                textAlign="right"
              />
              <TextInput
                style={[styles.input, { width: 90 }]}
                value={newItemPrice}
                onChangeText={setNewItemPrice}
                placeholder={t('admin.itemPrice')}
                placeholderTextColor={Colors.muted}
                keyboardType="numeric"
                textAlign="right"
              />
              <Pressable style={styles.addBtn} onPress={handleAddItem}>
                <Icon name="plus" size={20} color={Colors.dark1} />
              </Pressable>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  const Colors = useColors()
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
    chips: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: 4 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: Colors.dark3, borderRadius: Spacing.radiusFull,
      paddingHorizontal: Spacing.md, paddingVertical: 6,
    },
    chipActive: { backgroundColor: Colors.gold },
    row2: { flexDirection: 'row-reverse', gap: Spacing.sm },
    toggle: {
      flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm,
    },
    menuRow: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd,
      padding: Spacing.md, marginBottom: Spacing.sm,
    },
    addItem: { flexDirection: 'row-reverse', gap: Spacing.sm, marginTop: Spacing.sm },
    addBtn: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gold,
      alignItems: 'center', justifyContent: 'center',
    },
  })
}
