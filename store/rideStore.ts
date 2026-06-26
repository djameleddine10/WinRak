import { create } from 'zustand'

import type { DriverCardData } from '../components/ride/DriverCard'

/** Course Supabase — reflète la table `trips` */
export interface Ride {
  id:             string
  trip_code?:     string
  passenger_id?:  string
  driver_id?:     string
  rideType?:      string
  from: {
    name:    string
    address: string
    lat:     number
    lng:     number
  }
  to: {
    name:    string
    address: string
    lat:     number
    lng:     number
  }
  distance:       number
  duration?:      number
  price:          number
  suggestedPrice?: number
  status:         string
  vehicleType?:   string
  paymentMethod?: string
  createdAt?:     string
  startedAt?:     string
  completedAt?:   string
  rating?:        number
  driverEta?:     number
  cancelReason?:  string | null
  departureDate?: string | null
  departureTime?: string | null
  luggageAllowed?: boolean
  /** Données chauffeur chargées avec la course (pour l'affichage passager) */
  driver?:        DriverCardData
}

export type RideStatus =
  | 'idle' | 'searching' | 'driver_found'
  | 'driver_arriving' | 'ride_active'
  | 'completed' | 'cancelled'

export type VehicleType = 'sedan' | 'suv' | 'comfort' | 'van' | 'truck' | 'she'
export type RideType    = 'city'

export interface Location {
  name: string; address: string; lat: number; lng: number;
}

interface RideStore {
  status:            RideStatus
  rideType:          RideType
  from:              Location | null
  to:                Location | null
  vehicleType:       VehicleType
  offeredPrice:      number
  paymentMethod:     string
  currentRide:       Ride | null
  currentTripId:     string | null
  routeWaypoints:    Array<{ lat: number; lng: number }> | null
  rideHistory:       Ride[]
  searchTimer:       number
  departureDate:     string | null
  departureTime:     string | null
  luggageAllowed:    boolean
  sheMode:           boolean

  setFrom:           (loc: Location) => void
  setTo:             (loc: Location) => void
  setRideType:       (type: RideType) => void
  setVehicleType:    (type: VehicleType) => void
  setPrice:          (price: number) => void
  setPaymentMethod:  (method: string) => void
  setDeparture:      (date: string, time: string) => void
  setLuggage:        (val: boolean) => void
  setSheMode:        (val: boolean) => void
  setStatus:         (status: RideStatus) => void
  setCurrentTripId:  (id: string | null) => void
  setCurrentRide:    (ride: Ride) => void
  setRideHistory:    (rides: Ride[]) => void
  setRouteWaypoints: (pts: Array<{ lat: number; lng: number }> | null) => void
  requestRide:       () => void
  cancelRide:        () => void
  startRide:         () => void
  completeRide:      () => void
  reset:             () => void
}

export const useRideStore = create<RideStore>((set, get) => ({
  status:           'idle',
  rideType:         'city',
  from:             null,
  to:               null,
  vehicleType:      'sedan',
  offeredPrice:     800,
  paymentMethod:    'cash',
  currentRide:      null,
  currentTripId:    null,
  routeWaypoints:   null,
  rideHistory:      [],
  searchTimer:      20,
  departureDate:    null,
  departureTime:    null,
  luggageAllowed:   false,
  sheMode:          false,

  setFrom:          (from)          => set({ from }),
  setTo:            (to)            => set({ to }),
  setRideType:      (rideType)      => set({ rideType }),
  setVehicleType:   (vehicleType)   => set({ vehicleType }),
  setPrice:         (offeredPrice)  => set({ offeredPrice }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setDeparture:     (date, time)    => set({ departureDate: date, departureTime: time }),
  setLuggage:       (val)           => set({ luggageAllowed: val }),
  setSheMode:       (val)           => set({ sheMode: val }),
  setStatus:        (status)        => set({ status }),
  setCurrentTripId:  (id)            => set({ currentTripId: id }),
  setCurrentRide:    (ride)          => set({ currentRide: ride }),
  setRideHistory:    (rides)         => set({ rideHistory: rides }),
  setRouteWaypoints: (pts)           => set({ routeWaypoints: pts }),

  requestRide: () => {
    // Dev-only fallback: real dispatch goes via createTrip() + subscribeToTripStatus()
    set({ status: 'searching', searchTimer: 20 })
    let timer = 20
    const iv = setInterval(() => {
      timer -= 1
      set({ searchTimer: timer })
      if (timer <= 0) clearInterval(iv)
    }, 1000)
  },

  cancelRide:   () => set({ status: 'cancelled', currentRide: null, currentTripId: null }),
  startRide:    () => set({ status: 'ride_active' }),
  completeRide: () => set({ status: 'completed' }),
  reset:        () => set({
    status: 'idle', from: null, to: null,
    currentRide: null, currentTripId: null, routeWaypoints: null, offeredPrice: 800,
    departureDate: null, departureTime: null,
    sheMode: false, vehicleType: 'sedan', paymentMethod: 'cash',
  }),
}))
