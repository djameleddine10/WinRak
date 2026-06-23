import { create } from 'zustand'
import { SERVICE_FEE, type Med, type Pharmacy, type ParcelType } from '../mock/delivery'
import { type Restaurant, type MenuItem } from '../mock/restaurants'

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
  parcelType:      null as ParcelType | null,
  parcelFrom:      'الموقع الحالي — الجزائر العاصمة',
  parcelTo:        '',
  recipientName:   '',
  recipientPhone:  '',
}

// In-memory order state for the delivery hub. A delivery is transient (one order at a
// time), so nothing here is persisted. placeOrder simulates the courier lifecycle.
export const useDeliveryStore = create<DeliveryStore>((set, get) => ({
  ...initial,

  setService:       (service)   => set({ service }),
  selectPharmacy:   (pharmacy)  => set({ pharmacy }),
  selectRestaurant: (restaurant) => set((s) => ({
    restaurant,
    foodCart: s.restaurant?.id !== restaurant.id ? [] : s.foodCart,
  })),
  setMethod:        (method)    => set({ method }),
  setPrescription:  (uri)       => set({ prescriptionUri: uri }),
  setDropoff:       (dropoff)   => set({ dropoff }),
  setNote:          (note)      => set({ note }),
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

  // Mock lifecycle: finding → confirmed → preparing → on_the_way → auto-delivered after 25 s.
  placeOrder: () => {
    set({ status: 'finding' })
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
