import { useEffect, useRef, useState } from 'react'
import { useMapStore } from '../store/mapStore'
import { useRideStore } from '../store/rideStore'
import { mockRoutePoints } from '../mock/map'
import type { LatLng } from '../mock/map'

interface UseRideSimulatorResult {
  currentPoint: LatLng
  progress:     number
}

const TICK_MS = 800  // update every 800 ms → smooth car movement

// Linearly interpolates between all mockRoutePoints to produce a dense path.
// This gives the map car a fluid motion instead of jumping between 5 fixed coords.
function buildDensePath(pts: LatLng[], stepsPerSegment = 6): LatLng[] {
  if (pts.length < 2) return pts
  const path: LatLng[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    for (let s = 0; s < stepsPerSegment; s++) {
      const t = s / stepsPerSegment
      path.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t })
    }
  }
  path.push(pts[pts.length - 1])
  return path
}

const DENSE_PATH = buildDensePath(mockRoutePoints, 6)  // ~162 points

// Moves a simulated car along the dense path, updating mapStore every TICK_MS.
// Stops automatically when the ride status becomes 'completed'.
export function useRideSimulator(active = true): UseRideSimulatorResult {
  const setDriverLocation = useMapStore((s) => s.setDriverLocation)
  const status            = useRideStore((s) => s.status)
  const [index, setIndex] = useState(0)
  const idxRef            = useRef(0)

  useEffect(() => {
    if (!active || status === 'completed') return
    const iv = setInterval(() => {
      idxRef.current = Math.min(idxRef.current + 1, DENSE_PATH.length - 1)
      setIndex(idxRef.current)
      setDriverLocation(DENSE_PATH[idxRef.current])
      if (idxRef.current >= DENSE_PATH.length - 1) clearInterval(iv)
    }, TICK_MS)
    return () => clearInterval(iv)
  }, [active, status, setDriverLocation])

  return {
    currentPoint: DENSE_PATH[index],
    progress:     index / (DENSE_PATH.length - 1),
  }
}
