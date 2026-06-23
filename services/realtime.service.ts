import { supabase } from '../lib/supabase'

// ─── CHAUFFEUR : ENVOYER SA POSITION ─────────────────────────────────────────
export async function updateDriverLocation(params: {
  driverId: string
  lat:      number
  lng:      number
  heading?: number
  speed?:   number
}) {
  const { error } = await supabase
    .from('driver_locations')
    .upsert({
      driver_id:  params.driverId,
      lat:        params.lat,
      lng:        params.lng,
      heading:    params.heading ?? 0,
      speed:      params.speed   ?? 0,
      updated_at: new Date().toISOString(),
    })

  if (error) throw error
}

// ─── CHAUFFEUR : CHANGER DE STATUT ───────────────────────────────────────────
export async function setDriverStatus(driverId: string, status: 'online' | 'offline' | 'on_trip') {
  const { error } = await supabase
    .from('drivers')
    .update({ status })
    .eq('id', driverId)

  if (error) throw error
}

// ─── ÉCOUTER LA POSITION D'UN CHAUFFEUR (passager pendant la course) ─────────
export function subscribeToDriverLocation(
  driverId: string,
  onUpdate: (lat: number, lng: number, heading: number) => void
) {
  return supabase
    .channel(`driver-location-${driverId}`)
    .on(
      'postgres_changes',
      {
        event:  'UPDATE',
        schema: 'public',
        table:  'driver_locations',
        filter: `driver_id=eq.${driverId}`,
      },
      (payload) => {
        const { lat, lng, heading } = payload.new as any
        onUpdate(lat, lng, heading ?? 0)
      }
    )
    .subscribe()
}

// ─── ÉCOUTER TOUTES LES POSITIONS (dashboard admin — carte) ──────────────────
export function subscribeToAllDriverLocations(
  onUpdate: (driverId: string, lat: number, lng: number, heading: number) => void
) {
  return supabase
    .channel('all-driver-locations')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'driver_locations' },
      (payload) => {
        const { driver_id, lat, lng, heading } = payload.new as any
        onUpdate(driver_id, lat, lng, heading ?? 0)
      }
    )
    .subscribe()
}

// ─── ÉCOUTER LES COURSES EN ATTENTE (chauffeur) ───────────────────────────────
export function subscribeToNewTrips(
  vehicleType: string,
  onNewTrip: (trip: any) => void
) {
  return supabase
    .channel('new-trips')
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'trips',
        filter: `vehicle_type=eq.${vehicleType}`,
      },
      (payload) => onNewTrip(payload.new)
    )
    .subscribe()
}

// ─── ÉCOUTER MES OFFRES DE COURSE (chauffeur — proximity system) ──────────────
// Fires when the nearest-driver trigger inserts an offer specifically for this driver.
export function subscribeToMyTripOffer(
  driverId: string,
  onOffer: (offer: { id: string; trip_id: string; offer_rank: number; distance_m: number }) => void
) {
  return supabase
    .channel(`trip-offers-${driverId}`)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'trip_offers',
        filter: `driver_id=eq.${driverId}`,
      },
      (payload) => onOffer(payload.new as any)
    )
    .subscribe()
}

// ─── ÉCOUTER L'ÉTAT D'UNE COURSE (passager — attend l'acceptation) ────────────
export function subscribeToTripStatus(
  tripId: string,
  onUpdate: (trip: any) => void
) {
  return supabase
    .channel(`trip-status-${tripId}`)
    .on(
      'postgres_changes',
      {
        event:  'UPDATE',
        schema: 'public',
        table:  'trips',
        filter: `id=eq.${tripId}`,
      },
      (payload) => onUpdate(payload.new)
    )
    .subscribe()
}

// ─── ÉCOUTER LES CHANGEMENTS D'UNE COURSE (passager et chauffeur) ────────────
export function subscribeToTrip(
  tripId: string,
  onUpdate: (trip: any) => void
) {
  return supabase
    .channel(`trip-${tripId}`)
    .on(
      'postgres_changes',
      {
        event:  'UPDATE',
        schema: 'public',
        table:  'trips',
        filter: `id=eq.${tripId}`,
      },
      (payload) => onUpdate(payload.new)
    )
    .subscribe()
}

// ─── ÉCOUTER LES NOTIFICATIONS ────────────────────────────────────────────────
export function subscribeToNotifications(
  userId: string,
  onNotification: (notif: any) => void
) {
  return supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNotification(payload.new)
    )
    .subscribe()
}

// ─── ÉCOUTER LES DOCUMENTS (admin dashboard) ──────────────────────────────────
export function subscribeToDocuments(
  onNewDoc: (doc: any) => void
) {
  return supabase
    .channel('driver-documents')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'driver_documents' },
      (payload) => onNewDoc(payload.new)
    )
    .subscribe()
}

// ─── DÉSABONNER (appeler au unmount) ─────────────────────────────────────────
export function unsubscribe(channel: ReturnType<typeof supabase.channel>) {
  supabase.removeChannel(channel)
}
