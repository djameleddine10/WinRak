import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { mockRides } from '../mock/rides'

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

interface DriverStore {
  status:             DriverStatus
  registrationStatus: DriverRegistrationStatus
  registrationStep:   1 | 2 | 3
  driverType:         'city' | null
  sheService:         boolean
  incomingRide:       typeof mockRides[0] | null
  activeRide:         typeof mockRides[0] | null
  realTripId:         string | null
  currentOfferId:     string | null
  routeWaypoints:     Array<{ lat: number; lng: number }> | null
  timerSeconds:       number
  formData:           DriverFormData

  setDriverType:      (type: 'city') => void
  setSheService:      (val: boolean) => void
  setOnline:          () => void
  setRealTripId:      (id: string | null) => void
  setOfferId:         (id: string | null) => void
  setIncomingRide:    (ride: typeof mockRides[0]) => void
  setRouteWaypoints:  (pts: Array<{ lat: number; lng: number }> | null) => void
  nextStep:           () => void
  prevStep:           () => void
  updateForm:         (field: keyof DriverFormData, value: string) => void
  setPhoto:           (uri: string) => void
  submitRegistration: () => void
  approveRegistration: () => void
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

      submitRegistration: () => {
        set({ registrationStatus: 'pending' })
      },

      // Mock shortcut: skip the 24-48h review and become an approved driver.
      approveRegistration: () => set({ registrationStatus: 'approved', status: 'offline' }),

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
      partialize: (s) => ({ sheService: s.sheService, registrationStatus: s.registrationStatus }),
    },
  ),
)
