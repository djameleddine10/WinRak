import { supabase } from '../lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminRestaurant {
  id:              string
  name:            string
  cuisine:         string
  cuisine_label_key: string
  area:            string
  rating:          number
  eta_min:         number
  delivery_fee:    number
  is_open:         boolean
  phone:           string
  reception:       string
  icon:            string
  status:          string
}

export interface AdminMenuItem {
  id:            string
  restaurant_id: string
  name:          string
  price:         number
  is_available:  boolean
}

export interface AdminPharmacy {
  id:          string
  name:        string
  area:        string
  distance_km: number
  eta_min:     number
  rating:      number
  delivery_fee: number
  open_24h:    boolean
  open_now:    boolean
  status:      string
}

// ─── Restaurants ─────────────────────────────────────────────────────────────

export async function adminListRestaurants(): Promise<AdminRestaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id,name,cuisine,cuisine_label_key,area,rating,eta_min,delivery_fee,is_open,phone,reception,icon,status')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AdminRestaurant[]
}

export async function adminUpsertRestaurant(r: Omit<AdminRestaurant, 'rating'>): Promise<void> {
  const { error } = await supabase
    .from('restaurants')
    .upsert({ ...r, rating: 5.0 }, { onConflict: 'id' })
  if (error) throw error
}

export async function adminDeleteRestaurant(id: string): Promise<void> {
  const { error } = await supabase.from('restaurants').delete().eq('id', id)
  if (error) throw error
}

export async function adminSetRestaurantStatus(id: string, status: 'active' | 'pending'): Promise<void> {
  const { error } = await supabase.from('restaurants').update({ status }).eq('id', id)
  if (error) throw error
}

// ─── Menu items ───────────────────────────────────────────────────────────────

export async function adminListMenuItems(restaurantId: string): Promise<AdminMenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('id')
  if (error) throw error
  return (data ?? []) as AdminMenuItem[]
}

export async function adminUpsertMenuItem(item: AdminMenuItem): Promise<void> {
  const { error } = await supabase
    .from('menu_items')
    .upsert(item, { onConflict: 'id' })
  if (error) throw error
}

export async function adminDeleteMenuItem(id: string): Promise<void> {
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) throw error
}

// ─── Pharmacies ───────────────────────────────────────────────────────────────

export async function adminListPharmacies(): Promise<AdminPharmacy[]> {
  const { data, error } = await supabase
    .from('pharmacies')
    .select('*')
    .order('name')
  if (error) throw error
  return (data ?? []) as AdminPharmacy[]
}

export async function adminUpsertPharmacy(p: Omit<AdminPharmacy, 'rating'>): Promise<void> {
  const { error } = await supabase
    .from('pharmacies')
    .upsert({ ...p, rating: 5.0 }, { onConflict: 'id' })
  if (error) throw error
}

export async function adminDeletePharmacy(id: string): Promise<void> {
  const { error } = await supabase.from('pharmacies').delete().eq('id', id)
  if (error) throw error
}

// ─── Helper ───────────────────────────────────────────────────────────────────

export function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
