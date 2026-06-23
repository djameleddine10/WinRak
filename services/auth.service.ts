import { supabase, UserRole } from '../lib/supabase'

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
