import { create } from 'zustand'
import { mockRides } from '../mock/rides'
import { mockDrivers } from '../mock/drivers'

export type RideStatus =
  | 'idle' | 'searching' | 'driver_found'
  | 'driver_arriving' | 'ride_active'
  | 'completed' | 'cancelled'

export type VehicleType = 'sedan' | 'suv' | 'comfort' | 'van' | 'truck' | 'she'
export type RideType    = 'city' | 'intercity'

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
  currentRide:       typeof mockRides[0] | null
  currentTripId:     string | null
  routeWaypoints:    Array<{ lat: number; lng: number }> | null
  rideHistory:       typeof mockRides
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
  setCurrentRide:    (ride: typeof mockRides[0]) => void
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
  rideHistory:      mockRides,
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
  setRouteWaypoints: (pts)           => set({ routeWaypoints: pts }),

  requestRide: () => {
    set({ status: 'searching', searchTimer: 20 })
    let timer = 20
    const iv = setInterval(() => {
      timer -= 1
      set({ searchTimer: timer })
      if (timer <= 0) clearInterval(iv)
    }, 1000)
    setTimeout(() => {
      clearInterval(iv)
      const { from, to, offeredPrice, vehicleType, paymentMethod } = get()
      // WinRak SHE: a female ride is matched with a female (SHE) driver.
      const driver = vehicleType === 'she'
        ? (mockDrivers.find((d) => d.isSheDriver) ?? mockDrivers[0])
        : mockDrivers[0]
      set({
        status: 'driver_found',
        currentRide: {
          ...mockRides[0],
          from:          from ?? mockRides[0].from,
          to:            to   ?? mockRides[0].to,
          price:         offeredPrice,
          vehicleType:   vehicleType,
          paymentMethod: paymentMethod as typeof mockRides[0]['paymentMethod'],
          status:        'accepted',
          driver,
        },
      })
    }, 3000)
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
