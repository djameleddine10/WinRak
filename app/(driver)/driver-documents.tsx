import { useEffect, useMemo, useState } from 'react'
import { Image, ScrollView, StyleSheet, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Button } from '../../components/ui/Button'
import { TopBar } from '../../components/layout/TopBar'
import { ActionSheet } from '../../components/ui/ActionSheet'
import { useT } from '../../hooks/useT'
import { useIsRTL } from '../../i18n/locale'
import { type TranslationKey } from '../../i18n/translations'
import { useUserStore } from '../../store/userStore'
import { useDriverStore } from '../../store/driverStore'
import { uploadDocument, getMyDocuments } from '../../services/documents.service'
import { type DocType } from '../../lib/supabase'

type DocStatus = 'approved' | 'pending' | 'rejected' | 'missing'

interface DocItem {
  key:      string
  labelKey: TranslationKey
  icon:     string
  dbType:   DocType
  status:   DocStatus
  uri?:     string
  rejectReason?: string | null
}

// وثائق VTC (سيارة): selfie, permis, carte_grise, vehicle_front, vehicle_rear
const VTC_DOCS: Omit<DocItem, 'status'>[] = [
  { key: 'selfie',        labelKey: 'doc.selfie',       icon: 'account-circle-outline',        dbType: 'selfie' },
  { key: 'permis',        labelKey: 'doc.license',      icon: 'card-account-details-outline',  dbType: 'permis' },
  { key: 'carte_grise',   labelKey: 'doc.carteGrise',   icon: 'file-document-outline',          dbType: 'carte_grise' },
  { key: 'vehicle_front', labelKey: 'doc.vehicleFront', icon: 'car-outline',                   dbType: 'vehicle_front' },
  { key: 'vehicle_rear',  labelKey: 'doc.vehicleRear',  icon: 'car-back',                      dbType: 'vehicle_rear' },
]

// وثائق Moto (دليفري): نفس VTC + piece_identite
const MOTO_DOCS: Omit<DocItem, 'status'>[] = [
  ...VTC_DOCS,
  { key: 'piece_identite', labelKey: 'doc.pieceIdentite', icon: 'card-bulleted-outline', dbType: 'piece_identite' },
]

const STATUS_ICON: Record<DocStatus, string> = {
  approved: 'check-circle',
  pending:  'clock-outline',
  rejected: 'alert-circle-outline',
  missing:  'minus-circle-outline',
}

