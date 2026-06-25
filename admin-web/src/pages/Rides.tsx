import { useEffect, useState, useCallback } from 'react'
import { Download, MapPin, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDate, formatDZD, getStatusBadgeClass, getStatusLabel, getRideTypeColor } from '../lib/utils'
import { TableSkeleton } from '../components/SkeletonLoader'
import { Pagination } from '../components/Pagination'
import { EmptyState } from '../components/EmptyState'
import { toast } from 'sonner'

export default function Rides() {
  const [rides, setRides] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const PER_PAGE = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      let q = supabase
        .from('rides')
        .select(`
          *,
          passenger:profiles!passenger_id(full_name, phone),
          driver:profiles!driver_id(full_name, phone)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

      if (status) q = q.eq('status', status)
      if (type) q = q.eq('ride_type', type)

      const { data, count, error } = await q
      if (error) throw error
      setRides(data || [])
      setTotal(count || 0)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, status, type])

  useEffect(() => { fetch() }, [fetch])

  const exportCSV = () => {
    const csv = [
      ['ID', 'Passager', 'Chauffeur', 'Type', 'Distance', 'Prix', 'Statut', 'Date'],
      ...rides.map(r => [
        r.id.slice(0, 8),
        r.passenger?.full_name || '',
        r.driver?.full_name || '',
        r.ride_type,
        r.distance_km?.toFixed(2) + 'km',
        r.price,
        r.status,
        formatDate(r.created_at),
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'winrak-rides.csv'; a.click()
  }

  return (
    <div className="p-6 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">{total} courses au total</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary">
          <Download size={14} />
          Exporter CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={type} onChange={e => { setType(e.target.value); setPage(1) }} className="input-field w-44">
          <option value="">Tous les types</option>
          <option value="passenger">Passager</option>
          <option value="women">Femmes</option>
          <option value="delivery">Livraison</option>
          <option value="pharmacy">Pharmacie</option>
          <option value="food">Restaurant</option>
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="input-field w-44">
          <option value="">Tous les statuts</option>
          <option value="requested">Demandée</option>
          <option value="accepted">Acceptée</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">ID</th>
                  <th className="table-header">Passager</th>
                  <th className="table-header">Chauffeur</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Distance</th>
                  <th className="table-header">Prix</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Date</th>
                </tr>
              </thead>
              <tbody>
                {rides.map(ride => (
                  <tr
                    key={ride.id}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelected(ride)}
                  >
                    <td className="table-cell text-muted text-xs font-mono">{ride.id.slice(0, 8)}…</td>
                    <td className="table-cell font-medium text-sm">{ride.passenger?.full_name || '—'}</td>
                    <td className="table-cell text-muted text-sm">{ride.driver?.full_name || '—'}</td>
                    <td className="table-cell">
                      <span className={getRideTypeColor(ride.ride_type)}>
                        {getStatusLabel(ride.ride_type)}
                      </span>
                    </td>
                    <td className="table-cell text-muted">{ride.distance_km?.toFixed(2)} km</td>
                    <td className="table-cell font-semibold text-winrak">{formatDZD(ride.price)}</td>
                    <td className="table-cell">
                      <span className={getStatusBadgeClass(ride.status)}>
                        {getStatusLabel(ride.status)}
                      </span>
                    </td>
                    <td className="table-cell text-muted text-xs">{formatDate(ride.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rides.length === 0 && <EmptyState icon={MapPin} title="Aucune course trouvée" />}
          <Pagination page={page} total={total} perPage={PER_PAGE} onChange={setPage} />
        </div>
      )}

      {/* Ride Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-card fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Détails de la course</h2>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-bg rounded-xl p-3">
                <p className="text-xs text-muted mb-1">Passager</p>
                <p className="font-semibold">{selected.passenger?.full_name || '—'}</p>
                <p className="text-xs text-muted">{selected.passenger?.phone}</p>
              </div>
              <div className="bg-bg rounded-xl p-3">
                <p className="text-xs text-muted mb-1">Chauffeur</p>
                <p className="font-semibold">{selected.driver?.full_name || 'Non assigné'}</p>
                <p className="text-xs text-muted">{selected.driver?.phone}</p>
              </div>
            </div>

            <div className="bg-bg rounded-xl p-4 mb-4 space-y-2">
              <p className="section-title">Détails tarifaires</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Type</span>
                <span className={getRideTypeColor(selected.ride_type)}>{getStatusLabel(selected.ride_type)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Distance</span>
                <span>{selected.distance_km?.toFixed(2)} km</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Durée</span>
                <span>{selected.duration_minutes || '—'} min</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-border pt-2 mt-2">
                <span>Prix total</span>
                <span className="text-winrak">{formatDZD(selected.price)}</span>
              </div>
            </div>

            <div className="bg-bg rounded-xl p-4 space-y-2">
              <p className="section-title">Chronologie</p>
              <TimelineItem label="Demandée" value={selected.created_at} />
              <TimelineItem label="Acceptée" value={selected.accepted_at} />
              <TimelineItem label="Prise en charge" value={selected.picked_up_at} />
              <TimelineItem label="Terminée" value={selected.completed_at} />
            </div>

            <div className="mt-4 text-center">
              <span className={getStatusBadgeClass(selected.status)}>{getStatusLabel(selected.status)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TimelineItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={value ? 'text-text-primary' : 'text-muted/40'}>
        {value ? formatDate(value) : '—'}
      </span>
    </div>
  )
}
