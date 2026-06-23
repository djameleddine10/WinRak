export const mockMapDrivers = [
  { id: 'd001', lat: 36.7538, lng: 3.0588, heading: 45,  type: 'sedan', isOnline: true  },
  { id: 'd002', lat: 36.7600, lng: 3.0500, heading: 120, type: 'suv',   isOnline: true  },
  { id: 'd003', lat: 36.7450, lng: 3.0650, heading: 270, type: 'sedan', isOnline: true  },
  { id: 'd004', lat: 36.7700, lng: 3.0400, heading: 90,  type: 'van',   isOnline: false },
  { id: 'd005', lat: 36.7350, lng: 3.0750, heading: 180, type: 'sedan', isOnline: true  },
]

export const ALGIERS_CENTER = { lat: 36.7538, lng: 3.0588 }
export const DEFAULT_ZOOM   = 14

// Dense waypoints along a realistic Algiers city route (Didouche Mourad → Bab Ezzouar).
// Used by useRideSimulator when no real OSRM route has been computed yet.
export const mockRoutePoints = [
  { lat: 36.7538, lng: 3.0588 },
  { lat: 36.7530, lng: 3.0610 },
  { lat: 36.7520, lng: 3.0635 },
  { lat: 36.7508, lng: 3.0662 },
  { lat: 36.7495, lng: 3.0690 },
  { lat: 36.7480, lng: 3.0718 },
  { lat: 36.7465, lng: 3.0745 },
  { lat: 36.7450, lng: 3.0772 },
  { lat: 36.7435, lng: 3.0800 },
  { lat: 36.7420, lng: 3.0828 },
  { lat: 36.7405, lng: 3.0858 },
  { lat: 36.7390, lng: 3.0890 },
  { lat: 36.7375, lng: 3.0922 },
  { lat: 36.7358, lng: 3.0960 },
  { lat: 36.7340, lng: 3.0998 },
  { lat: 36.7322, lng: 3.1040 },
  { lat: 36.7305, lng: 3.1085 },
  { lat: 36.7288, lng: 3.1135 },
  { lat: 36.7272, lng: 3.1185 },
  { lat: 36.7255, lng: 3.1240 },
  { lat: 36.7238, lng: 3.1300 },
  { lat: 36.7222, lng: 3.1365 },
  { lat: 36.7208, lng: 3.1432 },
  { lat: 36.7196, lng: 3.1505 },
  { lat: 36.7186, lng: 3.1580 },
  { lat: 36.7178, lng: 3.1655 },
  { lat: 36.7172, lng: 3.1730 },
  { lat: 36.7168, lng: 3.1800 },
]

export type MapDriver = typeof mockMapDrivers[number]
export type LatLng = { lat: number; lng: number }
