import { supabase, TripStatus, VehicleType, PaymentMethod } from '../lib/supabase'

// ─── CRÉER UNE COURSE (passager) ─────────────────────────────────────────────
// SÉCURITÉ : le prix proposé (price) est borné côté serveur à ±30% du tarif
// équitable, et la commission + part chauffeur sont calculées par le trigger
// `trip_pricing_guard` (voir migration 20260623_secure_pricing.sql).
// On n'envoie donc PLUS commission / driver_earnings depuis le client.
export async function createTrip(params: {
  passengerId:   string
  fromAddress:   string
  fromLat:       number
  fromLng:       number
  toAddress:     string
  toLat:         number
  toLng:         number
  vehicleType:   VehicleType
  paymentMethod: PaymentMethod
  price:         number
  distanceKm:    number
  durationMin:   number
}) {
  const { data, error } = await supabase
    .from('trips')
    .insert({
      passenger_id:    params.passengerId,
      from_address:    params.fromAddress,
      from_lat:        params.fromLat,
      from_lng:        params.fromLng,
      to_address:      params.toAddress,
      to_lat:          params.toLat,
      to_lng:          params.toLng,
      vehicle_type:    params.vehicleType,
      payment_method:  params.paymentMethod,
      price:           params.price,   // proposé par le passager — borné côté serveur
      distance_km:     params.distanceKm,
      duration_min:    params.durationMin,
      status:          'pending' as TripStatus,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── ACCEPTER UNE COURSE (chauffeur) ─────────────────────────────────────────
export async function acceptTrip(tripId: string, driverId: string) {
  const { data, error } = await supabase
    .from('trips')
    .update({ driver_id: driverId, status: 'accepted' })
    .eq('id', tripId)
    .eq('status', 'pending')
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── DÉMARRER UNE COURSE ─────────────────────────────────────────────────────
export async function startTrip(tripId: string) {
  const { data, error } = await supabase
    .from('trips')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', tripId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── TERMINER UNE COURSE ─────────────────────────────────────────────────────
export async function completeTrip(tripId: string) {
  const { data, error } = await supabase
    .from('trips')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', tripId)
    .select()
    .single()

  if (error) throw error

  // SÉCURITÉ : la transaction est créée AUTOMATIQUEMENT côté serveur par le
  // trigger zz_create_transaction (migration 20260623_secure_transactions.sql)
  // dès que status passe à 'completed'. Les montants viennent de la course,
  // déjà sécurisés par trip_pricing_guard. Le client n'insère plus rien :
  //  - évite le conflit RLS (txn_insert_system = admin uniquement)
  //  - empêche la falsification des montants depuis le client.

  return data
}

// ─── ANNULER UNE COURSE ──────────────────────────────────────────────────────
export async function cancelTrip(tripId: string, reason?: string) {
  const { error } = await supabase
    .from('trips')
    .update({ status: 'cancelled', cancel_reason: reason ?? null })
    .eq('id', tripId)

  if (error) throw error
}

// ─── NOTER ───────────────────────────────────────────────────────────────────
// passengerRating = note donnée PAR le passager AU chauffeur
// driverRating    = note donnée PAR le chauffeur AU passager
// Les deux sont optionnels : chaque côté soumet indépendamment.
export async function rateTrip(params: {
  tripId:           string
  passengerRating?: number   // passager note le chauffeur
  driverRating?:    number   // chauffeur note le passager
}) {
  const updates: Record<string, number> = {}
  if (params.passengerRating !== undefined) updates.passenger_rating = params.passengerRating
  if (params.driverRating    !== undefined) updates.driver_rating    = params.driverRating
  if (!Object.keys(updates).length) return

  const { error } = await supabase
    .from('trips')
    .update(updates)
    .eq('id', params.tripId)

  if (error) throw error
}

// ─── MES COURSES (passager ou chauffeur) ─────────────────────────────────────
export async function getMyTrips(userId: string, role: 'passenger' | 'driver', limit = 20) {
  const col = role === 'passenger' ? 'passenger_id' : 'driver_id'

  const { data, error } = await supabase
    .from('trips_full')
    .select('*')
    .eq(col, userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

// ─── COURSE EN COURS ─────────────────────────────────────────────────────────
export async function getActiveTrip(userId: string, role: 'passenger' | 'driver') {
  const col = role === 'passenger' ? 'passenger_id' : 'driver_id'

  const { data, error } = await supabase
    .from('trips_full')
    .select('*')
    .eq(col, userId)
    .in('status', ['accepted', 'in_progress'])
    .maybeSingle()

  if (error) throw error
  return data
}

// ─── AVANCER L'OFFRE AU CHAUFFEUR SUIVANT (refus ou expiration) ──────────────
export async function advanceTripOffer(offerId: string, status: 'rejected' | 'expired' = 'rejected') {
  const { data, error } = await supabase.rpc('advance_trip_offer', {
    p_offer_id: offerId,
    p_status:   status,
  })
  if (error) throw error
  return data as string | null  // id de la nouvelle offre, ou null si aucun chauffeur
}

// ─── INFOS CHAUFFEUR POUR LE PASSAGER (après acceptation) ────────────────────
export async function getTripDriverInfo(tripId: string) {
  const { data, error } = await supabase.rpc('get_trip_driver_info', { p_trip_id: tripId })
  if (error) throw error
  return data as {
    full_name:     string
    phone:         string
    rating:        number
    vehicle_make:  string
    vehicle_model: string
    vehicle_plate: string
    vehicle_color: string
  } | null
}

// ─── ADMIN : TOUTES LES COURSES ──────────────────────────────────────────────
export async function getAllTrips(filters?: {
  status?: TripStatus
  vehicleType?: VehicleType
  limit?: number
}) {
  let query = supabase
    .from('trips_full')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters?.limit ?? 50)

  if (filters?.status)      query = query.eq('status', filters.status)
  if (filters?.vehicleType) query = query.eq('vehicle_type', filters.vehicleType)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
