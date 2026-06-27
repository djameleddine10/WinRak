import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { mockRides } from '../mock/rides'
import { supabase } from '../lib/supabase'
import { uploadDocument } from '../services/documents.service'

type DriverStatus =
  | 'offline' | 'online' | 'has_request'
  | 'going_to_pickup' | 'on_ride'

type DriverRegistrationStatus =
  | 'not_started' | 'pending' | 'approved' | 'rejected'

type VehicleMode = 'vtc' | 'moto'

interface DriverFormData {
  firstName:           string
  lastName:            string
  birthDate:           string
  birthPlace:          string
  licenseNumber:       string
  licenseExpiry:       string
  grayCardNumber:      string
  vehicleType:         string
  vehicleBrand:        string
  vehicleColor:        string
  vehicleYear:         string
  vehiclePlate:        string
  photoUri:            string | null   // selfie
  licensePhotoUri:     string | null   // permis
  grayCardPhotoUri:    string | null   // carte_grise
  vehicleFrontUri:     string | null   // vehicle_front
  vehicleRearUri:      string | null   // vehicle_rear
  pieceIdentiteUri:    string | null   // moto uniquement
}

interface DriverStore {
  status:             DriverStatus
  registrationStatus: DriverRegistrationStatus
  registrationStep:   1 | 2 | 3
  driverType:         'city' | null
  vehicleMode:        VehicleMode
  sheService:         boolean
  incomingRide:       typeof mockRides[0] | null
  activeRide:         typeof mockRides[0] | null
  realTripId:         string | null
  currentOfferId:     string | null
  routeWaypoints:     Array<{ lat: number; lng: number }> | null
  timerSeconds:       number
  formData:           DriverFormData

  setDriverType:      (type: 'city') => void
  setVehicleMode:     (mode: VehicleMode) => void
  setSheService:      (val: boolean) => void
  setOnline:          () => void
  setRealTripId:      (id: string | null) => void
  setOfferId:         (id: string | null) => void
  setIncomingRide:    (ride: typeof mockRides[0]) => void
  setRouteWaypoints:  (pts: Array<{ lat: number; lng: number }> | null) => void
  nextStep:              () => void
  prevStep:              () => void
  updateForm:            (field: keyof DriverFormData, value: string) => void
  setPhoto:              (uri: string) => void
  setDocPhoto:           (field: keyof Pick<DriverFormData, 'licensePhotoUri' | 'grayCardPhotoUri' | 'vehicleFrontUri' | 'vehicleRearUri' | 'pieceIdentiteUri'>, uri: string) => void
  submitRegistration:    (userIdHint: string) => Promise<void>
  setRegistrationStatus: (status: DriverRegistrationStatus) => void
  goOnline:           () => void
  goOffline:          () => void
  simulateRequest:    () => void
  acceptRide:         () => void
  rejectRide:         () => void
  startRide:          () => void
  completeRide:       () => void
  clearRequestTimer:  () => void
}

// A single shared handle for the request countdown. Keeping it module-scoped (not
// in state) guarantees only ONE timer can ever run: every start clears the previous
// one, so repeated "simulate" taps or fast screen exits can't stack intervals.
let requestTimer: ReturnType<typeof setInterval> | null = null
let autoRequeue:  ReturnType<typeof setTimeout>  | null = null
function stopRequestTimer() {
  if (requestTimer) { clearInterval(requestTimer); requestTimer = null }
  if (autoRequeue)  { clearTimeout(autoRequeue);   autoRequeue  = null }
}

