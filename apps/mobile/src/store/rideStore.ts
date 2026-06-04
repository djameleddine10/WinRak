import { create } from 'zustand';

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface RideRequest {
  pickup: Location | null;
  dropoff: Location | null;
  serviceType: 'GO' | 'PLUS' | 'XL' | 'SHE' | 'DELIVER';
  paymentMethod: 'CASH' | 'CARD';
}

export interface ActiveRide {
  id: string;
  status: string;
  driver?: {
    id: string;
    name: string;
    avatar?: string;
    phone: string;
    rating: number;
    vehicle: { brand: string; model: string; color: string; plateNumber: string };
    currentLat?: number;
    currentLng?: number;
  };
  totalFare?: number;
  estimatedDuration?: number;
}

interface RideState {
  request: RideRequest;
  activeRide: ActiveRide | null;
  pricingEstimate: {
    total: number;
    estimatedDuration: number;
    estimatedDistance: number;
    breakdown: { label: string; amount: number }[];
  } | null;

  setPickup: (location: Location) => void;
  setDropoff: (location: Location) => void;
  setServiceType: (type: RideRequest['serviceType']) => void;
  setPaymentMethod: (method: RideRequest['paymentMethod']) => void;
  setPricingEstimate: (estimate: RideState['pricingEstimate']) => void;
  setActiveRide: (ride: ActiveRide | null) => void;
  updateActiveRide: (updates: Partial<ActiveRide>) => void;
  updateDriverLocation: (lat: number, lng: number) => void;
  resetRequest: () => void;
}

const defaultRequest: RideRequest = {
  pickup: null,
  dropoff: null,
  serviceType: 'GO',
  paymentMethod: 'CASH',
};

export const useRideStore = create<RideState>((set) => ({
  request: defaultRequest,
  activeRide: null,
  pricingEstimate: null,

  setPickup: (pickup) => set((s) => ({ request: { ...s.request, pickup } })),
  setDropoff: (dropoff) => set((s) => ({ request: { ...s.request, dropoff } })),
  setServiceType: (serviceType) => set((s) => ({ request: { ...s.request, serviceType } })),
  setPaymentMethod: (paymentMethod) => set((s) => ({ request: { ...s.request, paymentMethod } })),
  setPricingEstimate: (pricingEstimate) => set({ pricingEstimate }),
  setActiveRide: (activeRide) => set({ activeRide }),
  updateActiveRide: (updates) => set((s) => ({
    activeRide: s.activeRide ? { ...s.activeRide, ...updates } : null,
  })),
  updateDriverLocation: (lat, lng) => set((s) => ({
    activeRide: s.activeRide?.driver
      ? { ...s.activeRide, driver: { ...s.activeRide.driver, currentLat: lat, currentLng: lng } }
      : s.activeRide,
  })),
  resetRequest: () => set({ request: defaultRequest, pricingEstimate: null }),
}));
