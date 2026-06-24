import { create } from 'zustand'
import { SERVICE_FEE, type Med, type Pharmacy, type ParcelType } from '../mock/delivery'
import { type Restaurant, type MenuItem } from '../mock/restaurants'
import { createDeliveryOrder, subscribeDeliveryOrder } from '../services/delivery.service'

export type DeliveryService = 'food' | 'pharmacy' | 'parcel'
export type PharmacyMethod = 'prescription' | 'catalog'
export type DeliveryStatus =
  | 'idle' | 'finding' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered'

export interface CartItem {
  med: Med
  qty: number
}

export interface FoodCartItem {
  item: MenuItem
  qty:  number
}

interface DeliveryStore {
  service:         DeliveryService | null
  pharmacy:        Pharmacy | null
  restaurant:      Restaurant | null
  method:          PharmacyMethod | null
  prescriptionUri: string | null
  cart:            CartItem[]
  foodCart:        FoodCartItem[]
  dropoff:         string
  note:            string
  status:          DeliveryStatus
  currentOrderId:  string | null

  // Parcel vertical (الطرود)
  parcelType:      ParcelType | null
  parcelFrom:      string
  parcelTo:        string
  recipientName:   string
  recipientPhone:  string

  setService:        (s: DeliveryService) => void
  selectPharmacy:    (p: Pharmacy) => void
  selectRestaurant:  (r: Restaurant) => void
  setMethod:         (m: PharmacyMethod) => void
  setPrescription:   (uri: string | null) => void
  addToCart:         (med: Med) => void
  decrement:         (medId: string) => void
  addFoodItem:       (item: MenuItem) => void
  decrementFood:     (itemId: string) => void
  setDropoff:        (addr: string) => void
  setNote:           (n: string) => void
  setParcelType:     (t: ParcelType) => void
  setParcelFrom:     (a: string) => void
  setParcelTo:       (a: string) => void
  setRecipientName:  (n: string) => void
  setRecipientPhone: (p: string) => void
  placeOrder:        () => void
  markDelivered:     () => void
  reset:             () => void
}

const initial = {
  service:         null,
  pharmacy:        null as Pharmacy | null,
  restaurant:      null as Restaurant | null,
  method:          null,
  prescriptionUri: null,
  cart:            [] as CartItem[],
  foodCart:        [] as FoodCartItem[],
  dropoff:         'الموقع الحالي — الجزائر العاصمة',
  note:            '',
  status:          'idle' as DeliveryStatus,
  currentOrderId:  null as string | null,
  parcelType:      null as ParcelType | null,
  parcelFrom:      'الموقع الحالي — الجزائر العاصمة',
  parcelTo:        '',
  recipientName:   '',
  recipientPhone:  '',
}

