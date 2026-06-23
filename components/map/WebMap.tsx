import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps'
import Svg, { Circle, Rect, Path, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg'
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
  // Realistic top-down grey sedan matching the reference exactly: dark tyres at
  // the four corners, glossy tinted front & rear windshields with a light
  // reflection (gradient), a bright reflection band across the roof, wing
  // mirrors and a soft ground shadow. Nose points up (heading 0). The `color`
  // prop is intentionally ignored here — the design keeps its own grey palette
  // and light reflections as requested.
  void color
  return (
    <Svg
      width={30}
      height={48}
      viewBox="0 0 30 48"
      style={{ transform: [{ rotate: `${heading}deg` }] }}
    >
      <Defs>
        {/* windshield reflection — light at top fading to near-black */}
        <LinearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor="#5a5f66" />
          <Stop offset="0.4" stopColor="#2b2e33" />
          <Stop offset="1"   stopColor="#0c0d0f" />
        </LinearGradient>
        {/* body shading — subtle top-down sheen */}
        <LinearGradient id="body" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0"    stopColor="#6f747b" />
          <Stop offset="0.5"  stopColor="#8c9197" />
          <Stop offset="1"    stopColor="#6f747b" />
        </LinearGradient>
        {/* bright roof reflection band */}
        <LinearGradient id="band" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0"   stopColor="#b9bdc2" />
          <Stop offset="0.5" stopColor="#d7dade" />
          <Stop offset="1"   stopColor="#b9bdc2" />
        </LinearGradient>
      </Defs>

      {/* ground shadow */}
      <Ellipse cx="15.5" cy="24.5" rx="11.5" ry="22" fill="rgba(0,0,0,0.18)" />

      {/* dark chassis / bumpers underneath */}
      <Path
        d="M15 1 C20 1 24 4 25.5 9 C26.5 13 26.7 35 25.5 39 C24 44 20 47 15 47 C10 47 6 44 4.5 39 C3.3 35 3.5 13 4.5 9 C6 4 10 1 15 1 Z"
        fill="#3a3d42"
      />

      {/* tyres (four corners) */}
      <Rect x="4.6"  y="5.5"  width="3.2" height="5.5" rx="1.4" fill="#1b1d20" />
      <Rect x="22.2" y="5.5"  width="3.2" height="5.5" rx="1.4" fill="#1b1d20" />
      <Rect x="4.6"  y="37"   width="3.2" height="5.5" rx="1.4" fill="#1b1d20" />
      <Rect x="22.2" y="37"   width="3.2" height="5.5" rx="1.4" fill="#1b1d20" />

      {/* body */}
      <Path
        d="M15 3.5 C19 3.5 22 6 23.2 10.5 C24 14.5 24.2 33.5 23.2 37.5 C22 42 19 44.5 15 44.5 C11 44.5 8 42 6.8 37.5 C5.8 33.5 6 14.5 6.8 10.5 C8 6 11 3.5 15 3.5 Z"
        fill="url(#body)"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="0.5"
      />

      {/* wing mirrors */}
      <Path d="M6.4 17 L3.6 16 Q2.4 16.4 3 17.6 L6.2 18.6 Z" fill="#6f747b" />
      <Path d="M23.6 17 L26.4 16 Q27.6 16.4 27 17.6 L23.8 18.6 Z" fill="#6f747b" />

      {/* front windshield */}
      <Path d="M9 12 Q15 10.4 21 12 L19.2 19 Q15 17.6 10.8 19 Z" fill="url(#glass)" />
      {/* rear windshield */}
      <Path d="M9.2 36 Q15 37.6 20.8 36 L19 28.5 Q15 30 11 28.5 Z" fill="url(#glass)" />

      {/* bright roof reflection band */}
      <Path d="M7 22.5 L23 21 L23 26 L7 27.5 Z" fill="url(#band)" opacity="0.92" />
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
