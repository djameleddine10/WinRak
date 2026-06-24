import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReferralStats {
  referral_code:   string
  total_referrals: number
  rewarded:        number
  pending:         number
  active_discount: number        // % discount active right now (0 if none)
  discount_until:  string | null // ISO date
  referrals: {
    referred_id:    string
    status:         'pending' | 'rewarded' | 'cancelled'
    trips_done:     number
    trips_required: number
    reward_at:      string | null
  }[]
}

// ─── Validate & apply a referral code at driver registration ─────────────────

export async function applyReferralCode(
  referredDriverId: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('rpc_register_referral', {
    p_referred_id:   referredDriverId,
    p_referral_code: code.trim().toUpperCase(),
  })
  if (error) return { ok: false, error: error.message }
  return data as { ok: boolean; error?: string }
}

// ─── Get referral stats for the current driver ────────────────────────────────

export async function getReferralStats(driverId: string): Promise<ReferralStats | null> {
  const { data, error } = await supabase.rpc('rpc_get_referral_stats', {
    p_driver_id: driverId,
  })
  if (error) throw error
  return data as ReferralStats | null
}

// ─── Check if a referral code is valid (for real-time input validation) ───────

export async function validateReferralCode(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('rpc_resolve_referral_code', {
    p_code: code.trim().toUpperCase(),
  })
  if (error) return false
  return !!data
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function discountIsActive(stats: ReferralStats): boolean {
  if (!stats.discount_until || stats.active_discount === 0) return false
  return new Date(stats.discount_until) > new Date()
}

export function daysLeftInDiscount(stats: ReferralStats): number {
  if (!stats.discount_until) return 0
  const ms = new Date(stats.discount_until).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}