export const useDeliveryStore = create<DeliveryStore>((set, get) => ({
  ...initial,

  setService:       (service)    => set({ service }),
  selectPharmacy:   (pharmacy)   => set({ pharmacy }),
  selectRestaurant: (restaurant) => set((s) => ({
    restaurant,
    foodCart: s.restaurant?.id !== restaurant.id ? [] : s.foodCart,
  })),
  setMethod:        (method)     => set({ method }),
  setPrescription:  (uri)        => set({ prescriptionUri: uri }),
  setDropoff:       (dropoff)    => set({ dropoff }),
  setNote:          (note)       => set({ note }),
  setParcelType:    (parcelType)    => set({ parcelType }),
  setParcelFrom:    (parcelFrom)    => set({ parcelFrom }),
  setParcelTo:      (parcelTo)      => set({ parcelTo }),
  setRecipientName:  (recipientName)  => set({ recipientName }),
  setRecipientPhone: (recipientPhone) => set({ recipientPhone }),

  addToCart: (med) => set((s) => {
    const found = s.cart.find((c) => c.med.id === med.id)
    if (found) {
      return { cart: s.cart.map((c) => (c.med.id === med.id ? { ...c, qty: c.qty + 1 } : c)) }
    }
    return { cart: [...s.cart, { med, qty: 1 }] }
  }),

  decrement: (medId) => set((s) => ({
    cart: s.cart
      .map((c) => (c.med.id === medId ? { ...c, qty: c.qty - 1 } : c))
      .filter((c) => c.qty > 0),
  })),

  addFoodItem: (item) => set((s) => {
    const found = s.foodCart.find((c) => c.item.id === item.id)
    if (found) {
      return { foodCart: s.foodCart.map((c) => (c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c)) }
    }
    return { foodCart: [...s.foodCart, { item, qty: 1 }] }
  }),

  decrementFood: (itemId) => set((s) => ({
    foodCart: s.foodCart
      .map((c) => (c.item.id === itemId ? { ...c, qty: c.qty - 1 } : c))
      .filter((c) => c.qty > 0),
  })),

  placeOrder: () => {
    set({ status: 'finding' })

    // Insert real order to Supabase & subscribe to admin status updates via Realtime.
    ;(async () => {
      try {
        const s = get()
        const foodItems = s.foodCart.map((c) => ({ id: c.item.id, qty: c.qty, price: c.item.price }))
        const medItems  = s.cart.map((c) => ({ id: c.med.id, qty: c.qty, price: c.med.price }))
        const isFood    = s.service === 'food'
        const isParcel  = s.service === 'parcel'
        const subtotal  = isFood
          ? s.foodCart.reduce((sum, c) => sum + c.item.price * c.qty, 0)
          : s.cart.reduce((sum, c) => sum + c.med.price * c.qty, 0)
        const deliveryFee = isFood
          ? (s.restaurant?.deliveryFee ?? 150)
          : (isParcel ? 0 : 150)
        const totalPrice = isParcel
          ? (s.parcelType?.basePrice ?? 0) + SERVICE_FEE
          : subtotal + deliveryFee + SERVICE_FEE

        const orderId = await createDeliveryOrder({
          serviceType:  s.service ?? 'food',
          restaurantId: s.restaurant?.id ?? null,
          pharmacyId:   s.pharmacy?.id ?? null,
          items:        isFood ? foodItems : medItems,
          dropoffAddr:  s.dropoff,
          note:         s.note,
          totalPrice,
          deliveryFee,
        })

        set({ currentOrderId: orderId })
        subscribeDeliveryOrder(orderId, (status) => set({ status }))
      } catch (e) {
        console.warn('[Delivery] DB insert failed — running mock lifecycle', e)
      }
    })()

    // Mock lifecycle: runs in parallel as UX fallback until real courier system is live.
    // Admin can override by updating delivery_orders.status via dashboard → Realtime fires.
    setTimeout(() => { if (get().status === 'finding')    set({ status: 'confirmed' })  }, 1500)
    setTimeout(() => { if (get().status === 'confirmed')  set({ status: 'preparing' })  }, 3200)
    setTimeout(() => { if (get().status === 'preparing')  set({ status: 'on_the_way' }) }, 5200)
    setTimeout(() => { if (get().status === 'on_the_way') set({ status: 'delivered' })  }, 25000)
  },

  markDelivered: () => set({ status: 'delivered' }),

  reset: () => set({ ...initial }),
}))

// Derived helpers — kept out of the store so they don't trigger re-renders.
export function cartCount(cart: CartItem[]) {
  return cart.reduce((n, c) => n + c.qty, 0)
}

export function cartSubtotal(cart: CartItem[]) {
  return cart.reduce((sum, c) => sum + c.med.price * c.qty, 0)
}

export function orderTotal(subtotal: number, deliveryFee: number) {
  return subtotal + deliveryFee + SERVICE_FEE
}

export function parcelTotal(parcel: ParcelType | null) {
  return (parcel?.basePrice ?? 0) + SERVICE_FEE
}

export function foodCartCount(fc: FoodCartItem[]) {
  return fc.reduce((n, c) => n + c.qty, 0)
}

export function foodCartSubtotal(fc: FoodCartItem[]) {
  return fc.reduce((sum, c) => sum + c.item.price * c.qty, 0)
}
