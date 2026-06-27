import { useEffect } from 'react'
import { Redirect } from 'expo-router'
import { useUserStore } from '../store/userStore'
import { useDriverStore } from '../store/driverStore'
import { usePaymentStore } from '../store/paymentStore'
import { getSession, getMyProfile, getDriverRegistrationStatus } from '../services/auth.service'

export default function Index() {
  const isLoggedIn       = useUserStore((s) => s.isLoggedIn)
  const mode             = useUserStore((s) => s.mode)
  const profile          = useUserStore((s) => s.profile)
  const setProfile       = useUserStore((s) => s.setProfile)
  const setMode          = useUserStore((s) => s.setMode)
  const login            = useUserStore((s) => s.login)
  const registrationStatus    = useDriverStore((s) => s.registrationStatus)
  const setRegistrationStatus = useDriverStore((s) => s.setRegistrationStatus)
  const loadWallet            = usePaymentStore((s) => s.loadWallet)

  // Sync Supabase session → store on app start
  useEffect(() => {
    getSession().then((session) => {
      if (!session) return
      if (profile) return // already loaded
      getMyProfile().then((p) => {
        if (!p) return
        setProfile(p)
        login()
        if (p.role === 'driver') {
          setMode('driver')
          // Sync real registration_status from DB into store
          getDriverRegistrationStatus(p.id)
            .then((s) => setRegistrationStatus(s))
            .catch(() => {})
        } else {
          setMode('passenger')
          loadWallet(p.id)
        }
      }).catch(() => {})
    }).catch(() => {})
  }, [])

  if (!isLoggedIn) return <Redirect href="/(auth)/onboarding" />

  if (mode === 'driver') {
    if (registrationStatus === 'approved') return <Redirect href="/(driver)/home" />
    if (registrationStatus === 'pending')  return <Redirect href="/(driver)/driver-pending" />
    return <Redirect href="/(driver)/driver-signup" />
  }

  return <Redirect href="/(passenger)/(tabs)/home" />
}