// Only the WinRak SHE service flag persists (it's a registration preference). Live
// ride/session status stays in-memory and resets to offline on restart.
export const useDriverStore = create<DriverStore>()(
  persist(
    (set, get) => ({
      status:             'offline',
      registrationStatus: 'not_started',
      registrationStep:   1,
      driverType:         null,
      vehicleMode:        'vtc',
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
        vehicleFrontUri: null, vehicleRearUri: null, pieceIdentiteUri: null,
      },

      setDriverType:  (type) => set({ driverType: type }),
      setVehicleMode: (mode) => set({ vehicleMode: mode }),
      setSheService:  (val) => set({ sheService: val }),

      setOnline:          () => set({ status: 'online' }),
      setRealTripId:      (id)  => set({ realTripId: id }),
      setOfferId:         (id)  => set({ currentOfferId: id }),
      setRouteWaypoints:  (pts) => set({ routeWaypoints: pts }),
      setIncomingRide: (ride) => {
        stopRequestTimer()
        set({ status: 'has_request', incomingRide: ride, timerSeconds: 20 })
        let t = 20
        requestTimer = setInterval(() => {
          t -= 1
          set({ timerSeconds: Math.max(0, t) })
          if (t <= 0 || get().status !== 'has_request') {
            stopRequestTimer()
            // Only auto-expire if the driver is still staring at the request.
            // If they accepted/rejected, status already changed — leave it alone.
            if (get().status === 'has_request') {
              set({ status: 'online', incomingRide: null, realTripId: null, currentOfferId: null })
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

      setDocPhoto: (field, uri) => set((s) => ({
        formData: { ...s.formData, [field]: uri },
      })),

      // ─── submitRegistration ───────────────────────────────────────────────────
      // 1. Upsert row dans drivers avec registration_status='pending'
      // 2. Upload chaque photo collectée via uploadDocument
      // 3. Met à jour registrationStatus local → 'pending'
      submitRegistration: async (userIdHint: string) => {
        const { formData } = get()

        // Toujours vérifier via Supabase Auth — source de vérité absolue
        const { data: { user: authUser } } = await supabase.auth.getUser()
        const userId = authUser?.id ?? userIdHint
        if (!userId) throw new Error('no_auth')

        // 1. Upsert drivers row
        const dbVehicleType = formData.vehicleType === 'moto' ? 'moto' : 'economique'

        const { error: driverErr } = await supabase
          .from('drivers')
          .upsert(
            {
              id:                  userId,
              user_id:             userId,
              vehicle_type:        dbVehicleType,
              vehicle_brand:       formData.vehicleBrand || null,
              vehicle_color:       formData.vehicleColor || null,
              vehicle_plate:       formData.vehiclePlate || null,
              registration_status: 'pending',
              is_verified:         false,
              status:              'offline',
            },
            { onConflict: 'id' }
          )
        if (driverErr) throw driverErr

        // 2. Upload les photos collectées
        type DocUpload = { uri: string | null; type: import('../lib/supabase').DocType }
        const docs: DocUpload[] = [
          { uri: formData.photoUri,         type: 'selfie' },
          { uri: formData.licensePhotoUri,  type: 'permis' },
          { uri: formData.grayCardPhotoUri, type: 'carte_grise' },
          { uri: formData.vehicleFrontUri,  type: 'vehicle_front' },
          { uri: formData.vehicleRearUri,   type: 'vehicle_rear' },
          { uri: formData.pieceIdentiteUri, type: 'piece_identite' },
        ]

        await Promise.allSettled(
          docs
            .filter((d) => d.uri !== null)
            .map((d) =>
              uploadDocument({ driverId: userId, type: d.type, uri: d.uri! })
            )
        )

        // 3. Mettre à jour l'état local
        set({ registrationStatus: 'pending' })
      },

      setRegistrationStatus: (status) => set({ registrationStatus: status }),

      goOnline: () => {
        stopRequestTimer()
        set({ status: 'online' })
      },
      goOffline: () => {
        stopRequestTimer()
        set({ status: 'offline', incomingRide: null, routeWaypoints: null })
      },

      clearRequestTimer: () => stopRequestTimer(),

      simulateRequest: () => {
        // Guard: never stack a request on top of an existing one.
        if (get().status !== 'online') return
        stopRequestTimer()
        set({ status: 'has_request', incomingRide: mockRides[0], timerSeconds: 20 })
        let t = 20
        requestTimer = setInterval(() => {
          t -= 1
          set({ timerSeconds: Math.max(0, t) })
          if (t <= 0 || get().status !== 'has_request') {
            stopRequestTimer()
            if (get().status === 'has_request') {
              set({ status: 'online', incomingRide: null })
              // No auto-requeue loop here — a mock requeue every few seconds
              // is what caused phantom navigation. The driver re-triggers manually.
            }
          }
        }, 1000)
      },

      acceptRide: () => {
        stopRequestTimer()
        set((s) => ({
          status: 'going_to_pickup',
          activeRide: s.incomingRide,
          incomingRide: null,
        }))
      },
      rejectRide: () => {
        stopRequestTimer()
        set({ status: 'online', incomingRide: null })
      },
      startRide:    () => set({ status: 'on_ride' }),
      completeRide: () => {
        stopRequestTimer()
        set({ status: 'online', activeRide: null, routeWaypoints: null })
      },
    }),
    {
      name: 'winrak-driver',
      storage: createJSONStorage(() => AsyncStorage),
      // registrationStatus persists so a reload (e.g. on language change) keeps an
      // approved driver in driver mode instead of bouncing back to signup.
      partialize: (s) => ({
        sheService:         s.sheService,
        registrationStatus: s.registrationStatus,
        vehicleMode:        s.vehicleMode,
      }),
    },
  ),
)
