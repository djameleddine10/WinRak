import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'
import { supabase, UserRole } from '../lib/supabase'

// Only needed on web to close the OAuth popup — no-op on native.
if (Platform.OS === 'web') WebBrowser.maybeCompleteAuthSession()

// ─── GOOGLE AUTH ──────────────────────────────────────────────────────────────
// Hook used inside login.tsx: returns the request/response/prompt triple.
// Client IDs come from Google Cloud Console (.env.local). When they are empty
// the request stays null → the Google button is disabled (no fake flow).
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
    iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID     || undefined,
    webClientId:     process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID     || undefined,
  })
  return { request, response, promptAsync }
}

// Exchanges the Google id_token for a real Supabase session.
export async function signInWithGoogle(idToken: string) {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token:    idToken,
  })
  if (error) throw error
  return data
}

// ─── OTP SMS ──────────────────────────────────────────────────────────────────
export async function sendOTP(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({ phone })
  if (error) throw error
}

export async function verifyOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })
  if (error) throw error
  return data
}

// ─── PROFIL ───────────────────────────────────────────────────────────────────
export async function createProfile(params: {
  id: string
  phone: string
  role: UserRole
  fullName: string
  fullNameAr: string
}) {
  const { error } = await supabase.from('profiles').insert({
    id:           params.id,
    phone:        params.phone,
    role:         params.role,
    full_name:    params.fullName,
    full_name_ar: params.fullNameAr,
  })
  if (error) throw error

  // Créer la ligne correspondante dans passengers ou drivers
  if (params.role === 'passenger') {
    await supabase.from('passengers').insert({ id: params.id })
  } else if (params.role === 'driver') {
    await supabase.from('drivers').insert({ id: params.id })
  }
}

export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

export async function getDriverRegistrationStatus(driverId: string): Promise<'not_started' | 'pending' | 'approved' | 'rejected'> {
  const { data, error } = await supabase
    .from('drivers')
    .select('registration_status')
    .eq('id', driverId)
    .maybeSingle()
  if (error || !data) return 'not_started'
  return (data.registration_status as 'not_started' | 'pending' | 'approved' | 'rejected') ?? 'not_started'
}

export async function getDriverStats(driverId: string) {
  const { data, error } = await supabase
    .from('drivers')
    .select('rating, total_trips')
    .eq('id', driverId)
    .maybeSingle()
  if (error) throw error
  return data as { rating: number; total_trips: number } | null
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Écouter les changements d'état d'authentification
export function onAuthStateChange(cb: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(cb)
}
