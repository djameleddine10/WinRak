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
  // Realistic top-down sedan modelled on the reference illustration, tinted in
  // the WinRak brand colour. Curved body with a center glossy highlight, dark
  // tinted front & rear windshields, side windows, door seams, wing mirrors,
  // headlights and a soft ground shadow. Nose points up (heading 0).
  const glass    = '#101a33'   // deep navy glass
  const seam     = 'rgba(0,0,0,0.22)'
  const headlight = 'rgba(255,255,255,0.85)'
  return (
    <Svg
      width={48}
      height={48}
      viewBox="-24 -24 48 48"
      style={{ transform: [{ rotate: `${heading}deg` }] }}
    >
      {/* soft ground shadow */}
      <Ellipse cx="0.5" cy="1.5" rx="11" ry="20" fill="rgba(0,0,0,0.20)" />

      {/* wing mirrors */}
      <Path d="M-8.4 -5 L-11 -4 Q-12 -3.4 -11.2 -2.6 L-8.4 -3.4 Z" fill={color} />
      <Path d="M8.4 -5 L11 -4 Q12 -3.4 11.2 -2.6 L8.4 -3.4 Z" fill={color} />

      {/* car body — smooth sedan silhouette, rounded nose & tail */}
      <Path
        d="M0 -19.5
           C5.2 -19.5 8.3 -16 8.8 -10.5
           C9.2 -5.5 9.3 6 8.9 12.5
           C8.5 17.5 5 19.5 0 19.5
           C-5 19.5 -8.5 17.5 -8.9 12.5
           C-9.3 6 -9.2 -5.5 -8.8 -10.5
           C-8.3 -16 -5.2 -19.5 0 -19.5 Z"
        fill={color}
        stroke={seam}
        strokeWidth="0.6"
      />

      {/* headlights (front) */}
      <Path d="M-6.4 -16.4 Q-4.6 -17.6 -3 -16.6 L-3.6 -14.8 Q-5 -15.4 -6 -14.8 Z" fill={headlight} />
      <Path d="M6.4 -16.4 Q4.6 -17.6 3 -16.6 L3.6 -14.8 Q5 -15.4 6 -14.8 Z" fill={headlight} />

      {/* front windshield */}
      <Path d="M-6 -10.5 Q0 -12 6 -10.5 L4.8 -4.5 Q0 -5.6 -4.8 -4.5 Z" fill={glass} />
      {/* roof glossy highlight */}
      <Rect x="-5.6" y="-4" width="11.2" height="9.5" rx="2.4" fill="rgba(255,255,255,0.14)" />
      {/* rear windshield */}
      <Path d="M-5.8 12 Q0 13.2 5.8 12 L4.6 6.5 Q0 7.6 -4.6 6.5 Z" fill={glass} />

      {/* side windows */}
      <Path d="M-8 -9.5 L-6.2 -9 L-6.2 5.5 L-8 6 Z" fill={glass} />
      <Path d="M8 -9.5 L6.2 -9 L6.2 5.5 L8 6 Z" fill={glass} />

      {/* door seams */}
      <Rect x="-8.6" y="-0.4" width="17.2" height="0.7" rx="0.35" fill={seam} />
      {/* door handles */}
      <Rect x="-7.6" y="-3.4" width="1.4" height="2.6" rx="0.7" fill={seam} />
      <Rect x="6.2"  y="-3.4" width="1.4" height="2.6" rx="0.7" fill={seam} />
      <Rect x="-7.6" y="1"   width="1.4" height="2.6" rx="0.7" fill={seam} />
      <Rect x="6.2"  y="1"   width="1.4" height="2.6" rx="0.7" fill={seam} />
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
