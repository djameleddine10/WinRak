// ───────────────────────────────────────────────────────────────────────────
//  WebMap — version WEB (navigateur uniquement).
//  react-native-maps n'existe pas sur le web (code natif). Cette version
//  affiche une carte Google Maps via l'API JavaScript, avec la MÊME interface
//  de props que WebMap.tsx (mobile). Metro choisit ce fichier automatiquement
//  pour la cible web grâce au suffixe `.web.tsx`.
//
//  But : permettre de TESTER toutes les autres écrans dans le navigateur.
//  La vraie app (Android/iOS) utilise toujours WebMap.tsx natif.
// ───────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import { GOOGLE_MAPS_KEY } from '../../constants/config'
import { useColors, useResolvedScheme } from '../../hooks/useColors'
import { ALGIERS_CENTER, type LatLng } from '../../mock/map'

export interface MapMarker {
  lat:      number
  lng:      number
  heading?: number
  type?:    'car' | 'pin' | 'dest' | 'pickup' | 'dropoff'
  color?:   string
}

interface WebMapProps {
  center?:                LatLng
  zoom?:                  number
  markers?:               MapMarker[]
  route?:                 LatLng[]
  showUser?:              boolean
  flyToLocation?:         { lat: number; lng: number } | null
  variant?:               'explore' | 'navigation'
  style?:                 any
  onRegionChange?:        () => void
  onRegionChangeComplete?:(lat: number, lng: number) => void
}

const FILL = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 }

// Charge le script Google Maps JS une seule fois (promesse partagée).
let mapsPromise: Promise<void> | null = null
function loadGoogleMaps(key: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if ((window as any).google?.maps) return Promise.resolve()
  if (mapsPromise) return mapsPromise
  mapsPromise = new Promise<void>((resolve, reject) => {
    if (!key) { reject(new Error('no maps key')); return }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}`
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('maps load failed'))
    document.head.appendChild(s)
  })
  return mapsPromise
}

export function WebMap({
  center   = ALGIERS_CENTER,
  zoom     = 14,
  markers  = [],
  route    = [],
  flyToLocation,
  style,
  onRegionChangeComplete,
}: WebMapProps) {
  const Colors    = useColors()
  const scheme    = useResolvedScheme()
  const dark      = scheme === 'dark'
  const divRef    = useRef<HTMLDivElement | null>(null)
  const mapRef    = useRef<any>(null)
  const overlays  = useRef<any[]>([])

  // Init de la carte
  useEffect(() => {
    let cancelled = false
    loadGoogleMaps(GOOGLE_MAPS_KEY)
      .then(() => {
        if (cancelled || !divRef.current) return
        const g = (window as any).google
        mapRef.current = new g.maps.Map(divRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom,
          disableDefaultUI: true,
          styles: dark ? DARK_STYLE : [],
        })
        if (onRegionChangeComplete) {
          mapRef.current.addListener('idle', () => {
            const c = mapRef.current.getCenter()
            onRegionChangeComplete(c.lat(), c.lng())
          })
        }
      })
      .catch(() => { /* clé absente / hors-ligne : carte grise, le reste marche */ })
    return () => { cancelled = true }
  }, [dark])

  // Markers + route
  useEffect(() => {
    const g = (window as any).google
    if (!g?.maps || !mapRef.current) return
    overlays.current.forEach((o) => o.setMap?.(null))
    overlays.current = []

    markers.forEach((m) => {
      const mk = new g.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: mapRef.current,
      })
      overlays.current.push(mk)
    })

    if (route.length > 1) {
      const line = new g.maps.Polyline({
        path: route.map((p) => ({ lat: p.lat, lng: p.lng })),
        strokeColor: Colors.gold,
        strokeWeight: 5,
        map: mapRef.current,
      })
      overlays.current.push(line)
      const bounds = new g.maps.LatLngBounds()
      route.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }))
      mapRef.current.fitBounds(bounds, 60)
    }
  }, [markers, route])

  // Fly-to
  useEffect(() => {
    if (!flyToLocation || !mapRef.current) return
    mapRef.current.panTo({ lat: flyToLocation.lat, lng: flyToLocation.lng })
    mapRef.current.setZoom(16)
  }, [flyToLocation?.lat, flyToLocation?.lng])

  return (
    <View style={[FILL, style]}>
      {/* @ts-ignore — div web natif */}
      <div ref={divRef} style={{ position: 'absolute', inset: 0, background: dark ? '#0f1120' : '#f5f5f5' }} />
    </View>
  )
}

const DARK_STYLE = [
  { elementType: 'geometry',           stylers: [{ color: '#0f1120' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1120' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#8a8a9a' }] },
  { featureType: 'road',  elementType: 'geometry', stylers: [{ color: '#252540' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050916' }] },
]
