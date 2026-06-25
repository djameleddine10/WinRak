import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { supabase } from '../lib/supabase'
import { RefreshCw, Car, Users, Route, Wifi, WifiOff } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriverOnMap {
  id: string
  full_name: string
  phone: string
  status: 'online' | 'offline' | 'on_trip'
  current_lat: number | null
  current_lng: number | null
  vehicle_type: string | null
  vehicle_plate: string | null
  rating: number | null
}

interface RideOnMap {
  id: string
  passenger_id: string
  driver_id: string | null
  from_lat: number
  from_lng: number
  from_address: string
  to_lat: number
  to_lng: number
  to_address: string
  status: string
  price: number | null
  distance_km: number | null
  passenger_name: string
  driver_name: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GMAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
const ALGERIA = { lat: 28.0339, lng: 1.6596 }

const DRIVER_COLOR: Record<string, string> = {
  online:   '#22C55E',
  on_trip:  '#F59E0B',
  offline:  '#6B7280',
}

const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry',            stylers: [{ color: '#111118' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#111118' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#6B7280' }] },
  { featureType: 'road',               elementType: 'geometry',        stylers: [{ color: '#1E1E2E' }] },
  { featureType: 'road',               elementType: 'geometry.stroke', stylers: [{ color: '#16161E' }] },
  { featureType: 'road.highway',       elementType: 'geometry',        stylers: [{ color: '#2C2C3E' }] },
  { featureType: 'road.highway',       elementType: 'labels.text.fill',stylers: [{ color: '#9CA3AF' }] },
  { featureType: 'water',              elementType: 'geometry',        stylers: [{ color: '#0A0A14' }] },
  { featureType: 'water',              elementType: 'labels.text.fill',stylers: [{ color: '#374151' }] },
  { featureType: 'administrative',     elementType: 'geometry.stroke', stylers: [{ color: '#374151' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9CA3AF' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#6B7280' }] },
  { featureType: 'poi',                stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',            stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape',          elementType: 'geometry',        stylers: [{ color: '#0D0D1A' }] },
]

function markerSvg(color: string, letter: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
      </filter>
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24S32 26 32 16C32 7.163 24.837 0 16 0z"
        fill="${color}" filter="url(#s)"/>
      <circle cx="16" cy="16" r="9" fill="rgba(0,0,0,0.3)"/>
      <text x="16" y="20.5" text-anchor="middle" font-family="Inter,sans-serif"
        font-size="10" font-weight="700" fill="white">${letter}</text>
    </svg>`
}

function passengerSvg(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill="#3B82F6" stroke="white" stroke-width="2"/>
      <text x="14" y="18.5" text-anchor="middle" font-family="Inter,sans-serif"
        font-size="11" font-weight="700" fill="white">P</text>
    </svg>`
}

function svgIcon(svg: string, w: number, h: number): google.maps.Icon {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(w, h),
    anchor: new google.maps.Point(w / 2, h),
  }
}

