import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { DirIcon } from '../../components/ui/DirIcon'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useT } from '../../hooks/useT'
import { useUserStore } from '../../store/userStore'
import { useDriverStore } from '../../store/driverStore'
import { usePaymentStore } from '../../store/paymentStore'
import { verifyOTP, getMyProfile, getDriverStats } from '../../services/auth.service'
import { DEV_AUTH_BYPASS } from '../../constants/config'

export default function Otp() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const t = useT()
  const { phone: paramPhone } = useLocalSearchParams<{ phone: string }>()

  const login          = useUserStore((s) => s.login)
  const setProfile     = useUserStore((s) => s.setProfile)
  const setMode        = useUserStore((s) => s.setMode)
  const setDriverStats = useUserStore((s) => s.setDriverStats)
  const storePhone     = useUserStore((s) => s.phone)
  const approveDriver  = useDriverStore((s) => s.approveRegistration)
  const loadWallet     = usePaymentStore((s) => s.loadWallet)

  const phone = paramPhone || storePhone

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [seconds, setSeconds] = useState(30)

  useEffect(() => {
    if (seconds <= 0) return
    const interval = setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => clearInterval(interval)
  }, [seconds])

  async function verify() {
    if (code.length < 6) return
    setLoading(true)
    try {
      await verifyOTP(phone, code)
      const profile = await getMyProfile()

      if (profile) {
        setProfile(profile)
        login()
        if (profile.role === 'driver') {
          setMode('driver')
          approveDriver()
          // Load real driver stats (rating, trip count) in background
          getDriverStats(profile.id)
            .then((stats) => {
              if (stats) setDriverStats({ rating: stats.rating, totalTrips: stats.total_trips })
            })
            .catch(console.warn)
          router.replace('/(driver)/home')
        } else {
          setMode('passenger')
          loadWallet(profile.id)
          router.replace('/(passenger)/(tabs)/home')
        }
      } else {
        // Nouvel utilisateur authentifié — il doit compléter son profil
        // (nom + photo) sur l'écran profile-setup, qui persiste dans Supabase.
        login()
        setMode('passenger')
        router.replace('/(passenger)/profile-setup')
      }
    } catch (e: any) {
      // En production, un code erroné est rejeté. En dev (DEV_AUTH_BYPASS),
      // on laisse passer pour tester l'app sans SMS configuré.
      if (DEV_AUTH_BYPASS) {
        console.warn('[WinRak] verifyOTP failed — DEV bypass active:', e.message)
        login()
        router.replace('/(passenger)/(tabs)/home')
      } else {
        Alert.alert(t('otp.errorTitle'), t('otp.errorWrong'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <DirIcon name="arrow-left" size={22} color={Colors.white} />
      </Pressable>

      <View style={styles.center}>
        <Icon name="message-text" size={40} color={Colors.gold} />
        <Txt weight="black" size={22} center style={{ marginTop: Spacing.lg }}>{t('otp.title')}</Txt>
        <Txt size={13} color={Colors.muted} center style={{ marginTop: Spacing.sm }}>
          {phone ? phone : t('otp.sentTo')}
        </Txt>

        <View style={{ marginVertical: Spacing.xxxl, width: '100%' }}>
          <Input type="otp" value={code} onChangeText={setCode} />
        </View>

        <Txt size={13} color={Colors.muted}>{t('otp.noCode')}</Txt>
        {seconds > 0 ? (
          <Txt size={13} color={Colors.muted} style={{ marginTop: 4 }}>{t('otp.resendIn', { sec: seconds })}</Txt>
        ) : (
          <Pressable onPress={() => setSeconds(30)}>
            <Txt size={13} color={Colors.gold} style={{ marginTop: 4 }}>{t('otp.resend')}</Txt>
          </Pressable>
        )}

        {loading && <ActivityIndicator color={Colors.gold} style={{ marginTop: Spacing.lg }} />}
      </View>

      <View style={{ paddingBottom: insets.bottom + Spacing.lg }}>
        <Button
          label={t('otp.verify')}
          onPress={verify}
          disabled={code.length < 6 || loading}
        />
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1, paddingHorizontal: Spacing.screenPadding },
    back: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark2, alignItems: 'center', justifyContent: 'center' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  })
}
