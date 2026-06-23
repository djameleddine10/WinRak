const KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? ''

export interface GeoPlace {
  id:      string
  name:    string
  address: string
  lat:     number
  lng:     number
  placeId: string   // used internally to fetch coords on selection
}

const AC_URL  = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
const DET_URL = 'https://maps.googleapis.com/maps/api/place/details/json'

// Returns autocomplete suggestions as user types.
// Coordinates are NOT fetched here (too expensive per keystroke) — call
// getPlaceCoords() once the user actually selects a result.
export async function searchPlaces(
  query:     string,
  proximity?: { lat: number; lng: number },
): Promise<GeoPlace[]> {
  if (query.trim().length < 2) return []

  const params = new URLSearchParams({
    input:      query,
    key:        KEY,
    language:   'ar',
    components: 'country:dz',
    types:      'geocode|establishment',
    ...(proximity
      ? { location: `${proximity.lat},${proximity.lng}`, radius: '50000' }
      : {}),
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)

  try {
    const res  = await fetch(`${AC_URL}?${params}`, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return []
    const data = await res.json()

    return (data.predictions ?? []).slice(0, 6).map((p: any) => ({
      id:      p.place_id,
      name:    p.structured_formatting?.main_text ?? p.description,
      address: p.description,
      lat:     0,       // placeholder — filled in by getPlaceCoords()
      lng:     0,
      placeId: p.place_id,
    }))
  } catch {
    clearTimeout(timer)
    return []
  }
}

// Fetches the precise coordinates for a place the user has selected.
// Returns null if the request fails (caller should fall back gracefully).
export async function getPlaceCoords(
  placeId: string,
): Promise<{ lat: number; lng: number; name: string; address: string } | null> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields:   'geometry,name,formatted_address',
    key:      KEY,
    language: 'ar',
  })

  try {
    const res  = await fetch(`${DET_URL}?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    const loc  = data.result?.geometry?.location
    if (!loc) return null
    return {
      lat:     loc.lat,
      lng:     loc.lng,
      name:    data.result?.name            ?? '',
      address: data.result?.formatted_address ?? '',
    }
  } catch {
    return null
  }
}
