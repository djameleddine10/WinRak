/* ══════════════════════════════════════════════════════════════════════
   WinRak Dashboard — Supabase Client
   Clé anon + fonctions SECURITY DEFINER (bypass RLS côté postgres).
   Exécuter d'abord : supabase/migrations/20260623_dashboard_functions.sql
════════════════════════════════════════════════════════════════════════ */

const SUPABASE_URL      = 'https://ltxbzqkuoihokgysvafp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0eGJ6cWt1b2lob2tneXN2YWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5OTkyMDIsImV4cCI6MjA5NzU3NTIwMn0.9xflfPFLqlfG-MW2hYDXdJRlCvRRcjKc0uasWA2epUI'

let db = null

function initSupabase() {
  if (typeof window.supabase === 'undefined') {
    console.warn('[WinRak] Supabase CDN non chargé — mode mock actif')
    return false
  }
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
  // Expose the client for any inline dashboard code that needs it directly.
  window._supabase = db
  return true
}

/* ─── DASHBOARD DATA (via fonctions RPC SECURITY DEFINER) ─────────────
   Ces fonctions tournent sous postgres côté Supabase → bypass RLS.
   Chaque appel rpc() correspond à une fonction dans
   supabase/migrations/20260623_dashboard_functions.sql
─────────────────────────────────────────────────────────────────────── */

async function fetchDrivers(filters) {
  if (!db) return null
  const { data, error } = await db.rpc('dash_drivers', {
    p_status: filters?.status ?? null
  })
  if (error) throw error
  return data
}

async function fetchPassengers(search) {
  if (!db) return null
  const { data, error } = await db.rpc('dash_passengers', {
    p_search: search ?? null
  })
  if (error) throw error
  return data
}

async function fetchTrips(filters) {
  if (!db) return null
  const { data, error } = await db.rpc('dash_trips', {
    p_status:       filters?.status      ?? null,
    p_vehicle_type: filters?.vehicleType ?? null
  })
  if (error) throw error
  return data
}

async function fetchTransactions(limit = 50) {
  if (!db) return null
  const { data, error } = await db.rpc('dash_transactions', { p_limit: limit })
  if (error) throw error
  return data
}

async function fetchPendingDocs() {
  if (!db) return null
  const { data, error } = await db.rpc('dash_pending_docs')
  if (error) throw error
  return data
}

async function reviewDoc(docId, status, reason, reviewerId) {
  if (!db) return
  const { error } = await db.rpc('dash_review_doc', {
    p_doc_id:      docId,
    p_status:      status,
    p_reason:      reason      ?? null,
    p_reviewer_id: reviewerId  ?? null
  })
  if (error) throw error
}

async function fetchMonthlyFinance() {
  if (!db) return null
  const { data, error } = await db.rpc('dash_finance_monthly')
  if (error) throw error
  return data
}

/* ─── REALTIME — Carte & Documents ───────────────────────────────────
   Les souscriptions Realtime utilisent le canal postgres_changes.
   driver_locations a une policy SELECT USING (TRUE) → accessible à anon.
─────────────────────────────────────────────────────────────────────── */

function subscribeDriverLocations(onUpdate) {
  if (!db) return null
  return db.channel('dashboard-locations')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'driver_locations' },
      payload => onUpdate(payload.new)
    )
    .subscribe()
}

function subscribeNewDocuments(onNew) {
  if (!db) return null
  return db.channel('dashboard-docs')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'driver_documents' },
      payload => onNew(payload.new)
    )
    .subscribe()
}

function subscribeTrips(onUpdate) {
  if (!db) return null
  return db.channel('dashboard-trips')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'trips' },
      payload => onUpdate(payload.new)
    )
    .subscribe()
}
