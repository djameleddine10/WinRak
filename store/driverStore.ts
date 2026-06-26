import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

type DriverStatus =
  | 'offline' | 'online' | 'has_request'
  | 'going_to_pickup' | 'on_ride'

type DriverRegistrationStatus =
  | 'not_started' | 'pending' | 'approved' | 'rejected'

interface DriverFormData {
  firstName:        string
  lastName:         string
  birthDate:        string
  birthPlace:       string
  licenseNumber:    string
  licenseExpiry:    string
  grayCardNumber:   string
  vehicleType:      string
  vehicleBrand:     string
  vehicleColor:     string
  vehicleYear:      string
  vehiclePlate:     string
  photoUri:         string | null
  licensePhotoUri:  string | null
  grayCardPhotoUri: string | null
}

/** Offre de course reçue via Supabase Realtime */
export interface RideOffer {
  offerId:     string
  tripId:      string
  tripCode:    string
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
  distanceKm:    number
  durationMin:   number
  price:         number
  vehicleType:   string
  paymentMethod: string
  passengerName: string
  passengerPhone: string
  passengerRating: number
}

interface DriverStore {
  status:             DriverStatus
  registrationStatus: DriverRegistrationStatus
  registrationStep:   1 | 2 | 3
  driverType:         'city' | null
  sheService:         boolean
  incomingRide:       RideOffer | null
  activeRide:         RideOffer | null
  realTripId:         string | null
  currentOfferId:     string | null
  routeWaypoints:     Array<{ lat: number; lng: number }> | null
  timerSeconds:       number
  formData:           DriverFormData

  setDriverType:       (type: 'city') => void
  setSheService:       (val: boolean) => void
  setOnline:           () => void
  setRealTripId:       (id: string | null) => void
  setOfferId:          (id: string | null) => void
  setIncomingRide:     (ride: RideOffer) => void
  setRouteWaypoints:   (pts: Array<{ lat: number; lng: number }> | null) => void
  nextStep:            () => void
  prevStep:            () => void
  updateForm:          (field: keyof DriverFormData, value: string) => void
  setPhoto:            (uri: string) => void
  submitRegistration:  () => void
  approveRegistration: () => void
  goOnline:            () => void
  goOffline:           () => void
  /** Souscrit aux offres Realtime pour le chauffeur connecté */
  subscribeToOffers:   () => void
  /** Annule la souscription Realtime */
  unsubscribeFromOffers: () => void
  acceptRide:          () => void
  rejectRide:          () => void
  startRide:           () => void
  completeRide:        () => void
  clearRequestTimer:   () => void
}

// ─── Timers module-scoped (never stacked) ────────────────────────────────────
let requestTimer: ReturnType<typeof setInterval> | null = null
let autoRequeue:  ReturnType<typeof setTimeout>  | null = null
function stopRequestTimer() {
  if (requestTimer) { clearInterval(requestTimer); requestTimer = null }
  if (autoRequeue)  { clearTimeout(autoRequeue);   autoRequeue  = null }
}

// Realtime channel handle (un seul à la fois)
let offersChannel: RealtimeChannel | null = null

