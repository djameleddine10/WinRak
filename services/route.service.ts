const GMAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? ''

export interface RouteInfo {
  distanceKm:  number
  durationMin: number
  waypoints:   Array<{ lat: number; lng: number }>
}

export async function getRouteInfo(
  fromLat: number,
  fromLng: number,
  toLat:   number,
  toLng:   number,
): Promise<RouteInfo> {
  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${fromLat},${fromLng}` +
    `&destination=${toLat},${toLng}` +
    `&mode=driving` +
    `&key=${GMAPS_KEY}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const res  = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    const data = await res.json()

    if (data.status !== 'OK' || !data.routes?.length) {
      throw new Error(`Google Maps: ${data.status ?? 'no route found'}`)
    }

    const leg      = data.routes[0].legs[0]
    const polyline = data.routes[0].overview_polyline.points
    const coords   = decodePolyline(polyline)

    return {
      distanceKm:  Math.round(leg.distance.value / 100) / 10,
      durationMin: Math.max(1, Math.round(leg.duration.value / 60)),
      waypoints:   samplePoints(coords, 120),
    }
  } catch {
    clearTimeout(timer)
    throw new Error('Route calculation failed')
  }
}

// ─── Google Maps encoded polyline decoder ────────────────────────────────────
function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = []
  let index = 0, lat = 0, lng = 0

  while (index < encoded.length) {
    let shift = 0, result = 0, byte: number
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : result >> 1

    shift = 0; result = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : result >> 1

    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return points
}

function samplePoints(
  points: Array<{ lat: number; lng: number }>,
  maxPoints: number,
): Array<{ lat: number; lng: number }> {
  if (points.length <= maxPoints) return points
  const step   = Math.ceil(points.length / maxPoints)
  const result = points.filter((_, i) => i % step === 0)
  if (result[result.length - 1] !== points[points.length - 1]) {
    result.push(points[points.length - 1])
  }
  return result
}

// ─── تقدير السعر بالدينار الجزائري ───────────────────────────────────────────
const BASE = 150
const PER_KM: Record<string, number> = {
  sedan:   80,
  comfort: 100,
  she:     90,
  suv:     80,
  van:     70,
  truck:   70,
}

export function estimatePrice(vehicleType: string, distanceKm: number): number {
  const perKm = PER_KM[vehicleType] ?? 80
  return Math.round((BASE + perKm * distanceKm) / 50) * 50
}
