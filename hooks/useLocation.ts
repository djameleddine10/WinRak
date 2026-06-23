import { useEffect, useState } from 'react'
import * as Location from 'expo-location'
import { useMapStore } from '../store/mapStore'
import { ALGIERS_CENTER } from '../mock/map'

interface UseLocationResult {
  location: { lat: number; lng: number }
  errorMsg: string | null
  loading: boolean
}

// Requests foreground permission, fetches one position, updates mapStore.
// Falls back to ALGIERS_CENTER (mock) if denied or unavailable.
export function useLocation(): UseLocationResult {
  const setUserLocation = useMapStore((s) => s.setUserLocation)
  const userLocation = useMapStore((s) => s.userLocation)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          if (!cancelled) {
            setErrorMsg('تعذر تحديد موقعك — تم استخدام موقع افتراضي')
            setUserLocation(ALGIERS_CENTER)
            setLoading(false)
          }
          return
        }
        const pos = await Location.getCurrentPositionAsync({})
        if (!cancelled) {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setErrorMsg('تعذر تحديد موقعك')
          setUserLocation(ALGIERS_CENTER)
          setLoading(false)
        }
      }
    })()
    return () => { cancelled = true }
  }, [setUserLocation])

  return { location: userLocation, errorMsg, loading }
}
