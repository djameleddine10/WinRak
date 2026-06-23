// ─── حساب المسافة والوقت الحقيقيين عبر OSRM (OpenStreetMap) ──────────────────
// لا يحتاج مفتاح API — مجاني تماماً ويغطي الجزائر بشكل كامل.

export interface RouteInfo {
  distanceKm:  number
  durationMin: number
  waypoints:   Array<{ lat: number; lng: number }>
}

export async function getRouteInfo(
  fromLat: number,
  fromLng: number,
  toLat:   number,
  toLng:   number
): Promise<RouteInfo> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

  try {
    const res  = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    const data = await res.json()

    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('OSRM: no route found')
    }

    const route  = data.routes[0]
    const coords: number[][] = route.geometry.coordinates  // [[lng, lat], ...]

    // Sample to max 120 points to avoid overloading the map renderer
    const waypoints = sampleCoords(coords, 120)

    return {
      distanceKm:  Math.round(route.distance / 100) / 10,
      durationMin: Math.max(1, Math.round(route.duration / 60)),
      waypoints,
    }
  } catch {
    clearTimeout(timer)
    throw new Error('Route calculation failed')
  }
}

function sampleCoords(coords: number[][], maxPoints: number): Array<{ lat: number; lng: number }> {
  if (coords.length <= maxPoints) return coords.map(([lng, lat]) => ({ lat, lng }))
  const step = Math.ceil(coords.length / maxPoints)
  const result: Array<{ lat: number; lng: number }> = []
  for (let i = 0; i < coords.length - 1; i += step) {
    const [lng, lat] = coords[i]
    result.push({ lat, lng })
  }
  const [lastLng, lastLat] = coords[coords.length - 1]
  result.push({ lat: lastLat, lng: lastLng })
  return result
}

// ─── سعر تقريبي بالدينار الجزائري بناءً على المسافة ─────────────────────────
const BASE = 150          // رسوم أساسية DZD
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
  return Math.round((BASE + perKm * distanceKm) / 50) * 50  // يُقرَّب لأقرب 50 دج
}