export default function DriverDocuments() {
  const Colors  = useColors()
  const isRTL   = useIsRTL()
  const styles  = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const t       = useT()
  const profile = useUserStore((s) => s.profile)
  const isMoto  = useDriverStore((s) => s.vehicleMode === 'moto')

  const docList = isMoto ? MOTO_DOCS : VTC_DOCS

  const [docs, setDocs] = useState<DocItem[]>(
    docList.map((d) => ({ ...d, status: 'missing' }))
  )
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  // ─── Chargement depuis Supabase ──────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.id) return
    getMyDocuments(profile.id)
      .then((dbDocs) => {
        setDocs((prev) =>
          prev.map((d) => {
            const match = dbDocs.find((db: any) => db.type === d.dbType)
            if (!match) return d
            return {
              ...d,
              status:       match.status as DocStatus,
              uri:          match.file_url ?? undefined,
              rejectReason: match.reject_reason ?? null,
            }
          })
        )
      })
      .catch(() => {})
  }, [profile?.id])

  // ─── Upload ───────────────────────────────────────────────────────────────────
  async function saveDocument(key: string, dbType: DocType, uri: string) {
    setDocs((prev) =>
      prev.map((d) => (d.key === key ? { ...d, status: 'pending', uri } : d))
    )
    if (!profile?.id) return
    setUploading(key)
    try {
      await uploadDocument({ driverId: profile.id, type: dbType, uri })
    } catch {
      // إعادة للحالة السابقة عند الخطأ
      setDocs((prev) =>
        prev.map((d) => (d.key === key ? { ...d, status: 'missing', uri: undefined } : d))
      )
    } finally {
      setUploading(null)
    }
  }

  async function openCamera(key: string, dbType: DocType) {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync()
    if (!granted) return
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 })
    if (!result.canceled) saveDocument(key, dbType, result.assets[0].uri)
  }

  async function openGallery(key: string, dbType: DocType) {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!granted) return
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 })
    if (!result.canceled) saveDocument(key, dbType, result.assets[0].uri)
  }

  function statusColor(s: DocStatus): string {
    return {
      approved: Colors.success,
      pending:  Colors.gold,
      rejected: Colors.danger,
      missing:  Colors.muted,
    }[s]
  }

  function statusLabel(s: DocStatus): string {
    return {
      approved: t('doc.statusApproved'),
      pending:  t('doc.statusPending'),
      rejected: t('doc.statusRejected'),
      missing:  t('doc.statusMissing'),
    }[s]
  }

  const activeDoc = docs.find((d) => d.key === activeKey)

  return (
    <View style={styles.container}>
      <TopBar title={t('doc.title')} showBack />

      <Txt size={13} color={Colors.muted} style={styles.subtitle}>
        {t('doc.subtitle')}
      </Txt>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {docs.map((doc) => (
          <View key={doc.key} style={styles.card}>
            {doc.uri ? (
              <Image source={{ uri: doc.uri }} style={styles.thumb} />
            ) : (
              <View style={styles.iconWrap}>
                <Icon name={doc.icon} size={24} color={Colors.gold} />
              </View>
            )}

            <View style={styles.info}>
              <Txt weight="semibold" size={14}>{t(doc.labelKey)}</Txt>
              <View style={styles.statusRow}>
                <Icon name={STATUS_ICON[doc.status]} size={13} color={statusColor(doc.status)} />
                <Txt size={12} color={statusColor(doc.status)}>{statusLabel(doc.status)}</Txt>
              </View>
              {doc.status === 'rejected' && doc.rejectReason && (
                <Txt size={11} color={Colors.danger} style={{ marginTop: 2 }}>
                  {doc.rejectReason}
                </Txt>
              )}
            </View>

            <Button
              label={uploading === doc.key ? '...' : doc.status === 'rejected' ? t('doc.reupload') : t('doc.update')}
              size="sm"
              fullWidth={false}
              variant={doc.status === 'rejected' || doc.status === 'missing' ? 'primary' : 'outline'}
              disabled={uploading === doc.key || doc.status === 'approved'}
              onPress={() => setActiveKey(doc.key)}
              style={styles.btn}
            />
          </View>
        ))}
      </ScrollView>

      <ActionSheet
        visible={activeKey !== null}
        title={t('doc.chooseSource')}
        onClose={() => setActiveKey(null)}
        actions={[
          {
            label:   t('doc.camera'),
            icon:    'camera-outline',
            onPress: () => {
              const k = activeKey
              const dbT = activeDoc?.dbType
              setActiveKey(null)
              if (k && dbT) openCamera(k, dbT)
            },
          },
          {
            label:   t('doc.gallery'),
            icon:    'image-multiple-outline',
            onPress: () => {
              const k = activeKey
              const dbT = activeDoc?.dbType
              setActiveKey(null)
              if (k && dbT) openGallery(k, dbT)
            },
          },
          {
            label:   t('common.cancel'),
            variant: 'cancel',
            onPress: () => setActiveKey(null),
          },
        ]}
      />
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    subtitle: {
      paddingHorizontal: Spacing.screenPadding,
      paddingVertical:   Spacing.md,
      textAlign:         isRTL ? 'right' : 'left',
    },
    list: {
      paddingHorizontal: Spacing.screenPadding,
      paddingBottom:     Spacing.xxxl,
      gap:               Spacing.md,
      paddingTop:        Spacing.md,
    },
    card: {
      flexDirection:   isRTL ? 'row-reverse' : 'row',
      alignItems:      'center',
      backgroundColor: Colors.dark3,
      borderRadius:    14,
      padding:         Spacing.md,
      gap:             Spacing.md,
    },
    iconWrap: {
      width:           48,
      height:          48,
      borderRadius:    12,
      backgroundColor: Colors.goldAlpha10,
      alignItems:      'center',
      justifyContent:  'center',
    },
    thumb: { width: 48, height: 48, borderRadius: 12 },
    info: {
      flex:       1,
      gap:        4,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    statusRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems:    'center',
      gap:           4,
    },
    btn: { minWidth: 90 },
  })
}
