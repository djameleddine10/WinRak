import type { DistanceUnit } from '../store/settingsStore'

const KM_TO_MI = 0.621371

// Formats a distance given in kilometers according to the user's unit preference.
// e.g. formatDistance(12, 'km') -> "12 كم", formatDistance(12, 'mi') -> "7.5 ميل"
export function formatDistance(km: number, unit: DistanceUnit): string {
  if (unit === 'mi') {
    const mi = km * KM_TO_MI
    return `${mi.toFixed(1)} ميل`
  }
  return `${km} كم`
}
