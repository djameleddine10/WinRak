import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { currentUser } from '../mock/passengers'
import { mockDrivers } from '../mock/drivers'

type AppMode = 'passenger' | 'driver'
type PhotoStatus = 'missing' | 'pending' | 'approved'

export interface EmergencyContact {
  name: string
  phone: string
}

export interface DriverStats {
  rating:     number
  totalTrips: number
}

interface UserStore {
  mode:                    AppMode
  passenger:               typeof currentUser
  driver:                  typeof mockDrivers[0]
  driverStats:             DriverStats | null
  isLoggedIn:              boolean
  phone:                   string
  profile:                 Record<string, any> | null
  currentCity:             string
  rideMode:                'city' | 'intercity'
  photoStatus:             PhotoStatus
  photoUri:                string | null
  registrationStep:        number
  emergencyContacts:       EmergencyContact[]
  setMode:                 (mode: AppMode) => void
  setRideMode:             (mode: 'city' | 'intercity') => void
  setCity:                 (city: string) => void
  setPhotoStatus:          (status: PhotoStatus) => void
  setPhotoUri:             (uri: string | null) => void
  setPhone:                (phone: string) => void
  setProfile:              (profile: Record<string, any> | null) => void
  setDriverStats:          (stats: DriverStats | null) => void
  login:                   () => void
  logout:                  () => void
  addEmergencyContact:     (c: EmergencyContact) => void
  removeEmergencyContact:  (index: number) => void
}

// Only the profile photo persists across restarts (login stays mock/in-memory, so
// the app still opens at the splash → login flow). logout clears the saved photo.
export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      mode:                    'passenger',
      passenger:               currentUser,
      driver:                  mockDrivers[0],
      driverStats:             null,
      isLoggedIn:              false,
      phone:                   '',
      profile:                 null,
      currentCity:             'الجزائر العاصمة',
      rideMode:                'city',
      photoStatus:             'missing',
      photoUri:                null,
      registrationStep:        1,
      emergencyContacts:       currentUser.emergencyContacts,
      setMode:                 (mode)        => set({ mode }),
      setRideMode:             (rideMode)    => set({ rideMode }),
      setCity:                 (city)        => set({ currentCity: city }),
      setPhotoStatus:          (photoStatus) => set({ photoStatus }),
      setPhotoUri:             (photoUri)    => set({ photoUri, photoStatus: photoUri ? 'approved' : 'missing' }),
      setPhone:                (phone)       => set({ phone }),
      setProfile:              (profile)     => set({ profile }),
      setDriverStats:          (driverStats) => set({ driverStats }),
      login:                   ()            => set({ isLoggedIn: true }),
      logout:                  ()            => set({ isLoggedIn: false, photoUri: null, photoStatus: 'missing', profile: null, phone: '', driverStats: null }),
      addEmergencyContact:     (c)           => set((s) => ({ emergencyContacts: [...s.emergencyContacts, c] })),
      removeEmergencyContact:  (index)       => set((s) => ({ emergencyContacts: s.emergencyContacts.filter((_, i) => i !== index) })),
    }),
    {
      name: 'winrak-user',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist the session too, so a language-change reload (RTL↔LTR needs an app
      // restart) returns straight to home in the right mode — not to splash/login.
      partialize: (s) => ({
        photoUri:          s.photoUri,
        photoStatus:       s.photoStatus,
        isLoggedIn:        s.isLoggedIn,
        mode:              s.mode,
        phone:             s.phone,
        profile:           s.profile,
        driverStats:       s.driverStats,
        emergencyContacts: s.emergencyContacts,
      }),
    },
  ),
)
