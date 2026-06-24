import { supabase } from '../lib/supabase'
import { type Restaurant } from '../mock/restaurants'

export async function fetchRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase.rpc('get_restaurants')
  if (error) throw error
  return (data as Restaurant[]) ?? []
}
