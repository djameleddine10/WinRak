import { useEffect, useState, useCallback } from 'react'
import { Save, Calculator } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDZD } from '../lib/utils'
import { Skeleton } from '../components/SkeletonLoader'
import { toast } from 'sonner'

// Default pricing config
const DEFAULT_PRICING: Record<string, number> = {
  passenger_base_fare: 250,
  passenger_price_per_km: 32,
  passenger_waiting_per_min: 3,
  passenger_economy_multiplier: 0.90,
  passenger_priority_multiplier: 1.15,
  passenger_women_surcharge: 0.15,
  delivery_base_distance: 3,
  delivery_base_price: 250,
  delivery_price_per_km: 30,
  delivery_express_multiplier: 1.25,
  delivery_urgent_multiplier: 1.50,
  pharma_base_price: 300,
  pharma_price_per_km: 30,
  pharma_express_multiplier: 1.35,
  pharma_urgent_multiplier: 1.70,
  food_base_distance: 3,
  food_base_price: 250,
  food_price_per_km: 30,
  surge_morning_peak: 1.20,
  surge_evening_peak: 1.20,
  surge_night: 1.30,
  surge_rain: 1.25,
  surge_ramadan: 1.35,
  surge_holidays: 1.40,
  commission_launch: 0,
  commission_growth: 0.05,
  commission_stable: 0.10,
  commission_restaurant_launch: 0,
  commission_restaurant_growth: 0.10,
  commission_restaurant_stable: 0.18,
}

// Calculator
function calcFare(
  distanceKm: number,
  type: string,
  surge: number,
  pricing: Record<string, number>
): { base: number; surge: number; total: number; breakdown: string[] } {
  const p = pricing
  let base = 0
  const breakdown: string[] = []

  if (type === 'passenger') {
    if (distanceKm <= 2) {
      base = p.passenger_base_fare
      breakdown.push(`Tarif de base (0–2km): ${p.passenger_base_fare} DZD`)
    } else {
      base = p.passenger_base_fare + (distanceKm - 2) * p.passenger_price_per_km
      breakdown.push(`Base: ${p.passenger_base_fare} DZD`)
      breakdown.push(`Distance: (${distanceKm.toFixed(1)} - 2) × ${p.passenger_price_per_km} = ${((distanceKm - 2) * p.passenger_price_per_km).toFixed(0)} DZD`)
    }
  } else if (type === 'delivery') {
    if (distanceKm <= p.delivery_base_distance) {
      base = p.delivery_base_price
      breakdown.push(`Tarif fixe (0–${p.delivery_base_distance}km): ${p.delivery_base_price} DZD`)
    } else {
      base = p.delivery_base_price + (distanceKm - p.delivery_base_distance) * p.delivery_price_per_km
      breakdown.push(`Base: ${p.delivery_base_price} DZD + distance: ${((distanceKm - p.delivery_base_distance) * p.delivery_price_per_km).toFixed(0)} DZD`)
    }
  } else if (type === 'pharmacy') {
    base = p.pharma_base_price + distanceKm * p.pharma_price_per_km
    breakdown.push(`${p.pharma_base_price} + (${distanceKm.toFixed(1)} × ${p.pharma_price_per_km}) = ${base.toFixed(0)} DZD`)
  } else if (type === 'food') {
    if (distanceKm <= p.food_base_distance) {
      base = p.food_base_price
      breakdown.push(`Tarif fixe (0–${p.food_base_distance}km): ${p.food_base_price} DZD`)
    } else {
      base = p.food_base_price + (distanceKm - p.food_base_distance) * p.food_price_per_km
      breakdown.push(`Base + distance: ${base.toFixed(0)} DZD`)
    }
  }

  const surgeAmount = base * (surge - 1)
  const total = Math.ceil(base * surge)

  if (surge > 1) {
    breakdown.push(`Majoration ×${surge}: +${surgeAmount.toFixed(0)} DZD`)
  }

  return { base: Math.round(base), surge: Math.round(surgeAmount), total, breakdown }
}

