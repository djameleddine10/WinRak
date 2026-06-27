import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Animated, Pressable, StyleSheet, View } from 'react-native'
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
import { verifyOTP, getMyProfile, getDriverStats, getDriverRegistrationStatus } from '../../services/auth.service'
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
  const setRegistrationStatus = useDriverStore((s) => s.setRegistrationStatus)
  const loadWallet            = usePaymentStore((s) => s.loadWallet)

  const phone = paramPhone || storePhone

  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [seconds, setSeconds] = useState(30)
  const verifying             = useRef(false)

  // Shake animation for wrong code
  const shakeAnim = useRef(new Animated.Value(0)).current
  // Fade-in on mount
  const fadeAnim  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start()
  }, [])

  useEffect(() => {
    if (seconds <= 0) return
    const interval = setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => clearInterval(interval)
  }, [seconds])

  function shake() {
    shakeAnim.setValue(0)
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 50, useNativeDriver: true }),
    ]).start()
  }

  async function verify() {
    if (code.length < 6 || verifying.current) return
    verifying.current = true
    setLoading(true)
    try {
      await verifyOTP(phone, code)
      const profile = await getMyProfile()

      if (profile) {
        setProfile(profile)
        login()
        if (profile.role === 'driver') {
          setMode('driver')
          // Fetch real registration_status from DB
          const regStatus = await getDriverRegistrationStatus(profile.id)
          setRegistrationStatus(regStatus)
          getDriverStats(profile.id)
            .then((stats) => {
              if (stats) setDriverStats({ rating: stats.rating, totalTrips: stats.total_trips })
            })
            .catch(() => {})
          if (regStatus === 'approved') {
            router.replace('/(driver)/home')
          } else if (regStatus === 'pending' || regStatus === 'rejected') {
            router.replace('/(driver)/driver-pending')
          } else {
            router.replace('/(driver)/driver-signup')
          }
        } else {
          setMode('passenger')
          loadWallet(profile.id)
          router.replace('/(passenger)/(tabs)/home')
        }
      } else {
        login()
        setMode('passenger')
        router.replace('/(passenger)/profile-setup')
      }
    } catch (e: any) {
      if (DEV_AUTH_BYPASS) {
        // En mode dev, on essaie quand même de récupérer le profil depuis Supabase
        // (cas où le SMS Twilio échoue mais la session existe déjà)
        console.warn('[WinRak] verifyOTP failed — DEV bypass active:', e.message)
        try {
          const profile = await getMyProfile()
          if (profile) {
            setProfile(profile)
            login()
            if (profile.role === 'driver') {
              setMode('driver')
              const regStatus = await getDriverRegistrationStatus(profile.id)
              setRegistrationStatus(regStatus)
              if (regStatus === 'approved') {
                router.replace('/(driver)/home')
              } else if (regStatus === 'pending' || regStatus === 'rejected') {
                router.replace('/(driver)/driver-pending')
              } else {
                router.replace('/(driver)/driver-signup')
              }
            } else {
              setMode('passenger')
              loadWallet(profile.id)
              router.replace('/(passenger)/(tabs)/home')
            }
            return
          }
        } catch (_) {}
        // Aucun profil Supabase → bypass total (dev sans compte réel)
        login()
        router.replace('/(passenger)/(tabs)/home')
      } else {
        shake()
        Alert.alert(t('otp.errorTitle'), t('otp.errorWrong'))
        verifying.current = false
      }
    } finally {
      setLoading(false)
    }
  }

  function handleCodeChange(val: string) {
    setCode(val)
    if (val.length === 6) verify()
  }

  const phoneDisplay = phone ? phone : t('otp.sentTo')

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      {/* Back button */}
      <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
        <DirIcon name="arrow-left" size={22} color={Colors.white} />
      </Pressable>

      {/* Top section: icon + title */}
      <Animated.View style={[styles.top, { opacity: fadeAnim }]}>
        <View style={styles.iconWrap}>
          <Icon name="message-text" size={32} color={Colors.gold} />
        </View>
        <Txt weight="black" size={24} center style={{ marginTop: Spacing.lg }}>
          {t('otp.title')}
        </Txt>
        <Txt size={14} weight="bold" color={Colors.white} center style={{ marginTop: Spacing.sm }}>
          {phoneDisplay}
        </Txt>
        <Txt size={13} color={Colors.muted} center style={{ marginTop: 4 }}>
          {t('otp.enterCode')}
        </Txt>
      </Animated.View>

      {/* OTP boxes */}
      <Animated.View style={[styles.otpSection, { transform: [{ translateX: shakeAnim }] }]}>
        <Input
          type="otp"
          value={code}
          onChangeText={handleCodeChange}
        />
      </Animated.View>

      {/* Resend */}
      <View style={styles.resendRow}>
        <Txt size={13} color={Colors.muted}>{t('otp.noCode')} </Txt>
        {seconds > 0 ? (
          <Txt size={13} color={Colors.muted}>
            {t('otp.resendIn', { sec: seconds })}
          </Txt>
        ) : (
          <Pressable onPress={() => { setSeconds(30); setCode('') }} hitSlop={8}>
            <Txt size={13} color={Colors.gold} weight="bold">{t('otp.resend')}</Txt>
          </Pressable>
        )}
      </View>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={Colors.gold} size="small" />
          <Txt size={13} color={Colors.muted}>{t('otp.verifying')}</Txt>
        </View>
      )}

      {/* CTA */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Button
          label={t('otp.verify')}
          onPress={verify}
          disabled={code.length < 6 || loading}
          loading={loading}
        />
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.dark1,
      paddingHorizontal: Spacing.screenPadding,
    },
    back: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: Colors.dark2,
      alignItems: 'center', justifyContent: 'center',
    },
    top: {
      alignItems: 'center',
      marginTop: Spacing.xxxl,
    },
    iconWrap: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: Colors.goldAlpha10,
      alignItems: 'center', justifyContent: 'center',
    },
    otpSection: {
      marginTop: Spacing.xxxl,
      marginBottom: Spacing.lg,
    },
    resendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
    },
    bottom: {
      position: 'absolute',
      bottom: 0,
      left: Spacing.screenPadding,
      right: Spacing.screenPadding,
    },
  })
}
