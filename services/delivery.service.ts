import { supabase } from '../lib/supabase'
import { type DeliveryStatus } from '../store/deliveryStore'

export async function createDeliveryOrder(params: {
  serviceType:  string
  restaurantId: string | null
  pharmacyId:   string | null
  items:        unknown[]
  dropoffAddr:  string
  note:         string
  totalPrice:   number
  deliveryFee:  number
}): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('delivery_orders')
    .insert({
      passenger_id:  user.id,
      service_type:  params.serviceType,
      restaurant_id: params.restaurantId,
      pharmacy_id:   params.pharmacyId,
      items:         params.items,
      dropoff_addr:  params.dropoffAddr,
      note:          params.note || null,
      total_price:   params.totalPrice,
      delivery_fee:  params.deliveryFee,
      status:        'finding',
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

export function subscribeDeliveryOrder(
  orderId: string,
  onStatus: (status: DeliveryStatus) => void
) {
  return supabase
    .channel(`delivery-${orderId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'delivery_orders', filter: `id=eq.${orderId}` },
      (payload) => onStatus(payload.new.status as DeliveryStatus)
    )
    .subscribe()
}
