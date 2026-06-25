import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface AuthState {
  user:        any | null
  profile:     any | null
  loading:     boolean
  initialized: boolean
  // Step 1: password check + triggers OTP send
  signInStep1: (email: string, password: string) => Promise<{ error?: string }>
  // Step 2: OTP verify + admin role check
  signInStep2: (email: string, token: string) => Promise<{ error?: string }>
  signOut:     () => Promise<void>
  initialize:  () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user:        null,
  profile:     null,
  loading:     false,
  initialized: false,

  initialize: async () => {
    set({ loading: true })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (profile?.role === 'admin') {
          set({ user: session.user, profile })
        } else {
          await supabase.auth.signOut()
        }
      }
    } catch (err) {
      console.error('Auth init error:', err)
    } finally {
      set({ loading: false, initialized: true })
    }

    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') set({ user: null, profile: null })
    })
  },

  signInStep1: async (email, password) => {
    set({ loading: true })
    try {
      // Verify password first
      const { error: pwError } = await supabase.auth.signInWithPassword({ email, password })
      if (pwError) return { error: 'Email ou mot de passe incorrect.' }

      // Password OK — sign out the session immediately (we're not done yet)
      await supabase.auth.signOut()

      // Send OTP to email as second factor
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })
      if (otpError) return { error: otpError.message || 'Erreur lors de l\'envoi du code OTP.' }

      return {}
    } catch (err: any) {
      return { error: err?.message || 'Erreur inattendue.' }
    } finally {
      set({ loading: false })
    }
  },

  signInStep2: async (email, token) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'magiclink',
      })
      if (error) {
        console.error('verifyOtp error:', error)
        return { error: error.message || 'Code incorrect ou expiré.' }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user!.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut()
        return { error: 'Accès refusé. Vous n\'êtes pas administrateur.' }
      }

      set({ user: data.user, profile })
      return {}
    } catch (err: any) {
      return { error: err.message }
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },
}))
