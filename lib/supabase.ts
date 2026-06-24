import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Variables manquantes : EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY requis dans .env.local'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
})

// Types de base
export type UserRole = 'passenger' | 'driver' | 'admin'
export type TripStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
export type DocStatus  = 'pending' | 'approved' | 'rejected'
export type DocType    = 'permis' | 'carte_grise' | 'vehicle_front' | 'vehicle_rear' | 'selfie' | 'national_id' | 'insurance' | 'technical_visit'
export type VehicleType = 'economique' | 'confort' | 'she'
export type DriverStatus = 'online' | 'offline' | 'on_trip'
export type PaymentMethod = 'cib' | 'edahabia' | 'cash'
