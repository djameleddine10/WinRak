import { useEffect, useRef } from 'react'
import { Image, View } from 'react-native'
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps'
import Svg, { Circle, Path, Ellipse } from 'react-native-svg'

// Top-down car PNGs: dark silhouette for light maps, gold for dark maps.
const CAR_DARK = require('../../assets/markers/car-dark.png')
const CAR_GOLD = require('../../assets/markers/car-gold.png')
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
  flyToLocation?:         { lat: number; lng: number; ts?: number } | null
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
  variant: _variant = 'navigation',
  style,
  onRegionChange,
  onRegionChangeComplete,
}: WebMapProps) {
  const Colors = useColors()
  const scheme = useResolvedScheme()
  const mapRef = useRef<MapView>(null)
  const dark   = scheme === 'dark'

  // Smooth fly-to on locate button press — ts يضمن إطلاق useEffect حتى لو lat/lng نفسهم
  useEffect(() => {
    if (!flyToLocation) return
    mapRef.current?.animateToRegion({
      latitude:       flyToLocation.lat,
      longitude:      flyToLocation.lng,
      latitudeDelta:  0.01,
      longitudeDelta: 0.01,
    }, 800)
  }, [flyToLocation?.ts])

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
        customMapStyle={[]}
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
            <MarkerIcon m={m} Colors={Colors} dark={dark} />
          </Marker>
        ))}
      </MapView>
    </View>
  )
}

// ─── Marker icons ─────────────────────────────────────────────────────────────

function MarkerIcon({ m, Colors, dark }: { m: MapMarker; Colors: Palette; dark: boolean }) {
  const { type, heading } = m
  if (type === 'pickup')  return <PickupPin  dark={Colors.dark1} />
  if (type === 'dropoff') return <DropoffPin gold={Colors.gold}  />
  if (type === 'car')     return <CarIcon    heading={heading ?? 0} dark={dark} />
  if (type === 'pin')     return <PinIcon    color={Colors.gold}    />
  if (type === 'dest')    return <PinIcon    color={Colors.success} />
  return <CarIcon heading={heading ?? 0} dark={dark} />
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

function CarIcon({ heading, dark }: { heading: number; dark: boolean }) {
  // Top-down car PNG, themed: a dark silhouette on light maps, brand gold on
  // dark maps. The asset's nose points up (heading 0), so we just rotate it by
  // the live heading as the car drives along the route.
  return (
    <Image
      source={dark ? CAR_GOLD : CAR_DARK}
      style={{ width: 38, height: 38, transform: [{ rotate: `${heading}deg` }] }}
      resizeMode="contain"
    />
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

