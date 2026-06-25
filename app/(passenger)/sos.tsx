import { useEffect, useMemo, useRef, useState } from 'react'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { SOSButton } from '../../components/ui/SOSButton'
import { WebMap } from '../../components/map/WebMap'
import { useUserStore } from '../../store/userStore'
import * as Location from 'expo-location'

const EMERGENCY_SERVICES = [
  { label: 'الشرطة',      number: '17'   },
  { label: 'الإسعاف',     number: '14'   },
  { label: 'الدرك',       number: '1021' },
] as const

export default function Sos() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const emergencyContacts = useUserStore((s) => s.emergencyContacts)
  const [triggered, setTriggered] = useState(false)
  const [smsSent, setSmsSent] = useState(false)
  const locationRef = useRef<{ lat: number; lng: number } | null>(null)

  // Pre-fetch GPS so it's ready the moment the button is triggered
  useEffect(() => {
    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status !== 'granted') return
        return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      })
      .then((pos) => {
        if (pos) locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      })
      .catch(() => {})
  }, [])

  async function handleSOSTrigger() {
    setTriggered(true)

    // Refresh location at trigger time if possible
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    } catch { /* use pre-fetched or skip */ }

    // Send SMS to first emergency contact with GPS link
    const contact = emergencyContacts[0]
    if (contact) {
      const loc = locationRef.current
      const locText = loc
        ? `\nموقعي: https://maps.google.com/?q=${loc.lat},${loc.lng}`
        : ''
      const msg = `🆘 أحتاج مساعدة عاجلة! تطبيق WinRak${locText}`
      Linking.openURL(`sms:${contact.phone}?body=${encodeURIComponent(msg)}`)
        .then(() => setSmsSent(true))
        .catch(() => {})
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapBg} pointerEvents="none">
        <WebMap showUser />
        <View style={styles.tint} />
      </View>

      <Pressable style={[styles.close, { top: insets.top + Spacing.md }]} onPress={() => router.back()}>
        <Txt size={14} color={Colors.white}>{t('common.close')}</Txt>
      </Pressable>

      <View style={styles.center}>
        {!triggered ? (
          <>
            <SOSButton size={140} onSOSTrigger={handleSOSTrigger} />
            <Txt weight="bold" size={22} center style={{ marginTop: Spacing.xxl }}>{t('sos.title')}</Txt>
            <Txt size={14} color={Colors.muted} center style={{ marginTop: Spacing.sm }}>
              {t('sos.holdHint')}
            </Txt>
          </>
        ) : (
          <View style={{ alignItems: 'center', gap: Spacing.md, width: '100%' }}>
            <Txt weight="bold" size={18} color={Colors.danger} center>{t('sos.triggered')}</Txt>

            {/* Emergency call buttons */}
            <View style={styles.emergencyRow}>
              {EMERGENCY_SERVICES.map(({ label, number }) => (
                <Pressable
                  key={number}
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${number}`)}
                >
                  <Icon name="phone" size={22} color={Colors.pureWhite} />
                  <Txt size={12} weight="bold" color={Colors.pureWhite}>{label}</Txt>
                  <Txt size={20} weight="black" color={Colors.pureWhite}>{number}</Txt>
                </Pressable>
              ))}
            </View>

            {/* Emergency contact status */}
            {emergencyContacts.length > 0 && (
              <View style={styles.contactRow}>
                <Icon name={smsSent ? 'check-circle' : 'clock-outline'} size={16} color={smsSent ? Colors.success : Colors.gold} />
                <Txt size={13} color={smsSent ? Colors.success : Colors.muted}>
                  {smsSent ? `✓ ${t('sos.notified')} ${emergencyContacts[0].name}` : `${t('sos.notified')} ${emergencyContacts[0].name}…`}
                </Txt>
              </View>
            )}

            <Txt size={13} color={Colors.gold}>{t('sos.winrakOps')}</Txt>

            {locationRef.current && (
              <Txt size={12} color={Colors.muted}>
                {t('sos.sharing')}
              </Txt>
            )}

            <Pressable onPress={() => { setTriggered(false); setSmsSent(false) }} style={{ marginTop: Spacing.sm }}>
              <Txt size={13} color={Colors.muted}>{t('sos.cancelAlert')}</Txt>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    mapBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.25 },
    tint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(224,85,85,0.12)' },
    close: { position: 'absolute', right: Spacing.xl, zIndex: 10 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.screenPadding },
    emergencyRow: {
      flexDirection: 'row-reverse',
      gap: Spacing.sm,
      width: '100%',
      marginTop: Spacing.sm,
    },
    callBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: Colors.danger,
      borderRadius: Spacing.radiusMd,
      paddingVertical: Spacing.md,
    },
    contactRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: Colors.dark2,
      borderRadius: Spacing.radiusMd,
      padding: Spacing.md,
      width: '100%',
    },
  })
}
