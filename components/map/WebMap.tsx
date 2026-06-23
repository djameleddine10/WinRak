import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps'
import Svg, { Circle, Rect, Path, Ellipse } from 'react-native-svg'
import { type Palette } from '../../constants/colors'
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

function zoomToRegion(lat: number, lng: number, zoom: number) {
  const delta = 360 / Math.pow(2, zoom) * 0.5
  return { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta }
}

export function WebMap({
  center   = ALGIERS_CENTER,
  zoom     = 14,
  markers  = [],
  route    = [],
  showUser = false,
  flyToLocation,
  variant  = 'navigation',
  style,
  onRegionChange,
  onRegionChangeComplete,
}: WebMapProps) {
  const Colors = useColors()
  const scheme = useResolvedScheme()
  const mapRef = useRef<MapView>(null)
  const dark   = scheme === 'dark'

  const mapStyle = dark
    ? (variant === 'explore' ? DARK_EXPLORE_STYLE : DARK_NAV_STYLE)
    : (variant === 'explore' ? [] : [])

  // Smooth fly-to on locate button press
  useEffect(() => {
    if (!flyToLocation) return
    mapRef.current?.animateToRegion({
      latitude:       flyToLocation.lat,
      longitude:      flyToLocation.lng,
      latitudeDelta:  0.01,
      longitudeDelta: 0.01,
    }, 1000)
  }, [flyToLocation?.lat, flyToLocation?.lng])

  // Auto-fit camera to show full route
  useEffect(() => {
    if (route.length < 2) return
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        route.map((p) => ({ latitude: p.lat, longitude: p.lng })),
        { edgePadding: { top: 80, right: 60, bottom: 280, left: 60 }, animated: true },
      )
    }, 400)
    return () => clearTimeout(timer)
  }, [route.length])

  return (
    <View style={[FILL, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={FILL}
        initialRegion={zoomToRegion(center.lat, center.lng, zoom)}
        customMapStyle={mapStyle}
        showsUserLocation={showUser}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        toolbarEnabled={false}
        loadingEnabled
        loadingIndicatorColor={Colors.gold}
        loadingBackgroundColor={dark ? '#0f1120' : '#f5f5f5'}
        moveOnMarkerPress={false}
        onRegionChange={onRegionChange}
        onRegionChangeComplete={(r) => onRegionChangeComplete?.(r.latitude, r.longitude)}
      >
        {route.length > 1 && (
          <Polyline
            coordinates={route.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor={Colors.gold}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {markers.map((m, i) => (
          <Marker
            key={`${m.type ?? 'car'}-${i}`}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            anchor={m.type === 'car' ? { x: 0.5, y: 0.5 } : { x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <MarkerIcon m={m} Colors={Colors} />
          </Marker>
        ))}
      </MapView>
    </View>
  )
}

// ─── Marker icons ─────────────────────────────────────────────────────────────

function MarkerIcon({ m, Colors }: { m: MapMarker; Colors: Palette }) {
  const { type, heading, color } = m
  if (type === 'pickup')  return <PickupPin  dark={Colors.dark1} />
  if (type === 'dropoff') return <DropoffPin gold={Colors.gold}  />
  if (type === 'car')     return <CarIcon    heading={heading ?? 0} color={color ?? Colors.gold} />
  if (type === 'pin')     return <PinIcon    color={color ?? Colors.gold}    />
  if (type === 'dest')    return <PinIcon    color={color ?? Colors.success} />
  return <CarIcon heading={heading ?? 0} color={color ?? Colors.gold} />
}

function PickupPin({ dark }: { dark: string }) {
  // Clean teardrop location pin with a concentric ring — no figure, just an
  // elegant "pickup point" marker (Uber/Google style). Drawn dark on a white
  // disc so it reads on both light and dark map tiles.
  return (
    <Svg width={40} height={52} viewBox="0 0 40 52">
      {/* soft ground shadow */}
      <Ellipse cx="20" cy="49" rx="6" ry="2.2" fill="rgba(0,0,0,0.18)" />
      {/* teardrop body */}
      <Path
        d="M20 1 C10.6 1 3 8.6 3 18 C3 30 20 46 20 46 C20 46 37 30 37 18 C37 8.6 29.4 1 20 1 Z"
        fill="white"
        stroke="rgba(0,0,0,0.10)"
        strokeWidth="1"
      />
      {/* concentric mark */}
      <Circle cx="20" cy="18" r="9" fill={dark} />
      <Circle cx="20" cy="18" r="3.4" fill="white" />
    </Svg>
  )
}

function DropoffPin({ gold }: { gold: string }) {
  // Matching teardrop in brand gold for the destination.
  return (
    <Svg width={40} height={52} viewBox="0 0 40 52">
      <Ellipse cx="20" cy="49" rx="6" ry="2.2" fill="rgba(0,0,0,0.18)" />
      <Path
        d="M20 1 C10.6 1 3 8.6 3 18 C3 30 20 46 20 46 C20 46 37 30 37 18 C37 8.6 29.4 1 20 1 Z"
        fill={gold}
        stroke="rgba(0,0,0,0.10)"
        strokeWidth="1"
      />
      <Circle cx="20" cy="18" r="9" fill="white" />
      <Circle cx="20" cy="18" r="3.4" fill={gold} />
    </Svg>
  )
}

function CarIcon({ heading, color }: { heading: number; color: string }) {
  // Modern realistic top-down car (Google-Maps style) tinted in the WinRak
  // brand colour: smooth curved body, tinted windshields front & rear, a
  // lighter roof highlight, side-mirror nubs, red tail-lights and a soft
  // ground shadow. The nose points up (heading 0) and rotates along the route.
  const dark = '#2b3440'       // glass / tyres
  const glass = '#33415a'      // windshield tint
  return (
    <Svg
      width={46}
      height={46}
      viewBox="-23 -23 46 46"
      style={{ transform: [{ rotate: `${heading}deg` }] }}
    >
      {/* soft ground shadow */}
      <Ellipse cx="0.5" cy="2" rx="11.5" ry="18" fill="rgba(0,0,0,0.22)" />

      {/* side mirrors */}
      <Ellipse cx="-9.5" cy="-3" rx="2" ry="1.4" fill={color} />
      <Ellipse cx="9.5"  cy="-3" rx="2" ry="1.4" fill={color} />

      {/* tyres */}
      <Rect x="-9.6" y="-10" width="2.6" height="6" rx="1.3" fill={dark} />
      <Rect x="7"    y="-10" width="2.6" height="6" rx="1.3" fill={dark} />
      <Rect x="-9.6" y="5"   width="2.6" height="6" rx="1.3" fill={dark} />
      <Rect x="7"    y="5"   width="2.6" height="6" rx="1.3" fill={dark} />

      {/* body — teardrop-ish silhouette, wider at the rear */}
      <Path
        d="M0 -16
           C5 -16 7.6 -13.5 8 -9
           C8.4 -4 8.6 4 8.2 9.5
           C7.9 13.5 5 16 0 16
           C-5 16 -7.9 13.5 -8.2 9.5
           C-8.6 4 -8.4 -4 -8 -9
           C-7.6 -13.5 -5 -16 0 -16 Z"
        fill={color}
        stroke="rgba(0,0,0,0.20)"
        strokeWidth="0.7"
      />

      {/* subtle roof highlight (a soft brand-tinted gloss, not a big patch) */}
      <Path
        d="M0 -5.5 C3 -5.5 4.4 -4 4.6 0 C4.4 4 3 5.5 0 5.5 C-3 5.5 -4.4 4 -4.6 0 C-4.4 -4 -3 -5.5 0 -5.5 Z"
        fill="rgba(255,255,255,0.12)"
      />

      {/* front windshield (nose) */}
      <Path d="M-5 -12 C-2 -13.4 2 -13.4 5 -12 L3.4 -7.5 C1.2 -8.4 -1.2 -8.4 -3.4 -7.5 Z" fill={glass} />
      {/* rear windshield */}
      <Path d="M-4.6 12 C-2 13.2 2 13.2 4.6 12 L3.2 8 C1.1 8.8 -1.1 8.8 -3.2 8 Z" fill={glass} />

      {/* tail-lights */}
      <Rect x="-6.2" y="13.4" width="3.6" height="1.8" rx="0.9" fill="#d23b2e" />
      <Rect x="2.6"  y="13.4" width="3.6" height="1.8" rx="0.9" fill="#d23b2e" />
    </Svg>
  )
}

function PinIcon({ color }: { color: string }) {
  // Elegant teardrop pin matching the pickup/dropoff family, with a soft ground
  // shadow and a clean white center dot.
  return (
    <Svg width={36} height={48} viewBox="0 0 40 52">
      <Ellipse cx="20" cy="49" rx="6" ry="2.2" fill="rgba(0,0,0,0.18)" />
      <Path
        d="M20 1 C10.6 1 3 8.6 3 18 C3 30 20 46 20 46 C20 46 37 30 37 18 C37 8.6 29.4 1 20 1 Z"
        fill={color}
        stroke="rgba(0,0,0,0.10)"
        strokeWidth="1"
      />
      <Circle cx="20" cy="18" r="6" fill="white" />
    </Svg>
  )
}

// ─── Shared style ─────────────────────────────────────────────────────────────

const FILL = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 }

// ─── Google Maps dark styles ──────────────────────────────────────────────────

const DARK_BASE = [
  { elementType: 'geometry',           stylers: [{ color: '#0f1120' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1120' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#8a8a9a' }] },
  { featureType: 'administrative',     elementType: 'geometry',             stylers: [{ color: '#1e1e30' }] },
  { featureType: 'road',               elementType: 'geometry',             stylers: [{ color: '#252540' }] },
  { featureType: 'road.highway',       elementType: 'geometry',             stylers: [{ color: '#353558' }] },
  { featureType: 'road.highway',       elementType: 'geometry.stroke',      stylers: [{ color: '#0f1120' }] },
  { featureType: 'road',               elementType: 'labels.text.fill',     stylers: [{ color: '#aaaacc' }] },
  { featureType: 'water',              elementType: 'geometry',             stylers: [{ color: '#050916' }] },
  { featureType: 'water',              elementType: 'labels.text.fill',     stylers: [{ color: '#3d4052' }] },
  { featureType: 'transit',            elementType: 'geometry',             stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'landscape',          elementType: 'geometry',             stylers: [{ color: '#0c0c1a' }] },
]

const DARK_NAV_STYLE = [
  ...DARK_BASE,
  { featureType: 'poi', elementType: 'geometry',          stylers: [{ color: '#151525' }] },
  { featureType: 'poi', elementType: 'labels.icon',       stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.text.fill',  stylers: [{ color: '#555570' }] },
]

const DARK_EXPLORE_STYLE = [
  ...DARK_BASE,
  { featureType: 'poi',          elementType: 'geometry',         stylers: [{ color: '#151525' }] },
  { featureType: 'poi',          elementType: 'labels.text.fill', stylers: [{ color: '#aaaacc' }] },
  { featureType: 'poi.business', elementType: 'labels.icon',      stylers: [{ visibility: 'on'  }] },
  { featureType: 'poi.park',     elementType: 'geometry',         stylers: [{ color: '#0d1f0d' }] },
]
