import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { TopBar } from '../../components/layout/TopBar'
import { ActionSheet } from '../../components/ui/ActionSheet'
import { useT } from '../../hooks/useT'
import { useIsRTL } from '../../i18n/locale'
import { useUserStore } from '../../store/userStore'

const MAX_CONTACTS = 3

export default function EmergencyContacts() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const t = useT()

  const contacts = useUserStore((s) => s.emergencyContacts)
  const addEmergencyContact = useUserStore((s) => s.addEmergencyContact)
  const removeEmergencyContact = useUserStore((s) => s.removeEmergencyContact)

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  function save() {
    if (!name.trim() || !phone.trim()) return
    addEmergencyContact({ name: name.trim(), phone: phone.trim() })
    setName('')
    setPhone('')
    setAdding(false)
  }

  function cancelAdd() {
    setName('')
    setPhone('')
    setAdding(false)
  }

  const atMax = contacts.length >= MAX_CONTACTS

  return (
    <View style={styles.container}>
      <TopBar title={t('security.emergencyContacts')} showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Icon name="shield-alert-outline" size={22} color={Colors.danger} />
          <Txt size={13} color={Colors.muted} style={styles.infoText}>
            {t('security.ec.sub')}
          </Txt>
        </View>

        {/* Empty state */}
        {contacts.length === 0 && (
          <View style={styles.empty}>
            <Icon name="account-group-outline" size={48} color={Colors.dark4} />
            <Txt size={14} color={Colors.muted} center style={{ marginTop: Spacing.md }}>
              {t('security.ec.empty')}
            </Txt>
          </View>
        )}

        {/* Contact cards */}
        {contacts.map((c, i) => (
          <View key={i} style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Icon name="account" size={22} color={Colors.gold} />
            </View>
            <View style={styles.contactInfo}>
              <Txt weight="semibold" size={14}>{c.name}</Txt>
              <Txt size={12} color={Colors.muted}>{c.phone}</Txt>
            </View>
            <Pressable
              style={styles.deleteBtn}
              onPress={() => setDeleteIndex(i)}
              hitSlop={8}
            >
              <Icon name="trash-can-outline" size={20} color={Colors.danger} />
            </Pressable>
          </View>
        ))}

        {/* Max reached hint */}
        {atMax && (
          <Txt size={12} color={Colors.muted} center>
            {t('security.ec.max')}
          </Txt>
        )}

        {/* Add form */}
        {adding && (
          <View style={styles.addForm}>
            <Input
              label={t('security.ec.name')}
              placeholder={t('security.ec.name')}
              value={name}
              onChangeText={setName}
              leftIcon="account-outline"
            />
            <Input
              label={t('security.ec.phone')}
              placeholder="+213 6XX XXX XXX"
              value={phone}
              onChangeText={setPhone}
              type="phone"
            />
            <View style={styles.formActions}>
              <Button
                label={t('security.ec.save')}
                onPress={save}
                disabled={!name.trim() || !phone.trim()}
                fullWidth={false}
                style={styles.saveBtn}
              />
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={cancelAdd}
                fullWidth={false}
                style={styles.saveBtn}
              />
            </View>
          </View>
        )}

        {/* Add button */}
        {!adding && !atMax && (
          <Pressable style={styles.addBtn} onPress={() => setAdding(true)}>
            <Icon name="plus-circle-outline" size={22} color={Colors.gold} />
            <Txt size={14} color={Colors.gold} weight="semibold">
              {t('security.ec.add')}
            </Txt>
          </Pressable>
        )}
      </ScrollView>

      {/* Delete confirmation */}
      <ActionSheet
        visible={deleteIndex !== null}
        title={contacts[deleteIndex ?? 0]?.name}
        onClose={() => setDeleteIndex(null)}
        actions={[
          {
            label: t('security.ec.delete'),
            icon: 'trash-can-outline',
            variant: 'danger',
            onPress: () => {
              if (deleteIndex !== null) removeEmergencyContact(deleteIndex)
              setDeleteIndex(null)
            },
          },
          {
            label: t('common.cancel'),
            variant: 'cancel',
            onPress: () => setDeleteIndex(null),
          },
        ]}
      />
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: {
      padding: Spacing.screenPadding,
      gap: Spacing.md,
      paddingBottom: Spacing.xxxl,
    },
    infoBanner: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: Colors.dangerAlpha10,
      borderRadius: 12,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: Colors.dangerAlpha30,
    },
    infoText: {
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    empty: {
      alignItems: 'center',
      paddingVertical: Spacing.xxxl,
    },
    contactCard: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: Colors.dark3,
      borderRadius: 14,
      padding: Spacing.md,
    },
    contactIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: Colors.goldAlpha10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contactInfo: {
      flex: 1,
      gap: 2,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    deleteBtn: {
      padding: 6,
    },
    addForm: {
      gap: Spacing.md,
      backgroundColor: Colors.dark3,
      borderRadius: 14,
      padding: Spacing.md,
    },
    formActions: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: Spacing.sm,
    },
    saveBtn: {
      flex: 1,
    },
    addBtn: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      borderWidth: 1.5,
      borderColor: Colors.goldAlpha10,
      borderStyle: 'dashed',
      borderRadius: 14,
      paddingVertical: Spacing.md,
    },
  })
}
