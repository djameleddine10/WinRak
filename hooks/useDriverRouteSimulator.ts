import { useEffect, useMemo, useRef, useState } from 'react'
import type { LatLng } from '../mock/map'

interface SimResult {
  position: LatLng
  heading:  number
  progress: number
}

const TICK_MS = 900

function computeHeading(a: LatLng, b: LatLng): number {
  const dLng = b.lng - a.lng
  const dLat = b.lat - a.lat
  return ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360
}

// Animates a car along a given route (waypoints array).
// Call with active=false to pause. When waypoints is null the car
// stays at the first provided fallback position.
export function useDriverRouteSimulator(
  waypoints: Array<LatLng> | null,
  active = true,
): SimResult {
  const [index, setIndex] = useState(0)
  const idxRef = useRef(0)

  // Reset when route changes (new ride accepted)
  useEffect(() => {
    idxRef.current = 0
    setIndex(0)
  }, [waypoints])

  useEffect(() => {
    if (!active || !waypoints || waypoints.length < 2) return
    const iv = setInterval(() => {
      idxRef.current = Math.min(idxRef.current + 1, waypoints.length - 1)
      setIndex(idxRef.current)
      if (idxRef.current >= waypoints.length - 1) clearInterval(iv)
    }, TICK_MS)
    return () => clearInterval(iv)
  }, [active, waypoints])

  return useMemo(() => {
    if (!waypoints || waypoints.length === 0) {
      return { position: { lat: 36.7538, lng: 3.0588 }, heading: 0, progress: 0 }
    }
    const i   = Math.min(index, waypoints.length - 1)
    const pos = waypoints[i]
    const next = waypoints[Math.min(i + 1, waypoints.length - 1)]
    return {
      position: pos,
      heading:  computeHeading(pos, next),
      progress: i / (waypoints.length - 1),
    }
  }, [index, waypoints])
}
