import { useEffect } from 'react'
import { Redirect } from 'expo-router'
import { useUserStore } from '../store/userStore'
import { useDriverStore } from '../store/driverStore'
import { usePaymentStore } from '../store/paymentStore'
import { getSession, getMyProfile } from '../services/auth.service'

export default function Index() {
  const isLoggedIn       = useUserStore((s) => s.isLoggedIn)
  const mode             = useUserStore((s) => s.mode)
  const profile          = useUserStore((s) => s.profile)
  const setProfile       = useUserStore((s) => s.setProfile)
  const setMode          = useUserStore((s) => s.setMode)
  const login            = useUserStore((s) => s.login)
  const registrationStatus = useDriverStore((s) => s.registrationStatus)
  const approveDriver    = useDriverStore((s) => s.approveRegistration)
  const loadWallet       = usePaymentStore((s) => s.loadWallet)

  // Sync Supabase session → store on app start
  useEffect(() => {
    getSession().then((session) => {
      if (!session) return
      if (profile) return // already loaded
      getMyProfile().then((p) => {
        if (!p) return
        setProfile(p)
        login()
        if (p.role === 'admin') {
          // admin stays in passenger mode internally; routing handles the rest
        } else if (p.role === 'driver') {
          setMode('driver')
          approveDriver()
        } else {
          setMode('passenger')
          loadWallet(p.id)
        }
      }).catch(() => {})
    }).catch(() => {})
  }, [])

  if (!isLoggedIn) return <Redirect href="/(auth)/splash" />

  if (profile?.role === 'admin') return <Redirect href="/(admin)/home" />

  if (mode === 'driver') {
    if (registrationStatus === 'approved') return <Redirect href="/(driver)/home" />
    if (registrationStatus === 'pending')  return <Redirect href="/(driver)/driver-pending" />
    return <Redirect href="/(driver)/driver-signup" />
  }

  return <Redirect href="/(passenger)/(tabs)/home" />
}