export default function Pricing() {
  const [pricing, setPricing] = useState<Record<string, number>>(DEFAULT_PRICING)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // Calculator state
  const [calcDist, setCalcDist] = useState(5)
  const [calcType, setCalcType] = useState('passenger')
  const [calcSurge, setCalcSurge] = useState(1)

  const fetchPricing = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('pricing_config').select('*')
      if (error) throw error
      if (data && data.length > 0) {
        const map: Record<string, number> = { ...DEFAULT_PRICING }
        data.forEach((row: any) => { map[row.key] = parseFloat(row.value) })
        setPricing(map)
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPricing() }, [fetchPricing])

  const save = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(pricing).map(([key, value]) => ({
        key,
        value: value.toString(),
        label: key,
        category: key.split('_')[0],
        updated_at: new Date().toISOString(),
      }))
      const { error } = await supabase.from('pricing_config').upsert(updates, { onConflict: 'key' })
      if (error) throw error
      toast.success('Configuration tarifaire sauvegardée')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const set = (key: string, value: number) => setPricing(prev => ({ ...prev, [key]: value }))

  const calc = calcFare(calcDist, calcType, calcSurge, pricing)

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tarification</h1>
          <p className="page-subtitle">Configuration des tarifs WinRak</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">
          <Save size={14} />
          {saving ? 'Sauvegarde...' : 'Sauvegarder tout'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Config cards */}
        <div className="xl:col-span-2 space-y-4">

          {/* Passenger */}
          <PricingSection title="Courses Passagers" icon="🚗">
            <PricingRow label="Tarif minimum (DZD)" value={pricing.passenger_base_fare} onChange={v => set('passenger_base_fare', v)} />
            <PricingRow label="Prix par km (DZD)" value={pricing.passenger_price_per_km} onChange={v => set('passenger_price_per_km', v)} />
            <PricingRow label="Attente / minute (DZD)" value={pricing.passenger_waiting_per_min} onChange={v => set('passenger_waiting_per_min', v)} />
            <PricingRow label="Multiplicateur Économie" value={pricing.passenger_economy_multiplier} onChange={v => set('passenger_economy_multiplier', v)} step={0.05} />
            <PricingRow label="Multiplicateur Priorité" value={pricing.passenger_priority_multiplier} onChange={v => set('passenger_priority_multiplier', v)} step={0.05} />
            <PricingRow label="Surcharge Femmes (%)" value={pricing.passenger_women_surcharge * 100} onChange={v => set('passenger_women_surcharge', v / 100)} />
          </PricingSection>

          {/* Delivery */}
          <PricingSection title="Livraison" icon="📦">
            <PricingRow label="Distance de base (km)" value={pricing.delivery_base_distance} onChange={v => set('delivery_base_distance', v)} />
            <PricingRow label="Prix de base (DZD)" value={pricing.delivery_base_price} onChange={v => set('delivery_base_price', v)} />
            <PricingRow label="Prix par km supplémentaire" value={pricing.delivery_price_per_km} onChange={v => set('delivery_price_per_km', v)} />
            <PricingRow label="Multiplicateur Express" value={pricing.delivery_express_multiplier} onChange={v => set('delivery_express_multiplier', v)} step={0.05} />
            <PricingRow label="Multiplicateur Urgent" value={pricing.delivery_urgent_multiplier} onChange={v => set('delivery_urgent_multiplier', v)} step={0.05} />
          </PricingSection>

          {/* Pharmacy */}
          <PricingSection title="Pharmacie" icon="💊">
            <PricingRow label="Prix de base (DZD)" value={pricing.pharma_base_price} onChange={v => set('pharma_base_price', v)} />
            <PricingRow label="Prix par km (DZD)" value={pricing.pharma_price_per_km} onChange={v => set('pharma_price_per_km', v)} />
            <PricingRow label="Multiplicateur Express (<1h)" value={pricing.pharma_express_multiplier} onChange={v => set('pharma_express_multiplier', v)} step={0.05} />
            <PricingRow label="Multiplicateur Urgent (<30min)" value={pricing.pharma_urgent_multiplier} onChange={v => set('pharma_urgent_multiplier', v)} step={0.05} />
          </PricingSection>

          {/* Food */}
          <PricingSection title="Livraison Nourriture" icon="🍔">
            <PricingRow label="Distance de base (km)" value={pricing.food_base_distance} onChange={v => set('food_base_distance', v)} />
            <PricingRow label="Prix de base (DZD)" value={pricing.food_base_price} onChange={v => set('food_base_price', v)} />
            <PricingRow label="Prix par km supplémentaire" value={pricing.food_price_per_km} onChange={v => set('food_price_per_km', v)} />
          </PricingSection>

          {/* Surge */}
          <PricingSection title="Tarifs Majorés (Surge)" icon="⚡">
            <PricingRow label="Pointe matin (7–9h) ×" value={pricing.surge_morning_peak} onChange={v => set('surge_morning_peak', v)} step={0.05} />
            <PricingRow label="Pointe soir (17–20h) ×" value={pricing.surge_evening_peak} onChange={v => set('surge_evening_peak', v)} step={0.05} />
            <PricingRow label="Nuit (22h–5h) ×" value={pricing.surge_night} onChange={v => set('surge_night', v)} step={0.05} />
            <PricingRow label="Mauvais temps / Pluie ×" value={pricing.surge_rain} onChange={v => set('surge_rain', v)} step={0.05} />
            <PricingRow label="Ramadan (après Iftar) ×" value={pricing.surge_ramadan} onChange={v => set('surge_ramadan', v)} step={0.05} />
            <PricingRow label="Jours fériés ×" value={pricing.surge_holidays} onChange={v => set('surge_holidays', v)} step={0.05} />
          </PricingSection>

          {/* Commission */}
          <PricingSection title="Commissions" icon="💼">
            <PricingRow label="Phase lancement (%)" value={pricing.commission_launch * 100} onChange={v => set('commission_launch', v / 100)} />
            <PricingRow label="Phase croissance (%)" value={pricing.commission_growth * 100} onChange={v => set('commission_growth', v / 100)} />
            <PricingRow label="Phase stable (%)" value={pricing.commission_stable * 100} onChange={v => set('commission_stable', v / 100)} />
            <PricingRow label="Restaurant — lancement (%)" value={pricing.commission_restaurant_launch * 100} onChange={v => set('commission_restaurant_launch', v / 100)} />
            <PricingRow label="Restaurant — croissance (%)" value={pricing.commission_restaurant_growth * 100} onChange={v => set('commission_restaurant_growth', v / 100)} />
            <PricingRow label="Restaurant — stable (%)" value={pricing.commission_restaurant_stable * 100} onChange={v => set('commission_restaurant_stable', v / 100)} />
          </PricingSection>
        </div>

        {/* Right: Live calculator */}
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5 sticky top-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calculator size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Calculateur Live</h3>
                <p className="text-xs text-muted">Simulation en temps réel</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">Type de course</label>
                <select value={calcType} onChange={e => setCalcType(e.target.value)} className="input-field">
                  <option value="passenger">Passager</option>
                  <option value="delivery">Livraison</option>
                  <option value="pharmacy">Pharmacie</option>
                  <option value="food">Nourriture</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Distance: {calcDist} km</label>
                <input
                  type="range"
                  min="0.5" max="30" step="0.5"
                  value={calcDist}
                  onChange={e => setCalcDist(+e.target.value)}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Majoration</label>
                <select value={calcSurge} onChange={e => setCalcSurge(+e.target.value)} className="input-field">
                  <option value={1}>Normal ×1.00</option>
                  <option value={pricing.surge_morning_peak}>Pointe matin ×{pricing.surge_morning_peak}</option>
                  <option value={pricing.surge_night}>Nuit ×{pricing.surge_night}</option>
                  <option value={pricing.surge_rain}>Pluie ×{pricing.surge_rain}</option>
                  <option value={pricing.surge_ramadan}>Ramadan ×{pricing.surge_ramadan}</option>
                  <option value={pricing.surge_holidays}>Fériés ×{pricing.surge_holidays}</option>
                </select>
              </div>
            </div>

            {/* Result */}
            <div className="mt-5 bg-gradient-to-br from-primary/10 to-purple-500/5 border border-primary/20 rounded-xl p-4">
              <div className="text-center mb-3">
                <div className="text-3xl font-black text-winrak">{formatDZD(calc.total)}</div>
                <div className="text-xs text-muted">Tarif estimé</div>
              </div>
              <div className="space-y-1.5 border-t border-border/50 pt-3">
                {calc.breakdown.map((line, i) => (
                  <p key={i} className="text-xs text-muted">{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PricingSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {children}
      </div>
    </div>
  )
}

function PricingRow({ label, value, onChange, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; step?: number
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="input-field"
      />
    </div>
  )
}
