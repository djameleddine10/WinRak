import { create } from 'zustand'
import { ALGIERS_CENTER, type LatLng } from '../mock/map'

export interface AnimatedDriver {
  id:       string
  lat:      number
  lng:      number
  heading:  number
  isOnline: boolean
  type:     string
  dlat:     number
  dlng:     number
}

interface MapStore {
  userLocation:      LatLng
  driverLocation:    LatLng | null
  mapDrivers:        AnimatedDriver[]
  showDrivers:       boolean
  setUserLocation:   (loc: LatLng) => void
  setDriverLocation: (loc: LatLng) => void
  setMapDrivers:     (drivers: AnimatedDriver[]) => void
  setRealDrivers:    (drivers: { id: string; lat: number; lng: number; heading: number }[]) => void
  updateRealDriver:  (id: string, lat: number, lng: number, heading: number) => void
  removeDriver:      (id: string) => void
  toggleDrivers:     () => void
}

export const useMapStore = create<MapStore>((set) => ({
  userLocation:      ALGIERS_CENTER,
  driverLocation:    null,
  mapDrivers:        [],
  showDrivers:       true,
  setUserLocation:   (loc)     => set({ userLocation: loc }),
  setDriverLocation: (loc)     => set({ driverLocation: loc }),
  setMapDrivers:     (drivers) => set({ mapDrivers: drivers }),
  toggleDrivers:     ()        => set((s) => ({ showDrivers: !s.showDrivers })),

  setRealDrivers: (drivers) => set({
    mapDrivers: drivers.map((d) => ({
      id:       d.id,
      lat:      d.lat,
      lng:      d.lng,
      heading:  d.heading,
      isOnline: true,
      type:     'car',
      dlat:     0,
      dlng:     0,
    })),
  }),

  updateRealDriver: (id, lat, lng, heading) => set((s) => {
    const exists = s.mapDrivers.some((d) => d.id === id)
    if (exists) {
      return { mapDrivers: s.mapDrivers.map((d) => d.id === id ? { ...d, lat, lng, heading } : d) }
    }
    return {
      mapDrivers: [
        ...s.mapDrivers,
        { id, lat, lng, heading, isOnline: true, type: 'car', dlat: 0, dlng: 0 },
      ],
    }
  }),

  removeDriver: (id) => set((s) => ({
    mapDrivers: s.mapDrivers.filter((d) => d.id !== id),
  })),
}))
