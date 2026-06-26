import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'

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

/** Données passager issues de Supabase (profiles + passengers) */
export interface PassengerData {
  id:          string
  phone:       string
  fullName:    string
  fullNameAr:  string
  avatarUrl:   string | null
  rating:      number
  totalTrips:  number
  savedPlaces: {
    home: { name: string; address: string; lat: number; lng: number }
    work: { name: string; address: string; lat: number; lng: number }
  }
  emergencyContacts: EmergencyContact[]
}

/** Données chauffeur issues de Supabase (profiles + drivers) */
export interface DriverData {
  id:           string
  phone:        string
  fullName:     string
  avatarUrl:    string | null
  rating:       number
  totalTrips:   number
  vehicleType:  string
  vehiclePlate: string
  vehicleBrand: string
  vehicleColor: string
}

const defaultPassenger: PassengerData = {
  id:         '',
  phone:      '',
  fullName:   '',
  fullNameAr: '',
  avatarUrl:  null,
  rating:     5.0,
  totalTrips: 0,
  savedPlaces: {
    home: { name: 'المنزل', address: '', lat: 0, lng: 0 },
    work: { name: 'العمل', address: '', lat: 0, lng: 0 },
  },
  emergencyContacts: [],
}

const defaultDriver: DriverData = {
  id:           '',
  phone:        '',
  fullName:     '',
  avatarUrl:    null,
  rating:       5.0,
  totalTrips:   0,
  vehicleType:  'economique',
  vehiclePlate: '',
  vehicleBrand: '',
  vehicleColor: '',
}

interface UserStore {
  mode:                    AppMode
  passenger:               PassengerData
  driver:                  DriverData
  driverStats:             DriverStats | null
  isLoggedIn:              boolean
  phone:                   string
  profile:                 Record<string, any> | null
  currentCity:             string
  rideMode:                'city'
  photoStatus:             PhotoStatus
  photoUri:                string | null
  registrationStep:        number
  emergencyContacts:       EmergencyContact[]
  setMode:                 (mode: AppMode) => void
  setRideMode:             (mode: 'city') => void
  setCity:                 (city: string) => void
  setPhotoStatus:          (status: PhotoStatus) => void
  setPhotoUri:             (uri: string | null) => void
  setPhone:                (phone: string) => void
  setProfile:              (profile: Record<string, any> | null) => void
  setDriverStats:          (stats: DriverStats | null) => void
  /** Appelé après OTP validé — charge le profil Supabase et connecte l'utilisateur */
  login:                   () => Promise<void>
  logout:                  () => void
  addEmergencyContact:     (c: EmergencyContact) => void
  removeEmergencyContact:  (index: number) => void
}

// Only the profile photo persists across restarts (login stays mock/in-memory, so
// the app still opens at the splash → login flow). logout clears the saved photo.
export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      mode:                    'passenger',
      passenger:               defaultPassenger,
      driver:                  defaultDriver,
      driverStats:             null,
      isLoggedIn:              false,
      phone:                   '',
      profile:                 null,
      currentCity:             'الجزائر العاصمة',
      rideMode:                'city',
      photoStatus:             'missing',
      photoUri:                null,
      registrationStep:        1,
      emergencyContacts:       [],
      setMode:                 (mode)        => set({ mode }),
      setRideMode:             (rideMode)    => set({ rideMode }),
      setCity:                 (city)        => set({ currentCity: city }),
      setPhotoStatus:          (photoStatus) => set({ photoStatus }),
      setPhotoUri:             (photoUri)    => set({ photoUri, photoStatus: photoUri ? 'approved' : 'missing' }),
      setPhone:                (phone)       => set({ phone }),
      setProfile:              (profile)     => set({ profile }),
      setDriverStats:          (driverStats) => set({ driverStats }),

      login: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            // Aucune session — connexion simple sans profil
            set({ isLoggedIn: true })
            return
          }

          // Charge le profil de base
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, phone, role, full_name, full_name_ar, avatar_url, recent_searches')
            .eq('id', user.id)
            .single()

          if (!profile) {
            set({ isLoggedIn: true, profile: null })
            return
          }

          set({ isLoggedIn: true, profile, phone: profile.phone ?? get().phone })

          if (profile.role === 'passenger') {
            // Charge les données passager
            const { data: passenger } = await supabase
              .from('passengers')
              .select('rating, total_trips')
              .eq('id', user.id)
              .single()

            const passengerData: PassengerData = {
              id:         user.id,
              phone:      profile.phone ?? '',
              fullName:   profile.full_name ?? '',
              fullNameAr: profile.full_name_ar ?? '',
              avatarUrl:  profile.avatar_url ?? null,
              rating:     passenger?.rating ?? 5.0,
              totalTrips: passenger?.total_trips ?? 0,
              savedPlaces: (profile as any).saved_places ?? defaultPassenger.savedPlaces,
              emergencyContacts: (profile as any).emergency_contacts ?? [],
            }
            set({ passenger: passengerData, emergencyContacts: passengerData.emergencyContacts })

          } else if (profile.role === 'driver') {
            // Charge les données chauffeur
            const { data: driver } = await supabase
              .from('drivers')
              .select('rating, total_trips, vehicle_type, vehicle_plate, vehicle_make, vehicle_color')
              .eq('id', user.id)
              .single()

            const driverData: DriverData = {
              id:           user.id,
              phone:        profile.phone ?? '',
              fullName:     profile.full_name ?? '',
              avatarUrl:    profile.avatar_url ?? null,
              rating:       driver?.rating ?? 5.0,
              totalTrips:   driver?.total_trips ?? 0,
              vehicleType:  driver?.vehicle_type ?? 'economique',
              vehiclePlate: driver?.vehicle_plate ?? '',
              vehicleBrand: driver?.vehicle_make ?? '',
              vehicleColor: driver?.vehicle_color ?? '',
            }
            set({
              driver: driverData,
              driverStats: {
                rating:     driverData.rating,
                totalTrips: driverData.totalTrips,
              },
            })
          }
        } catch (e) {
          console.warn('[UserStore] login failed', e)
          set({ isLoggedIn: true }) // connexion optimiste si fetch échoue
        }
      },

      logout: () => {
        supabase.auth.signOut().catch(console.warn)
        set({
          isLoggedIn:        false,
          photoUri:          null,
          photoStatus:       'missing',
          profile:           null,
          phone:             '',
          driverStats:       null,
          passenger:         defaultPassenger,
          driver:            defaultDriver,
          emergencyContacts: [],
        })
      },

      addEmergencyContact:    (c)     => set((s) => ({ emergencyContacts: [...s.emergencyContacts, c] })),
      removeEmergencyContact: (index) => set((s) => ({ emergencyContacts: s.emergencyContacts.filter((_, i) => i !== index) })),
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
