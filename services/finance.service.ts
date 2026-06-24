import { supabase } from '../lib/supabase'

// ─── PORTEFEUILLE DU CHAUFFEUR ────────────────────────────────────────────────
export async function getDriverWallet(driverId: string) {
  // Primary: aggregate driver_earnings from completed trips via RPC
  try {
    const { data, error } = await supabase.rpc('get_driver_wallet', { p_driver_id: driverId })
    if (!error && data) return data as { wallet_balance: number }
  } catch { /* fall through */ }

  // Fallback: read wallet_balance column from drivers table (older schema)
  const { data, error } = await supabase
    .from('drivers')
    .select('wallet_balance, total_earnings, total_trips')
    .eq('id', driverId)
    .single()
  if (error) throw error
  return data
}

// ─── DEMANDER UN RETRAIT ──────────────────────────────────────────────────────
export async function requestPayout(params: {
  driverId: string
  amount:   number
  method:   'cib' | 'edahabia' | 'virement' | 'cash'
  bankRib?: string
}) {
  // Vérifier le solde disponible
  const wallet = await getDriverWallet(params.driverId)
  if (wallet.wallet_balance < params.amount) {
    throw new Error(`Solde insuffisant : ${wallet.wallet_balance} DZD disponibles`)
  }
  if (params.amount < 500) {
    throw new Error('Montant minimum de retrait : 500 DZD')
  }

  const { data, error } = await supabase
    .from('driver_payouts')
    .insert({
      driver_id: params.driverId,
      amount:    params.amount,
      method:    params.method,
      bank_rib:  params.bankRib ?? null,
      status:    'pending',
    })
    .select()
    .single()

  if (error) throw error

  // Débiter le portefeuille immédiatement (en attente de traitement)
  await supabase
    .from('drivers')
    .update({ wallet_balance: wallet.wallet_balance - params.amount })
    .eq('id', params.driverId)

  return data
}

// ─── HISTORIQUE DES TRANSACTIONS DU PASSAGER ─────────────────────────────────
export async function getPassengerTransactions(passengerId: string, limit = 30) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, trips(from_address, to_address, distance_km, vehicle_type, trip_code)')
    .eq('passenger_id', passengerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

// ─── HISTORIQUE DES TRANSACTIONS DU CHAUFFEUR ────────────────────────────────
export async function getDriverTransactions(driverId: string, limit = 30) {
  // Primary: aggregate from trips.driver_earnings via RPC
  try {
    const { data, error } = await supabase.rpc('get_driver_transactions', { p_driver_id: driverId })
    if (!error && data) return data as { driver_amount: number; created_at: string }[]
  } catch { /* fall through */ }

  // Fallback: read from transactions table (older schema)
  const { data, error } = await supabase
    .from('transactions')
    .select('*, trips(from_address, to_address, distance_km, vehicle_type)')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

// ─── HISTORIQUE DES RETRAITS DU CHAUFFEUR ────────────────────────────────────
export async function getDriverPayouts(driverId: string) {
  const { data, error } = await supabase
    .from('driver_payouts')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// ─── ADMIN : TOUTES LES TRANSACTIONS ─────────────────────────────────────────
export async function getAllTransactions(limit = 50) {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      passenger:profiles!transactions_passenger_id_fkey(full_name, phone),
      driver:profiles!transactions_driver_id_fkey(full_name, phone)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

// ─── ADMIN : RÉSUMÉ MENSUEL ───────────────────────────────────────────────────
export async function getMonthlyFinance() {
  const { data, error } = await supabase
    .from('finance_monthly')
    .select('*')
    .limit(12)

  if (error) throw error
  return data ?? []
}

// ─── ADMIN : TRAITER UN RETRAIT ───────────────────────────────────────────────
export async function processPayout(params: {
  payoutId:    string
  status:      'completed' | 'rejected'
  processedBy: string
  notes?:      string
}) {
  const { data: payout, error: fetchErr } = await supabase
    .from('driver_payouts')
    .select('driver_id, amount, status')
    .eq('id', params.payoutId)
    .single()

  if (fetchErr) throw fetchErr
  if (payout.status !== 'pending') throw new Error('Ce retrait a déjà été traité')

  const { error } = await supabase
    .from('driver_payouts')
    .update({
      status:       params.status,
      processed_by: params.processedBy,
      processed_at: new Date().toISOString(),
      notes:        params.notes ?? null,
    })
    .eq('id', params.payoutId)

  if (error) throw error

  // Si refusé → rembourser le portefeuille
  if (params.status === 'rejected') {
    const { data: driver } = await supabase
      .from('drivers')
      .select('wallet_balance')
      .eq('id', payout.driver_id)
      .single()

    if (driver) {
      await supabase
        .from('drivers')
        .update({ wallet_balance: driver.wallet_balance + payout.amount })
        .eq('id', payout.driver_id)
    }
  }
}

// ─── ADMIN : RETRAITS EN ATTENTE ─────────────────────────────────────────────
export async function getPendingPayouts() {
  const { data, error } = await supabase
    .from('driver_payouts')
    .select(`
      *,
      driver:profiles!driver_payouts_driver_id_fkey(full_name, phone)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

// ─── KPIs FINANCIERS DU JOUR (dashboard admin) ───────────────────────────────
export async function getTodayFinanceKpis() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, commission, driver_amount, payment_method')
    .gte('created_at', todayISO)
    .eq('status', 'completed')

  if (error) throw error
  const txns = data ?? []

  return {
    totalRevenue:    txns.reduce((s, t) => s + t.amount, 0),
    totalCommission: txns.reduce((s, t) => s + t.commission, 0),
    totalPaidOut:    txns.reduce((s, t) => s + t.driver_amount, 0),
    tripCount:       txns.length,
    byMethod: {
      cib:      txns.filter(t => t.payment_method === 'cib').length,
      edahabia: txns.filter(t => t.payment_method === 'edahabia').length,
      cash:     txns.filter(t => t.payment_method === 'cash').length,
    },
  }
}
