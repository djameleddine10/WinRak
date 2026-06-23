import { useEffect } from 'react'
import { useMapStore, type AnimatedDriver } from '../store/mapStore'

const TICK_MS  = 2400   // update every 2.4 s
const STEP     = 0.00028  // ~25 m per tick (realistic city speed ~37 km/h)
const TURN_P   = 0.25   // 25% chance to change direction each tick
const BOUNDS   = 0.035  // keep drivers within ~3.5 km of Algiers center

const CENTER = { lat: 36.7538, lng: 3.0588 }

// Moves mock drivers on the home map continuously so the map feels alive.
// Each driver follows a random walk; direction changes stochastically.
// Stops when the component that called the hook unmounts.
export function useDriverAnimation() {
  const setMapDrivers = useMapStore((s) => s.setMapDrivers)

  useEffect(() => {
    const iv = setInterval(() => {
      setMapDrivers(
        useMapStore.getState().mapDrivers.map((d): AnimatedDriver => {
          let { dlat, dlng } = d

          // Stochastic turn
          if (Math.random() < TURN_P) {
            const angle = Math.random() * 2 * Math.PI
            dlat = Math.cos(angle) * STEP
            dlng = Math.sin(angle) * STEP
          }

          let newLat = d.lat + dlat
          let newLng = d.lng + dlng

          // Bounce back if straying too far from center
          if (Math.abs(newLat - CENTER.lat) > BOUNDS) { dlat = -dlat; newLat = d.lat + dlat }
          if (Math.abs(newLng - CENTER.lng) > BOUNDS) { dlng = -dlng; newLng = d.lng + dlng }

          const heading = ((Math.atan2(dlng, dlat) * 180) / Math.PI + 360) % 360

          return { ...d, lat: newLat, lng: newLng, heading, dlat, dlng }
        })
      )
    }, TICK_MS)

    return () => clearInterval(iv)
  }, [setMapDrivers])
}
