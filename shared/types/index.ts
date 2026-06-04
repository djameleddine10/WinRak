// ─── Shared types between mobile, web, and backend ──────────────

export type VehicleType = 'GO' | 'PLUS' | 'XL' | 'SHE' | 'DELIVER';
export type RideStatus = 'REQUESTED' | 'SEARCHING' | 'ACCEPTED' | 'DRIVER_ARRIVING' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'WIN_POINTS';
export type ContractType = 'STANDARD' | 'PREMIUM' | 'PARTNER';
export type IncidentType = 'ACCIDENT_MINOR' | 'ACCIDENT_MAJOR' | 'VEHICLE_BREAKDOWN' | 'PASSENGER_DAMAGE' | 'ROAD_INCIDENT' | 'CANCELLED_TRIP_PENALTY';
export type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN';
export type Language = 'ar' | 'fr' | 'en';

export interface Coordinates { lat: number; lng: number; }

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface RideEstimate {
  baseFare: number;
  distanceCharge: number;
  estimatedDuration: number;
  estimatedDistance: number;
  total: number;
  currency: 'DZD';
  breakdown: { label: string; amount: number }[];
}

export interface SocketEvents {
  // Passenger → Server
  'location:update': { lat: number; lng: number; heading?: number };
  'sos:trigger': { lat: number; lng: number; rideId?: string };
  'chat:send': { rideId: string; message: string };

  // Driver → Server
  'driver:go_online': void;
  'driver:go_offline': void;

  // Server → Passenger
  'ride:status_changed': { rideId: string; status: RideStatus; driver?: any };
  'driver:location_update': { rideId: string; lat: number; lng: number; heading?: number };

  // Server → Driver
  'ride:new_request': {
    rideId: string;
    pickup: Coordinates & { address: string };
    dropoff: { address: string };
    serviceType: VehicleType;
    fare: number;
    estimatedDistance: number;
    estimatedDuration: number;
  };

  // Both
  'chat:message': { rideId: string; senderId: string; message: string; sentAt: string };
}
