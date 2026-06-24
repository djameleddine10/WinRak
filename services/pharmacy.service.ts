import { supabase } from '../lib/supabase'
import { type Pharmacy, type Med } from '../mock/delivery'

export async function fetchPharmacies(): Promise<Pharmacy[]> {
  const { data, error } = await supabase.rpc('get_pharmacies')
  if (error) throw error
  return (data as Pharmacy[]) ?? []
}

export async function fetchMedicines(): Promise<Med[]> {
  const { data, error } = await supabase.rpc('get_medicines')
  if (error) throw error
  return (data as Med[]) ?? []
}
