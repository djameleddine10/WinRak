import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useMapStore } from '../store/mapStore'

// Loads online driver positions from Supabase and keeps them live via Realtime.
// Replaces useDriverAnimation on the passenger home map.
export function useRealMapDrivers() {
  const setRealDrivers   = useMapStore((s) => s.setRealDrivers)
  const updateRealDriver = useMapStore((s) => s.updateRealDriver)
  const removeDriver     = useMapStore((s) => s.removeDriver)

  useEffect(() => {
    let mounted = true

    // Initial snapshot: drivers who sent a GPS ping in the last 15 minutes
    async function load() {
      const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from('driver_locations')
        .select('driver_id, lat, lng, heading, updated_at')
        .gte('updated_at', cutoff)

      if (mounted && data?.length) {
        setRealDrivers(
          data.map((r) => ({
            id:      r.driver_id,
            lat:     r.lat,
            lng:     r.lng,
            heading: r.heading ?? 0,
          }))
        )
      }
    }
    load()

    // Realtime: driver moves → update position; driver goes offline → remove from map
    const channel = supabase
      .channel('home-map-drivers')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'driver_locations' },
        (payload) => {
          const r = payload.new as { driver_id: string; lat: number; lng: number; heading: number }
          updateRealDriver(r.driver_id, r.lat, r.lng, r.heading ?? 0)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'driver_locations' },
        (payload) => {
          const r = payload.new as { driver_id: string; lat: number; lng: number; heading: number }
          updateRealDriver(r.driver_id, r.lat, r.lng, r.heading ?? 0)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'drivers', filter: "status=eq.offline" },
        (payload) => {
          const r = payload.new as { id: string; status: string }
          if (r.status === 'offline') removeDriver(r.id)
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])
}
