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
import { uploadDocument, getMyDocuments } from '../../services/documents.service'
import { type DocType } from '../../lib/supabase'

type DocStatus = 'approved' | 'pending' | 'expired' | 'missing'

interface DocItem {
  key: string
  labelKey: TranslationKey
  icon: string
  status: DocStatus
  uri?: string
}

const INITIAL_DOCS: DocItem[] = [
  { key: 'license',      labelKey: 'doc.license',      icon: 'card-account-details-outline', status: 'missing' },
  { key: 'nationalId',   labelKey: 'doc.nationalId',   icon: 'card-bulleted-outline',         status: 'missing' },
  { key: 'carteGrise',   labelKey: 'doc.carteGrise',   icon: 'file-document-outline',         status: 'missing' },
  { key: 'insurance',    labelKey: 'doc.insurance',    icon: 'shield-check-outline',          status: 'missing' },
  { key: 'technical',    labelKey: 'doc.technical',    icon: 'clipboard-check-outline',       status: 'missing' },
  { key: 'vehiclePhoto', labelKey: 'doc.vehiclePhoto', icon: 'camera-outline',                status: 'missing' },
]

const DOC_TYPE: Record<string, DocType> = {
  license:      'permis',
  nationalId:   'national_id',
  carteGrise:   'carte_grise',
  insurance:    'insurance',
  technical:    'technical_visit',
  vehiclePhoto: 'vehicle_front',
}

const STATUS_ICON: Record<DocStatus, string> = {
  approved: 'check-circle',
  pending:  'clock-outline',
  expired:  'alert-circle-outline',
  missing:  'minus-circle-outline',
}

export default function DriverDocuments() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const t = useT()
  const profile = useUserStore((s) => s.profile)
  const [docs, setDocs] = useState<DocItem[]>(INITIAL_DOCS)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  // Load existing documents from Supabase on mount
  useEffect(() => {
    if (!profile?.id) return
    getMyDocuments(profile.id).then((dbDocs) => {
      setDocs((prev) => prev.map((d) => {
        const match = dbDocs.find((db: any) => db.type === DOC_TYPE[d.key])
        if (!match) return d
        return {
          ...d,
          status: match.status === 'rejected' ? 'expired' : match.status as DocStatus,
          uri:    match.file_url ?? undefined,
        }
      }))
    }).catch(console.warn)
  }, [profile?.id])

  async function saveDocument(key: string, uri: string) {
    setDocs((prev) => prev.map((d) => (d.key === key ? { ...d, status: 'pending', uri } : d)))
    if (!profile?.id) return
    uploadDocument({
      driverId: profile.id,
      type:     DOC_TYPE[key],
      uri,
    }).catch(console.warn)
  }

  async function openCamera(key: string) {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync()
    if (!granted) return
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 })
    if (!result.canceled) saveDocument(key, result.assets[0].uri)
  }

  async function openGallery(key: string) {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!granted) return
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 })
    if (!result.canceled) saveDocument(key, result.assets[0].uri)
  }

  function statusColor(s: DocStatus): string {
    return { approved: Colors.success, pending: Colors.gold, expired: Colors.danger, missing: Colors.muted }[s]
  }

  function statusLabel(s: DocStatus): string {
    return {
      approved: t('doc.statusApproved'),
      pending:  t('doc.statusPending'),
      expired:  t('doc.statusExpired'),
      missing:  t('doc.statusMissing'),
    }[s]
  }

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
            </View>

            <Button
              label={t('doc.update')}
              size="sm"
              fullWidth={false}
              variant={doc.status === 'expired' || doc.status === 'missing' ? 'primary' : 'outline'}
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
            label: t('doc.camera'),
            icon: 'camera-outline',
            onPress: () => {
              const k = activeKey
              setActiveKey(null)
              if (k) openCamera(k)
            },
          },
          {
            label: t('doc.gallery'),
            icon: 'image-multiple-outline',
            onPress: () => {
              const k = activeKey
              setActiveKey(null)
              if (k) openGallery(k)
            },
          },
          {
            label: t('common.cancel'),
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
      paddingVertical: Spacing.md,
      textAlign: isRTL ? 'right' : 'left',
    },
    list: {
      paddingHorizontal: Spacing.screenPadding,
      paddingBottom: Spacing.xxxl,
      gap: Spacing.md,
      paddingTop: Spacing.md,
    },
    card: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: Colors.dark3,
      borderRadius: 14,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: Colors.goldAlpha10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumb: {
      width: 48,
      height: 48,
      borderRadius: 12,
    },
    info: {
      flex: 1,
      gap: 4,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    statusRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
    },
    btn: { minWidth: 90 },
  })
}
