import { create } from 'zustand'
import { mockMapDrivers, ALGIERS_CENTER, type LatLng } from '../mock/map'

export type AnimatedDriver = typeof mockMapDrivers[number] & {
  dlat: number
  dlng: number
}

interface MapStore {
  userLocation:      LatLng
  driverLocation:    LatLng | null
  mapDrivers:        AnimatedDriver[]
  showDrivers:       boolean
  setUserLocation:   (loc: LatLng) => void
  setDriverLocation: (loc: LatLng) => void
  setMapDrivers:     (drivers: AnimatedDriver[]) => void
  toggleDrivers:     () => void
}

const STEP = 0.00028  // ~25 m per tick

function initDrivers(): AnimatedDriver[] {
  return mockMapDrivers.map((d) => ({
    ...d,
    dlat: (Math.random() - 0.5) * STEP,
    dlng: (Math.random() - 0.5) * STEP,
  }))
}

export const useMapStore = create<MapStore>((set) => ({
  userLocation:      ALGIERS_CENTER,
  driverLocation:    null,
  mapDrivers:        initDrivers(),
  showDrivers:       true,
  setUserLocation:   (loc)     => set({ userLocation: loc }),
  setDriverLocation: (loc)     => set({ driverLocation: loc }),
  setMapDrivers:     (drivers) => set({ mapDrivers: drivers }),
  toggleDrivers:     ()        => set((s) => ({ showDrivers: !s.showDrivers })),
}))
