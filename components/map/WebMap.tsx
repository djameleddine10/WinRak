import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps'
import Svg, { Circle, Rect, Path, Line } from 'react-native-svg'
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
  return (
    <Svg width={44} height={56} viewBox="0 0 44 56">
      <Rect x="2" y="2" width="40" height="40" rx="11" fill="white" />
      <Circle cx="22" cy="13" r="5.5" fill={dark} />
      <Path
        d="M17 20Q13 27 15 35L19 35L22 28L25 35L29 35Q31 27 27 20Q25 18 22 18Q19 18 17 20Z"
        fill={dark}
      />
      <Line x1="25" y1="22" x2="34" y2="14" stroke={dark} strokeWidth="3.2" strokeLinecap="round" />
      <Line x1="19" y1="24" x2="11" y2="28" stroke={dark} strokeWidth="3.2" strokeLinecap="round" />
      <Path d="M19 42L22 55L25 42Z" fill="white" />
    </Svg>
  )
}

function DropoffPin({ gold }: { gold: string }) {
  return (
    <Svg width={44} height={54} viewBox="0 0 44 54">
      <Rect x="2" y="2" width="40" height="40" rx="11" fill={gold} />
      <Circle cx="22" cy="13" r="5.5" fill="white" />
      <Path
        d="M17 20Q13 27 15 35L19 35L22 28L25 35L29 35Q31 27 27 20Q25 18 22 18Q19 18 17 20Z"
        fill="white"
      />
      <Line x1="25" y1="22" x2="34" y2="14" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
      <Line x1="19" y1="24" x2="11" y2="28" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
      <Circle cx="22" cy="50" r="4.5" fill={gold} />
      <Circle cx="22" cy="50" r="2" fill="rgba(255,255,255,0.45)" />
    </Svg>
  )
}

function CarIcon({ heading, color }: { heading: number; color: string }) {
  return (
    <Svg
      width={34}
      height={34}
      viewBox="-17 -17 34 34"
      style={{ transform: [{ rotate: `${heading}deg` }] }}
    >
      <Rect x="-8" y="-13" width="16" height="26" rx="5" fill={color} />
      <Rect x="-5.5" y="-9" width="11" height="7" rx="2" fill="#22272b" />
      <Rect x="-5.5" y="1"  width="11" height="6" rx="2" fill="#22272b" />
    </Svg>
  )
}

function PinIcon({ color }: { color: string }) {
  return (
    <Svg width={30} height={40} viewBox="0 0 30 40">
      <Path
        d="M15 0 C6.7 0 0 6.7 0 15 C0 26 15 40 15 40 C15 40 30 26 30 15 C30 6.7 23.3 0 15 0 Z"
        fill={color}
      />
      <Circle cx="15" cy="15" r="6" fill="#22272b" />
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
