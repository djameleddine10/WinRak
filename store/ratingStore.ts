import { create } from 'zustand'

interface RatingStore {
  // Stars given by passenger → driver (set from passenger rating screen)
  driverRatingByPassenger: number | null
  // Stars given by driver → passenger (set from driver rating screen)
  passengerRatingByDriver: number | null

  setDriverRating:    (stars: number) => void
  setPassengerRating: (stars: number) => void
  reset:              () => void
}

// In-memory only — ratings reset on app restart like a real session.
export const useRatingStore = create<RatingStore>()((set) => ({
  driverRatingByPassenger:  null,
  passengerRatingByDriver:  null,

  setDriverRating:    (stars) => set({ driverRatingByPassenger: stars }),
  setPassengerRating: (stars) => set({ passengerRatingByDriver: stars }),
  reset: () => set({ driverRatingByPassenger: null, passengerRatingByDriver: null }),
}))
