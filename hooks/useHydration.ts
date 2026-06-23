import { useEffect, useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useUserStore } from '../store/userStore'
import { useDriverStore } from '../store/driverStore'

type Hydratable = {
  persist: {
    hasHydrated: () => boolean
    onFinishHydration: (fn: () => void) => () => void
  }
}

const stores: Hydratable[] = [useSettingsStore, useUserStore, useDriverStore]

// True once every persisted store has rehydrated from async-storage. The root layout
// gates the first paint on this so the saved theme/photo/SHE values don't flash their
// in-memory defaults before async-storage resolves.
export function useHydration() {
  const [hydrated, setHydrated] = useState(() =>
    stores.every((s) => s.persist.hasHydrated()),
  )

  useEffect(() => {
    if (hydrated) return
    const check = () => {
      if (stores.every((s) => s.persist.hasHydrated())) setHydrated(true)
    }
    const unsubs = stores.map((s) => s.persist.onFinishHydration(check))
    check() // covers the case where hydration already finished before this effect ran
    return () => unsubs.forEach((u) => u())
  }, [hydrated])

  return hydrated
}
