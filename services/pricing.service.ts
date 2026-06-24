import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ServiceKind   = 'ride' | 'women' | 'delivery' | 'medicine' | 'food'
export type CityTier      = 'A' | 'B' | 'C'
export type SpeedTier     = 'normal' | 'fast' | 'urgent'

export interface PricingConfig {
  id:                number
  tier:              CityTier
  service_type:      ServiceKind
  base_fare:         number
  short_km_limit:    number
  per_km_rate:       number
  per_min_rate:      number
  women_premium_pct: number
  speed_multipliers: { normal: number; fast: number; urgent: number }
  updated_at:        string
}

export interface PriceBreakdown {
  base_price:          number   // before surge & speed
  surge_multiplier:    number
  speed_multiplier:    number
  final_price:         number   // rounded to 50 DZD
  women_premium:       number   // extra DZD for women service
  platform_commission: number   // DZD taken by WinRak
  driver_earning:      number
  tier:                CityTier
}

// ─── Cache (refreshed every 10 minutes) ───────────────────────────────────────

let _configCache: PricingConfig[] | null = null
let _cacheAt = 0
const CACHE_TTL_MS = 10 * 60 * 1000

async function getConfigs(): Promise<PricingConfig[]> {
  if (_configCache && Date.now() - _cacheAt < CACHE_TTL_MS) return _configCache
  const { data, error } = await supabase.rpc('rpc_get_pricing_config')
  if (error) throw error
  _configCache = (data as PricingConfig[])
  _cacheAt = Date.now()
  return _configCache
}

// ─── Core calculation ─────────────────────────────────────────────────────────

export interface CalculatePriceParams {
  serviceType:       ServiceKind
  cityId?:           number
  tier?:             CityTier          // if cityId not known, pass tier directly
  distanceKm:        number
  durationMin?:      number
  speedTier?:        SpeedTier         // for delivery / medicine / food
  commissionPct?:    number            // driver commission 0 | 5 | 10
}

export async function calculatePrice(params: CalculatePriceParams): Promise<PriceBreakdown> {
  const {
    serviceType,
    distanceKm,
    durationMin      = 0,
    speedTier        = 'normal',
    commissionPct    = 0,
  } = params

  // Resolve tier
  let tier: CityTier = params.tier ?? 'B'
  if (params.cityId) {
    const { data } = await supabase
      .from('cities')
      .select('tier')
      .eq('id', params.cityId)
      .single()
    if (data?.tier) tier = data.tier as CityTier
  }

  const configs = await getConfigs()
  const cfg = configs.find(c => c.tier === tier && c.service_type === serviceType)
  if (!cfg) throw new Error(`No pricing config for tier=${tier} service=${serviceType}`)

  // Base calculation
  const extraKm  = Math.max(0, distanceKm - cfg.short_km_limit)
  let basePrice  = cfg.base_fare + extraKm * cfg.per_km_rate + durationMin * cfg.per_min_rate

  // Women premium (applied before surge)
  let womenPremium = 0
  if (serviceType === 'women') {
    womenPremium = basePrice * (cfg.women_premium_pct / 100)
    basePrice   += womenPremium
  }

  // Speed multiplier (delivery / medicine / food)
  const speedMult = cfg.speed_multipliers[speedTier] ?? 1.0

  // Surge multiplier from server
  let surgeMult = 1.0
  try {
    const { data } = await supabase.rpc('rpc_get_active_surge', { p_city_id: params.cityId ?? null })
    if (typeof data === 'number' && data > 1) surgeMult = data
  } catch {
    // non-blocking
  }

  const rawFinal  = basePrice * surgeMult * speedMult
  const finalPrice = Math.max(cfg.base_fare, roundTo50(rawFinal))

  const commission   = Math.round(finalPrice * commissionPct / 100)
  const driverEarning = finalPrice - commission

  return {
    base_price:          Math.round(basePrice),
    surge_multiplier:    surgeMult,
    speed_multiplier:    speedMult,
    final_price:         finalPrice,
    women_premium:       Math.round(womenPremium),
    platform_commission: commission,
    driver_earning:      driverEarning,
    tier,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roundTo50(n: number): number {
  return Math.round(n / 50) * 50
}

// Estimate price synchronously if configs are already cached (for UI preview)
export function estimatePriceSync(
  cfg: PricingConfig,
  distanceKm: number,
  durationMin = 0,
  speedTier: SpeedTier = 'normal',
  surgeMult = 1.0,
): number {
  const extraKm  = Math.max(0, distanceKm - cfg.short_km_limit)
  const base     = cfg.base_fare + extraKm * cfg.per_km_rate + durationMin * cfg.per_min_rate
  const speedM   = cfg.speed_multipliers[speedTier] ?? 1.0
  return Math.max(cfg.base_fare, roundTo50(base * surgeMult * speedM))
}

// Invalidate local cache (call after dashboard saves new config)
export function invalidatePricingCache() {
  _configCache = null
}
