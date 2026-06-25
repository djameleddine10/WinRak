import { supabase } from '../lib/supabase'
import { type Pharmacy, type Med } from '../mock/delivery'

export async function fetchPharmacies(): Promise<Pharmacy[]> {
  const { data, error } = await supabase
    .from('pharmacies')
    .select('id, name, area, distance_km, eta_min, rating, delivery_fee, open_24h, open_now')
    .order('open_now', { ascending: false })

  if (error) throw error

  return (data ?? []).map((r: any) => ({
    id:          r.id,
    name:        r.name         ?? '',
    area:        r.area         ?? '',
    distanceKm:  r.distance_km  ?? 0,
    etaMin:      r.eta_min      ?? 30,
    rating:      r.rating       ?? 5.0,
    deliveryFee: r.delivery_fee ?? 150,
    open24h:     r.open_24h     ?? false,
    openNow:     r.open_now     ?? false,
  }))
}

// Medicines use TranslationKey-based names (nameKey/detailKey), not plain text.
// Until the DB stores translation keys, seed data is the source of truth.
export async function fetchMedicines(_pharmacyId?: string): Promise<Med[]> {
  return []
}
