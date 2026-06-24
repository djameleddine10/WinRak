import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Svg, { Rect } from 'react-native-svg'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Divider } from '../../components/ui/Divider'
import { useT } from '../../hooks/useT'
import { useUserStore } from '../../store/userStore'
import { usePaymentStore } from '../../store/paymentStore'
import { sendOTP, useGoogleAuth, signInWithGoogle, getMyProfile } from '../../services/auth.service'
import { DEV_AUTH_BYPASS } from '../../constants/config'

const Skyline = (Colors: Palette) => (
  <Svg width="100%" height="100%" viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice">
    {[
      [10, 120, 40, 80], [55, 90, 36, 110], [96, 140, 30, 60], [131, 70, 44, 130],
      [180, 110, 34, 90], [219, 50, 40, 150], [264, 130, 30, 70], [299, 95, 50, 105],
    ].map(([x, y, w, h], i) => (
      <Rect key={i} x={x} y={y} width={w} height={h} rx={3} fill={Colors.dark4} />
    ))}
  </Svg>
)

export default function Login() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useT()
  const setStorePhone = useUserStore((s) => s.setPhone)
  const login      = useUserStore((s) => s.login)
  const setProfile = useUserStore((s) => s.setProfile)
  const setMode    = useUserStore((s) => s.setMode)
  const loadWallet = usePaymentStore((s) => s.loadWallet)

  const { request, response, promptAsync } = useGoogleAuth()

  // Handle the Google OAuth result: exchange the id_token for a Supabase
  // session, then route by profile/role — mirrors the OTP flow (new users
  // land on profile-setup, existing users go to their role's home).
  useEffect(() => {
    if (response?.type !== 'success') return
    const idToken = response.params?.id_token
    if (!idToken) return
    ;(async () => {
      setLoading(true)
      try {
        await signInWithGoogle(idToken)
        const profile = await getMyProfile()
        login()
        if (profile) {
          setProfile(profile)
          if (profile.role === 'driver') {
            setMode('driver')
            router.replace('/(driver)/home')
          } else {
            setMode('passenger')
            loadWallet(profile.id)
            router.replace('/(passenger)/(tabs)/home')
          }
        } else {
          setMode('passenger')
          router.replace('/(passenger)/profile-setup')
        }
      } catch (e: any) {
        Alert.alert(t('otp.errorTitle'), e.message)
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response])

  function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('213')) return '+' + digits
    if (digits.startsWith('0'))   return '+213' + digits.slice(1)
    return '+213' + digits
  }

  async function handleContinue() {
    const formatted = formatPhone(phone.trim())
    if (formatted.length < 12) {
      Alert.alert('Numéro invalide', 'Ex: 0555 123 456')
      return
    }
    setStorePhone(formatted)
    setLoading(true)
    try {
      await sendOTP(formatted)
    } catch (e: any) {
      // In production a send failure stops the flow. In dev (DEV_AUTH_BYPASS)
      // we still navigate so the app is testable without an SMS provider.
      console.warn('[WinRak] sendOTP failed:', e.message)
      setLoading(false)
      if (!DEV_AUTH_BYPASS) {
        Alert.alert(t('otp.errorTitle'), t('login.smsError'))
        return
      }
      router.push({ pathname: '/(auth)/otp', params: { phone: formatted } })
      return
    }
    setLoading(false)
    router.push({ pathname: '/(auth)/otp', params: { phone: formatted } })
  }

  return (
    <View style={styles.container}>
      <View style={styles.top}>{Skyline(Colors)}</View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Txt weight="black" size={22}>{t('login.welcome')}</Txt>
        <Txt size={13} color={Colors.muted} style={{ marginTop: 4, marginBottom: Spacing.xl }}>
          {t('login.enterPhone')}
        </Txt>

        <Input type="phone" placeholder="6XX XXX XXX" value={phone} onChangeText={setPhone} />

        <View style={{ height: Spacing.lg }} />
        <Button
          label={loading ? '' : t('login.continue')}
          icon={loading ? undefined : undefined}
          onPress={handleContinue}
          disabled={loading || phone.trim().length < 9}
        />
        {loading && <ActivityIndicator color={Colors.gold} style={{ marginTop: 8 }} />}

        <Divider label={t('login.or')} />

        <Button label={t('login.google')} variant="outline" icon="google" onPress={() => promptAsync()} disabled={!request || loading} />

        <Txt size={12} color={Colors.muted} center style={{ marginTop: Spacing.xl }}>
          {t('login.termsPrefix')} <Txt size={12} color={Colors.gold}>{t('login.terms')}</Txt> {t('login.and')}{' '}
          <Txt size={12} color={Colors.gold}>{t('login.privacy')}</Txt>
        </Txt>
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    top: { height: '40%', backgroundColor: Colors.dark1 },
    sheet: {
      flex: 1,
      backgroundColor: Colors.dark2,
      borderTopLeftRadius: Spacing.radiusLg,
      borderTopRightRadius: Spacing.radiusLg,
      padding: Spacing.screenPadding,
      marginTop: -Spacing.radiusLg,
    },
  })
}
