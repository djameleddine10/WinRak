/* ═══════════════════════════════════════════════════════════════════
   WinRak Dashboard — Supabase Client
   Remplacez les valeurs par celles de votre projet Supabase :
   Dashboard Supabase → Settings → API → Project URL + anon key
═══════════════════════════════════════════════════════════════════ */

const SUPABASE_URL      = 'https://ltxbzqkuoihokgysvafp.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_UFQHrQLZ4qyxgV3XaPGEKw_ql12gchC'

// Client Supabase (depuis CDN, ajouté dans index.html)
let db = null

function initSupabase() {
  if (typeof window.supabase === 'undefined') {
    console.warn('Supabase CDN non chargé — mode mock actif')
    return false
  }
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  })
  return true
}

/* ───────────────────────────────────────────────────────────────────
   AUTH ADMIN
─────────────────────────────────────────────────────────────────── */
async function supabaseAdminLogin(email, password) {
  if (!db) return null
  const { data, error } = await db.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

async function supabaseAdminLogout() {
  if (!db) return
  await db.auth.signOut()
}

/* ───────────────────────────────────────────────────────────────────
   DASHBOARD DATA
─────────────────────────────────────────────────────────────────── */
async function fetchDrivers(filters) {
  if (!db) return null
  let q = db.from('drivers_full').select('*').order('total_trips', { ascending: false })
  if (filters?.status) q = q.eq('status', filters.status)
  const { data, error } = await q
  if (error) throw error
  return data
}

async function fetchPassengers(search) {
  if (!db) return null
  let q = db.from('passengers_full').select('*').order('total_trips', { ascending: false })
  if (search) q = q.ilike('full_name', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

async function fetchTrips(filters) {
  if (!db) return null
  let q = db.from('trips_full').select('*').order('created_at', { ascending: false }).limit(50)
  if (filters?.status)      q = q.eq('status', filters.status)
  if (filters?.vehicleType) q = q.eq('vehicle_type', filters.vehicleType)
  const { data, error } = await q
  if (error) throw error
  return data
}

async function fetchTransactions(limit = 50) {
  if (!db) return null
  const { data, error } = await db
    .from('transactions')
    .select(`
      *,
      trip:trips(trip_code),
      passenger:profiles!transactions_passenger_id_fkey(full_name),
      driver:profiles!transactions_driver_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

async function fetchPendingDocs() {
  if (!db) return null
  const { data, error } = await db
    .from('pending_docs_view')
    .select('*')
    .order('uploaded_at', { ascending: false })
  if (error) throw error
  return data
}

async function reviewDoc(docId, status, reason, reviewerId) {
  if (!db) return
  const { error } = await db.from('driver_documents').update({
    status,
    reject_reason: reason || null,
    reviewed_by:   reviewerId,
    reviewed_at:   new Date().toISOString(),
  }).eq('id', docId)
  if (error) throw error
}

async function fetchMonthlyFinance() {
  if (!db) return null
  const { data, error } = await db.from('finance_monthly').select('*').limit(6)
  if (error) throw error
  return data
}

/* ───────────────────────────────────────────────────────────────────
   REALTIME — Carte & Documents
─────────────────────────────────────────────────────────────────── */
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