function infoHtml(rows: [string, string][], title: string, badge?: { text: string; color: string }): string {
  const badgeHtml = badge
    ? `<span style="background:${badge.color};color:#fff;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;">${badge.text}</span>`
    : ''
  const rowsHtml = rows
    .map(([k, v]) => `<tr><td style="color:#9CA3AF;padding:2px 8px 2px 0;font-size:12px;">${k}</td><td style="color:#F9FAFB;font-size:12px;font-weight:500;">${v}</td></tr>`)
    .join('')
  return `
    <div style="background:#1E1E2E;border-radius:8px;padding:12px 16px;min-width:200px;font-family:Inter,sans-serif;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="color:#F9FAFB;font-weight:700;font-size:14px;">${title}</span>
        ${badgeHtml}
      </div>
      <table>${rowsHtml}</table>
    </div>`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MapPage() {
  const containerRef    = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<google.maps.Map | null>(null)
  const infoRef         = useRef<google.maps.InfoWindow | null>(null)
  const driverMarkers   = useRef<Map<string, google.maps.Marker>>(new Map())
  const passengerMarkers= useRef<Map<string, google.maps.Marker>>(new Map())
  const polylines       = useRef<Map<string, google.maps.Polyline>>(new Map())

  const [mapReady,    setMapReady]    = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [drivers,     setDrivers]     = useState<DriverOnMap[]>([])
  const [activeRides, setActiveRides] = useState<RideOnMap[]>([])
  const [realtimeOk,  setRealtimeOk]  = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    // Live GPS lives in driver_locations; active rides live in trips.
    // Both are served by SECURITY DEFINER RPCs (see 20260625_map_live.sql)
    // so they bypass RLS and return the coordinates the map needs.
    const [{ data: driverData, error: dErr }, { data: tripData, error: tErr }] =
      await Promise.all([
        supabase.rpc('map_drivers'),
        supabase.rpc('map_active_trips'),
      ])

    if (dErr) console.warn('map_drivers:', dErr.message)
    if (tErr) console.warn('map_active_trips:', tErr.message)

    setDrivers(
      (driverData ?? []).map((d: any) => ({
        id: d.id,
        full_name: d.full_name ?? 'Chauffeur',
        phone: d.phone ?? '—',
        status: d.status ?? 'offline',
        current_lat: d.lat,
        current_lng: d.lng,
        vehicle_type: d.vehicle_type,
        vehicle_plate: d.vehicle_plate,
        rating: d.rating,
      }))
    )

    setActiveRides(
      (tripData ?? []).map((r: any) => ({
        id: r.id,
        passenger_id: r.passenger_id,
        driver_id: r.driver_id,
        from_lat: r.from_lat,
        from_lng: r.from_lng,
        from_address: r.from_address,
        to_lat: r.to_lat,
        to_lng: r.to_lng,
        to_address: r.to_address,
        status: r.status,
        price: r.price,
        distance_km: r.distance_km,
        passenger_name: r.passenger_name ?? 'Passager',
        driver_name: r.driver_name ?? null,
      }))
    )

    setLastRefresh(new Date())
    setLoading(false)
  }, [])

  // ── Init Google Maps ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return
    const loader = new Loader({ apiKey: GMAP_KEY, version: 'weekly' })
    loader.load().then((google) => {
      const map = new google.maps.Map(containerRef.current!, {
        center: ALGERIA,
        zoom: 6,
        styles: DARK_STYLE,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        backgroundColor: '#111118',
      })
      mapRef.current = map
      infoRef.current = new google.maps.InfoWindow({
        maxWidth: 280,
      })
      setMapReady(true)
    })
    fetchData()
  }, [fetchData])

  // ── Update driver markers ──────────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current

    const seen = new Set<string>()

    for (const d of drivers) {
      if (d.current_lat == null || d.current_lng == null) continue
      seen.add(d.id)

      const pos = { lat: d.current_lat, lng: d.current_lng }
      const color = DRIVER_COLOR[d.status] ?? DRIVER_COLOR.offline
      const letter = d.status === 'on_trip' ? 'C' : d.status === 'online' ? '✓' : '—'
      const icon = svgIcon(markerSvg(color, letter), 32, 40)

      let marker = driverMarkers.current.get(d.id)
      if (!marker) {
        marker = new google.maps.Marker({ map, position: pos, icon, zIndex: 10 })
        marker.addListener('click', () => {
          infoRef.current?.setContent(infoHtml(
            [
              ['Téléphone', d.phone],
              ['Véhicule', d.vehicle_type ?? '—'],
              ['Plaque', d.vehicle_plate ?? '—'],
              ['Note', d.rating ? `${d.rating} ★` : '—'],
            ],
            d.full_name,
            { text: statusLabel(d.status), color },
          ))
          infoRef.current?.open(map, marker)
        })
        driverMarkers.current.set(d.id, marker)
      } else {
        marker.setPosition(pos)
        marker.setIcon(icon)
      }
    }

    // Remove stale markers
    for (const [id, marker] of driverMarkers.current) {
      if (!seen.has(id)) {
        marker.setMap(null)
        driverMarkers.current.delete(id)
      }
    }

    // Auto-zoom to online drivers on first load
    if (!loading && drivers.filter(d => d.current_lat != null).length > 0) {
      const bounds = new google.maps.LatLngBounds()
      for (const d of drivers) {
        if (d.current_lat != null && d.current_lng != null) {
          bounds.extend({ lat: d.current_lat, lng: d.current_lng })
        }
      }
      if (!bounds.isEmpty()) map.fitBounds(bounds, 80)
    }
  }, [drivers, mapReady, loading])

  // ── Update ride polylines + passenger markers ──────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current

    const seen = new Set<string>()

    for (const ride of activeRides) {
      seen.add(ride.id)

      const pickup = { lat: ride.from_lat, lng: ride.from_lng }
      const dest   = { lat: ride.to_lat,   lng: ride.to_lng   }

      // Polyline
      let poly = polylines.current.get(ride.id)
      if (!poly) {
        poly = new google.maps.Polyline({
          path: [pickup, dest],
          geodesic: true,
          strokeColor: '#6366F1',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map,
          zIndex: 5,
        })
        poly.addListener('click', () => {
          const mid = midpoint(pickup, dest)
          infoRef.current?.setPosition(mid)
          infoRef.current?.setContent(infoHtml(
            [
              ['Course', ride.id.slice(0, 8) + '…'],
              ['Passager', ride.passenger_name],
              ['Chauffeur', ride.driver_name ?? '—'],
              ['Distance', ride.distance_km ? `${ride.distance_km} km` : '—'],
              ['Prix', ride.price ? `${ride.price.toLocaleString()} DZD` : '—'],
            ],
            'Course active',
            { text: ride.status === 'in_progress' ? 'En cours' : 'Acceptée', color: '#6366F1' },
          ))
          infoRef.current?.open(map)
        })
        polylines.current.set(ride.id, poly)
      } else {
        poly.setPath([pickup, dest])
      }

      // Passenger marker at pickup
      let pm = passengerMarkers.current.get(ride.id)
      if (!pm) {
        pm = new google.maps.Marker({
          map,
          position: pickup,
          icon: svgIcon(passengerSvg(), 28, 28),
          title: ride.passenger_name,
          zIndex: 8,
        })
        pm.addListener('click', () => {
          infoRef.current?.setContent(infoHtml(
            [
              ['Passager', ride.passenger_name],
              ['Départ', ride.from_address],
              ['Arrivée', ride.to_address],
            ],
            'Passager',
            { text: 'En course', color: '#3B82F6' },
          ))
          infoRef.current?.open(map, pm)
        })
        passengerMarkers.current.set(ride.id, pm)
      } else {
        pm.setPosition(pickup)
      }
    }

    // Remove stale
    for (const [id, poly] of polylines.current) {
      if (!seen.has(id)) { poly.setMap(null); polylines.current.delete(id) }
    }
    for (const [id, pm] of passengerMarkers.current) {
      if (!seen.has(id)) { pm.setMap(null); passengerMarkers.current.delete(id) }
    }
  }, [activeRides, mapReady])

  // ── Realtime subscriptions ─────────────────────────────────────────────────

  useEffect(() => {
    const ch = supabase
      .channel('map-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' },          fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' },             fetchData)
      .subscribe((status) => setRealtimeOk(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(ch) }
  }, [fetchData])

  // ── Derived stats ──────────────────────────────────────────────────────────

  const onlineDrivers  = drivers.filter(d => d.status === 'online').length
  const onTripDrivers  = drivers.filter(d => d.status === 'on_trip').length
  const activeRidesCnt = activeRides.length

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative overflow-hidden" style={{ height: '100vh' }}>

      {/* Map container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 bg-bg flex flex-col items-center justify-center gap-3 z-20">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted text-sm">Chargement de la carte…</p>
        </div>
      )}

      {/* Top-left legend */}
      <div className="absolute top-4 left-4 z-10 bg-surface/90 backdrop-blur border border-border rounded-xl p-3 shadow-card">
        <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Légende</p>
        <div className="space-y-1.5">
          <LegendItem color="#22C55E" label="Disponible" />
          <LegendItem color="#F59E0B" label="En course" />
          <LegendItem color="#6B7280" label="Hors ligne" />
          <LegendItem color="#3B82F6" label="Passager" circle />
          <LegendItem color="#6366F1" label="Trajet actif" line />
        </div>
      </div>

      {/* Top-right counters */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <StatChip icon={<Car size={14} />}   value={onlineDrivers}  label="disponibles" color="#22C55E" />
        <StatChip icon={<Car size={14} />}   value={onTripDrivers}  label="en course"   color="#F59E0B" />
        <StatChip icon={<Route size={14} />} value={activeRidesCnt} label="courses"     color="#6366F1" />
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-surface/90 backdrop-blur border border-border rounded-xl px-4 py-2 shadow-card">
        <div className="flex items-center gap-1.5">
          {realtimeOk
            ? <Wifi size={13} className="text-green-400" />
            : <WifiOff size={13} className="text-red-400" />}
          <span className="text-xs text-muted">{realtimeOk ? 'Temps réel actif' : 'Reconnexion…'}</span>
        </div>
        <span className="text-border">·</span>
        <span className="text-xs text-muted">
          Mis à jour {lastRefresh.toLocaleTimeString('fr-FR')}
        </span>
        <button
          onClick={() => { setLoading(true); fetchData() }}
          className="ml-1 p-1 rounded-md hover:bg-white/5 text-muted hover:text-text-primary transition-colors"
          title="Actualiser"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
        {drivers.filter(d => d.current_lat != null).length === 0 && !loading && (
          <>
            <span className="text-border">·</span>
            <div className="flex items-center gap-1.5">
              <Users size={13} className="text-muted" />
              <span className="text-xs text-muted">Aucun chauffeur en ligne</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LegendItem({
  color, label, circle = false, line = false,
}: { color: string; label: string; circle?: boolean; line?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {line ? (
        <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: color }} />
      ) : circle ? (
        <div className="w-3 h-3 rounded-full border-2 border-white/20" style={{ backgroundColor: color }} />
      ) : (
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
      )}
      <span className="text-xs text-muted">{label}</span>
    </div>
  )
}

function StatChip({
  icon, value, label, color,
}: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 bg-surface/90 backdrop-blur border border-border rounded-xl px-3 py-1.5 shadow-card">
      <span style={{ color }}>{icon}</span>
      <span className="text-sm font-bold text-text-primary">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusLabel(s: string): string {
  if (s === 'online')   return 'Disponible'
  if (s === 'on_trip')  return 'En course'
  return 'Hors ligne'
}

function midpoint(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): google.maps.LatLngLiteral {
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 }
}
