import { supabase } from '../lib/supabase'
import { type Restaurant, type MenuItem } from '../mock/restaurants'

export async function fetchRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, cuisine, area, rating, eta_min, delivery_fee, is_open, phone, reception, icon, menu_items:restaurant_menu_items(id, name, price)')
    .eq('is_active', true)
    .order('rating', { ascending: false })

  if (error) throw error

  return (data ?? []).map((r: any) => ({
    id:              r.id,
    name:            r.name             ?? '',
    cuisine:         r.cuisine          ?? 'fastfood',
    cuisineLabelKey: `food.cuisine.${r.cuisine ?? 'fastfood'}` as any,
    area:            r.area             ?? '',
    rating:          r.rating           ?? 5.0,
    etaMin:          r.eta_min          ?? 30,
    deliveryFee:     r.delivery_fee     ?? 150,
    isOpen:          r.is_open          ?? true,
    phone:           r.phone            ?? '',
    reception:       r.reception        ?? 'الاستقبال',
    icon:            r.icon             ?? 'food',
    menu:            (r.menu_items ?? []) as MenuItem[],
  }))
}
