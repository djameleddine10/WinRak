import axios from 'axios';
import { prisma } from '../../utils/prisma';

type VehicleType = 'GO' | 'PLUS' | 'XL' | 'SHE' | 'DELIVER';

export interface PriceBreakdown {
  baseFare: number; distanceCharge: number; estimatedDuration: number;
  estimatedDistance: number; total: number; currency: 'DZD';
  breakdown: { label: string; amount: number }[];
}

const DEFAULT_PRICING: Record<VehicleType, { base: number; perKm: number; waitPerMin: number }> = {
  GO:      { base: 150, perKm: 45,  waitPerMin: 15 },
  PLUS:    { base: 250, perKm: 75,  waitPerMin: 20 },
  XL:      { base: 350, perKm: 100, waitPerMin: 25 },
  SHE:     { base: 200, perKm: 55,  waitPerMin: 18 },
  DELIVER: { base: 200, perKm: 50,  waitPerMin: 10 },
};

export async function calculatePrice(
  pickupLat: number, pickupLng: number,
  dropoffLat: number, dropoffLng: number,
  vehicleType: VehicleType = 'GO'
): Promise<PriceBreakdown> {
  const { distanceKm, durationMin } = await getRouteInfo(pickupLat, pickupLng, dropoffLat, dropoffLng);
  const config = await getPricingConfig(vehicleType);
  const distanceCharge = Math.round(distanceKm * config.perKm);
  const total = Math.round(config.base + distanceCharge);

  return {
    baseFare: config.base, distanceCharge,
    estimatedDuration: durationMin, estimatedDistance: distanceKm,
    total, currency: 'DZD',
    breakdown: [
      { label: 'رسوم الانطلاق', amount: config.base },
      { label: `${distanceKm.toFixed(1)} كم × ${config.perKm} دج`, amount: distanceCharge },
    ],
  };
}

async function getRouteInfo(oLat: number, oLng: number, dLat: number, dLng: number) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    const distanceKm = haversine(oLat, oLng, dLat, dLng);
    return { distanceKm, durationMin: Math.round(distanceKm * 3) };
  }
  try {
    const r = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
      params: { origin: `${oLat},${oLng}`, destination: `${dLat},${dLng}`, key: apiKey, mode: 'driving' },
      timeout: 5000,
    });
    const leg = r.data.routes?.[0]?.legs?.[0];
    if (!leg) throw new Error('no route');
    return { distanceKm: leg.distance.value / 1000, durationMin: Math.round(leg.duration.value / 60) };
  } catch {
    const distanceKm = haversine(oLat, oLng, dLat, dLng);
    return { distanceKm, durationMin: Math.round(distanceKm * 3) };
  }
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371, toR = (d: number) => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getPricingConfig(vehicleType: VehicleType) {
  try {
    const db = await prisma.pricingConfig.findUnique({ where: { vehicleType } });
    if (db) return { base: db.baseFare, perKm: db.pricePerKm, waitPerMin: db.waitingPerMin };
  } catch {}
  return DEFAULT_PRICING[vehicleType];
}
