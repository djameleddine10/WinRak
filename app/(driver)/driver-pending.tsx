import { useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useUserStore } from '../../store/userStore'
import { useDriverStore } from '../../store/driverStore'
import { useT } from '../../hooks/useT'
import { useIsRTL } from '../../i18n/locale'
import { supabase } from '../../lib/supabase'
import { uploadDocument, getMyDocuments } from '../../services/documents.service'
import { type DocType } from '../../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
interface DocRow {
  id:            string
  type:          DocType
  status:        'pending' | 'approved' | 'rejected'
  reject_reason: string | null
}

const DOC_LABEL: Record<DocType, string> = {
  selfie:        'صورة شخصية',
  permis:        'رخصة القيادة',
  carte_grise:   'البطاقة الرمادية',
  vehicle_front: 'واجهة السيارة',
  vehicle_rear:  'خلفية السيارة',
  piece_identite:'بطاقة هوية المالك',
}

const STATUS_ICON: Record<string, string> = {
  approved: 'check-circle',
  pending:  'clock-outline',
  rejected: 'alert-circle-outline',
}

export default function DriverPending() {
  const Colors  = useColors()
  const isRTL   = useIsRTL()
  const styles  = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets  = useSafeAreaInsets()
  const t       = useT()

  const profile            = useUserStore((s) => s.profile)
  const setMode            = useUserStore((s) => s.setMode)
  const registrationStatus = useDriverStore((s) => s.registrationStatus)

  const [docs,     setDocs]     = useState<DocRow[]>([])
  const [reuploading, setReuploading] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // ─── Chargement initial ───────────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.id) return
    loadDocs()
    subscribeRealtime()
    subscribeDriverStatus()
    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [profile?.id])

  // ─── Si déjà approuvé en DB → naviguer automatiquement ───────────────────
  useEffect(() => {
    if (registrationStatus === 'approved') {
      setMode('driver')
      router.replace('/(driver)/home')
    }
  }, [registrationStatus])

  async function loadDocs() {
    if (!profile?.id) return
    try {
      const rows = await getMyDocuments(profile.id)
      setDocs(
        rows.map((r: any) => ({
          id:            r.id,
          type:          r.type as DocType,
          status:        r.status,
          reject_reason: r.reject_reason ?? null,
        }))
      )
    } catch {}
  }

  function subscribeRealtime() {
    if (!profile?.id) return
    const channel = supabase
      .channel(`driver-docs-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'driver_documents',
          filter: `driver_id=eq.${profile.id}`,
        },
        () => { loadDocs() }
      )
      .subscribe()
    channelRef.current = channel
  }

  function subscribeDriverStatus() {
    if (!profile?.id) return
    supabase
      .channel(`driver-status-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'drivers',
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          const reg = payload.new?.registration_status
          if (reg === 'approved') {
            useDriverStore.setState({ registrationStatus: 'approved' })
          }
        }
      )
      .subscribe()
  }

  // ─── Re-upload d'un doc rejeté ────────────────────────────────────────────
  async function reupload(doc: DocRow) {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!granted) return
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 })
    if (result.canceled || !profile?.id) return

    setReuploading(doc.id)
    try {
      await uploadDocument({ driverId: profile.id, type: doc.type, uri: result.assets[0].uri })
      loadDocs()
    } catch {} finally {
      setReuploading(null)
    }
  }

  function toPassenger() {
    setMode('passenger')
    router.replace('/(passenger)/(tabs)/home')
  }

  // ─── حالة مجمّعة ─────────────────────────────────────────────────────────
  const hasRejected = docs.some((d) => d.status === 'rejected')
  const allApproved = docs.length >= 4 && docs.every((d) => d.status === 'approved')

  function statusColor(s: string) {
    return { approved: Colors.success, pending: Colors.gold, rejected: Colors.danger }[s] ?? Colors.muted
  }

  function statusLabel(s: string) {
    return { approved: t('doc.statusApproved'), pending: t('doc.statusPending'), rejected: t('doc.statusRejected') }[s] ?? s
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xxxl }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Icon
          name={allApproved ? 'check-circle' : hasRejected ? 'alert-circle-outline' : 'clock-outline'}
          size={80}
          color={allApproved ? Colors.success : hasRejected ? Colors.danger : Colors.gold}
        />

        <Txt weight="black" size={22} center style={{ marginTop: Spacing.lg }}>
          {allApproved
            ? t('driver.approvedTitle')
            : hasRejected
            ? t('driver.rejectedTitle')
            : t('driver.pendingTitle')}
        </Txt>
        <Txt size={14} color={Colors.muted} center style={{ marginTop: Spacing.sm }}>
          {allApproved
            ? t('driver.approvedSub')
            : hasRejected
            ? t('driver.rejectedSub')
            : t('driver.pendingSub')}
        </Txt>
        {!allApproved && !hasRejected && (
          <Txt size={13} color={Colors.muted} center>{t('driver.pendingNotify')}</Txt>
        )}

        {/* ── حالة كل وثيقة ──────────────────────────────────────── */}
        {docs.length > 0 && (
          <Card radius={14} style={styles.statusCard}>
            <Txt weight="bold" size={14}>{t('driver.requestStatus')}</Txt>
            {docs.map((doc) => (
              <View key={doc.id} style={styles.docRow}>
                <Icon name={STATUS_ICON[doc.status] ?? 'minus-circle-outline'} size={20} color={statusColor(doc.status)} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt size={13}>{DOC_LABEL[doc.type] ?? doc.type}</Txt>
                  {doc.status === 'rejected' && doc.reject_reason && (
                    <Txt size={11} color={Colors.danger}>{doc.reject_reason}</Txt>
                  )}
                </View>
                <Txt size={12} color={statusColor(doc.status)}>{statusLabel(doc.status)}</Txt>
                {doc.status === 'rejected' && (
                  <Button
                    label={reuploading === doc.id ? '...' : t('doc.reupload')}
                    size="sm"
                    fullWidth={false}
                    disabled={reuploading === doc.id}
                    onPress={() => reupload(doc)}
                  />
                )}
              </View>
            ))}
          </Card>
        )}

        {/* لا وثائق بعد — عرض حالة الانتظار */}
        {docs.length === 0 && (
          <Card radius={14} style={styles.statusCard}>
            <Txt weight="bold" size={14}>{t('driver.requestStatus')}</Txt>
            <StatusRow icon="check-circle" color={Colors.success} label={t('driver.personalInfo')} value={t('driver.complete')} Colors={Colors} isRTL={isRTL} />
            <StatusRow icon="clock-outline" color={Colors.gold}    label={t('driver.vehicleDocs')}  value={t('driver.inProgress')} Colors={Colors} isRTL={isRTL} />
            <StatusRow icon="clock-outline" color={Colors.gold}    label={t('driver.adminReview')}  value={t('driver.inProgress')} Colors={Colors} isRTL={isRTL} />
          </Card>
        )}
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + Spacing.lg, gap: Spacing.sm }}>
        {allApproved && (
          <Button
            label={t('driver.startDriving')}
            onPress={() => {
              setMode('driver')
              router.replace('/(driver)/home')
            }}
          />
        )}
        <Button label={t('driver.backToPassenger')} variant="ghost" onPress={toPassenger} />
        {!allApproved && (
          <Txt size={13} color={Colors.muted} center>{t('driver.updateDocs')}</Txt>
        )}
      </View>
    </View>
  )
}

function StatusRow({
  icon, color, label, value, Colors, isRTL,
}: {
  icon: string; color: string; label: string; value: string
  Colors: Palette; isRTL: boolean
}) {
  const row = isRTL ? 'row-reverse' : 'row'
  return (
    <View style={{ flexDirection: row, alignItems: 'center', gap: Spacing.md }}>
      <Icon name={icon} size={20} color={color} />
      <Txt size={14} style={{ flex: 1 }}>{label}</Txt>
      <Txt size={13} color={color}>{value}</Txt>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container:  { flex: 1, backgroundColor: Colors.dark1, paddingHorizontal: Spacing.screenPadding },
    content:    { alignItems: 'center', paddingBottom: Spacing.xl },
    statusCard: { width: '100%', marginTop: Spacing.xxl, gap: Spacing.md },
    docRow:     { flexDirection: row, alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  })
}