// Only the WinRak SHE service flag persists (it's a registration preference). Live
// ride/session status stays in-memory and resets to offline on restart.
export const useDriverStore = create<DriverStore>()(
  persist(
    (set, get) => ({
      status:             'offline',
      registrationStatus: 'not_started',
      registrationStep:   1,
      driverType:         null,
      sheService:         false,
      incomingRide:       null,
      activeRide:         null,
      realTripId:         null,
      currentOfferId:     null,
      routeWaypoints:     null,
      timerSeconds:       20,
      formData: {
        firstName: '', lastName: '', birthDate: '', birthPlace: '',
        licenseNumber: '', licenseExpiry: '', grayCardNumber: '',
        vehicleType: 'sedan', vehicleBrand: '', vehicleColor: '',
        vehicleYear: '', vehiclePlate: '',
        photoUri: null, licensePhotoUri: null, grayCardPhotoUri: null,
      },

      setDriverType: (type) => set({ driverType: type }),
      setSheService: (val) => set({ sheService: val }),
      setOnline:     () => set({ status: 'online' }),
      setRealTripId: (id)  => set({ realTripId: id }),
      setOfferId:    (id)  => set({ currentOfferId: id }),
      setRouteWaypoints: (pts) => set({ routeWaypoints: pts }),

      setIncomingRide: (ride) => {
        stopRequestTimer()
        set({ status: 'has_request', incomingRide: ride, timerSeconds: 20 })
        let t = 20
        requestTimer = setInterval(() => {
          t -= 1
          set({ timerSeconds: Math.max(0, t) })
          if (t <= 0 || get().status !== 'has_request') {
            stopRequestTimer()
            if (get().status === 'has_request') {
              const offerId = get().currentOfferId
              set({ status: 'online', incomingRide: null, realTripId: null, currentOfferId: null })
              // Signale l'expiration à Supabase (fire-and-forget)
              if (offerId) {
                supabase.rpc('advance_trip_offer', {
                  p_offer_id: offerId,
                  p_status:   'expired',
                }).catch(console.warn)
              }
            }
          }
        }, 1000)
      },

      nextStep: () => set((s) => ({
        registrationStep: Math.min(s.registrationStep + 1, 3) as 1 | 2 | 3,
      })),
      prevStep: () => set((s) => ({
        registrationStep: Math.max(s.registrationStep - 1, 1) as 1 | 2 | 3,
      })),
      updateForm: (field, value) => set((s) => ({
        formData: { ...s.formData, [field]: value },
      })),
      setPhoto: (uri) => set((s) => ({
        formData: { ...s.formData, photoUri: uri },
      })),

      submitRegistration: () => {
        set({ registrationStatus: 'pending' })
      },

      approveRegistration: () => set({ registrationStatus: 'approved', status: 'offline' }),

      // ─── Realtime subscription ──────────────────────────────────────
      subscribeToOffers: () => {
        // Évite les doublons
        if (offersChannel) return

        supabase.auth.getUser().then(({ data }) => {
          if (!data.user) return
          const uid = data.user.id

          offersChannel = supabase
            .channel(`driver-offers-${uid}`)
            .on(
              'postgres_changes',
              {
                event:  'INSERT',
                schema: 'public',
                table:  'trip_offers',
                filter: `driver_id=eq.${uid}`,
              },
              async (payload) => {
                const offer = payload.new as {
                  id: string; trip_id: string; distance_m: number
                }
                // Évite de superposer une offre si déjà en ride
                const s = get()
                if (s.status !== 'online') return

                // Charge les détails de la course
                const { data: trip } = await supabase
                  .from('trips')
                  .select(`
                    id, trip_code, from_address, from_lat, from_lng,
                    to_address, to_lat, to_lng,
                    distance_km, duration_min, price, vehicle_type, payment_method,
                    passenger_id,
                    passengers!inner ( profiles!inner ( full_name, phone, rating:passengers(rating) ) )
                  `)
                  .eq('id', offer.trip_id)
                  .single()

                if (!trip) return

                // Charge le profil passager séparément pour éviter les joins imbriqués complexes
                const { data: passengerProfile } = await supabase
                  .from('profiles')
                  .select('full_name, phone')
                  .eq('id', trip.passenger_id)
                  .single()

                const { data: passengerData } = await supabase
                  .from('passengers')
                  .select('rating')
                  .eq('id', trip.passenger_id)
                  .single()

                const rideOffer: RideOffer = {
                  offerId:         offer.id,
                  tripId:          trip.id,
                  tripCode:        trip.trip_code,
                  from: {
                    name:    trip.from_address,
                    address: trip.from_address,
                    lat:     trip.from_lat,
                    lng:     trip.from_lng,
                  },
                  to: {
                    name:    trip.to_address,
                    address: trip.to_address,
                    lat:     trip.to_lat,
                    lng:     trip.to_lng,
                  },
                  distanceKm:      trip.distance_km ?? (offer.distance_m / 1000),
                  durationMin:     trip.duration_min ?? 0,
                  price:           trip.price ?? 0,
                  vehicleType:     trip.vehicle_type ?? 'economique',
                  paymentMethod:   trip.payment_method ?? 'cash',
                  passengerName:   passengerProfile?.full_name ?? '',
                  passengerPhone:  passengerProfile?.phone ?? '',
                  passengerRating: passengerData?.rating ?? 5.0,
                }

                get().setIncomingRide(rideOffer)
                get().setRealTripId(offer.trip_id)
                get().setOfferId(offer.id)
              },
            )
            .subscribe()
        })
      },

      unsubscribeFromOffers: () => {
        if (offersChannel) {
          supabase.removeChannel(offersChannel)
          offersChannel = null
        }
        stopRequestTimer()
      },

      // ─── Actions du chauffeur ───────────────────────────────────────
      goOnline: () => {
        stopRequestTimer()
        set({ status: 'online' })
        // Met à jour le statut dans Supabase
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) {
            supabase.from('drivers').update({ status: 'online' }).eq('id', data.user.id).catch(console.warn)
          }
        })
        get().subscribeToOffers()
      },

      goOffline: () => {
        stopRequestTimer()
        get().unsubscribeFromOffers()
        set({ status: 'offline', incomingRide: null, routeWaypoints: null })
        // Met à jour le statut dans Supabase
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) {
            supabase.from('drivers').update({ status: 'offline' }).eq('id', data.user.id).catch(console.warn)
          }
        })
      },

      clearRequestTimer: () => stopRequestTimer(),

      acceptRide: () => {
        stopRequestTimer()
        const { currentOfferId, incomingRide } = get()
        set((s) => ({
          status:      'going_to_pickup',
          activeRide:  s.incomingRide,
          incomingRide: null,
        }))
        // Notifie Supabase de l'acceptation
        if (currentOfferId) {
          supabase
            .from('trip_offers')
            .update({ status: 'accepted', responded_at: new Date().toISOString() })
            .eq('id', currentOfferId)
            .then(({ error }) => {
              if (error) console.warn('[DriverStore] acceptRide update failed', error)
            })
        }
        // Met à jour le statut chauffeur et la course
        supabase.auth.getUser().then(({ data }) => {
          if (data.user && incomingRide) {
            Promise.all([
              supabase.from('drivers').update({ status: 'on_trip' }).eq('id', data.user.id),
              supabase.from('trips').update({ driver_id: data.user.id, status: 'accepted' }).eq('id', incomingRide.tripId),
            ]).catch(console.warn)
          }
        })
      },

      rejectRide: () => {
        stopRequestTimer()
        const { currentOfferId } = get()
        set({ status: 'online', incomingRide: null })
        if (currentOfferId) {
          supabase.rpc('advance_trip_offer', {
            p_offer_id: currentOfferId,
            p_status:   'rejected',
          }).catch(console.warn)
        }
      },

      startRide: () => {
        set({ status: 'on_ride' })
        const { realTripId } = get()
        if (realTripId) {
          supabase.from('trips')
            .update({ status: 'in_progress', started_at: new Date().toISOString() })
            .eq('id', realTripId)
            .catch(console.warn)
        }
      },

      completeRide: () => {
        stopRequestTimer()
        const { realTripId } = get()
        set({ status: 'online', activeRide: null, routeWaypoints: null })
        if (realTripId) {
          supabase.from('trips')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', realTripId)
            .catch(console.warn)
        }
      },
    }),
    {
      name: 'winrak-driver',
      storage: createJSONStorage(() => AsyncStorage),
      // registrationStatus persists so a reload (e.g. on language change) keeps an
      // approved driver in driver mode instead of bouncing back to signup.
      partialize: (s) => ({ sheService: s.sheService, registrationStatus: s.registrationStatus }),
    },
  ),
)
