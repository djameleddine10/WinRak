import { useEffect, useState, useCallback } from 'react'
import { Search, CheckCircle, XCircle, Eye, Car, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDate, formatDZD, getStatusBadgeClass, getStatusLabel, initials } from '../lib/utils'
import { TableSkeleton } from '../components/SkeletonLoader'
import { Pagination } from '../components/Pagination'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { toast } from 'sonner'

export default function Drivers() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [confirm, setConfirm] = useState<{ open: boolean; action: string; id: string | null }>({ open: false, action: '', id: null })
  const [drawerDriver, setDrawerDriver] = useState<any>(null)

  const PER_PAGE = 20

  const fetchDrivers = useCallback(async () => {
    setLoading(true)
    try {
      // PostgREST doesn't support ilike on embedded relations.
      // When search is active, resolve matching user_ids first, then filter.
      let userIds: string[] | null = null
      if (search) {
        const { data: profileMatches } = await supabase
          .from('profiles')
          .select('id')
          .ilike('full_name', `%${search}%`)
        userIds = (profileMatches || []).map((p: any) => p.id)
        if (userIds.length === 0) {
          setDrivers([])
          setTotal(0)
          setLoading(false)
          return
        }
      }

      let q = supabase
        .from('drivers')
        .select(`
          *,
          profile:profiles!user_id(id, full_name, phone, email, wilaya, avatar_url, created_at)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

      if (status)  q = q.eq('status', status)
      if (userIds) q = q.in('user_id', userIds)
      // ilike on nested relations is not supported by PostgREST — filter client-side after fetch

      const { data, count, error } = await q
      if (error) throw error
      const filtered = search
        ? (data || []).filter((d: any) =>
            d.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
          )
        : (data || [])
      setDrivers(filtered)
      setTotal(search ? filtered.length : (count || 0))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, status, search])

  useEffect(() => { fetchDrivers() }, [fetchDrivers])

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('drivers').update({ status: newStatus }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(`Statut mis à jour: ${getStatusLabel(newStatus)}`)
    fetchDrivers()
  }

  const handleConfirm = async () => {
    if (!confirm.id) return
    const newStatus = confirm.action === 'approve' ? 'active' : confirm.action === 'suspend' ? 'suspended' : 'active'
    await updateStatus(confirm.id, newStatus)
    setConfirm({ open: false, action: '', id: null })
  }

  return (
    <div className="p-6 space-y-5 fade-in">
      <div>
        <h1 className="page-title">Chauffeurs</h1>
        <p className="page-subtitle">{total} chauffeurs enregistrés</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher par nom ou téléphone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="input-field w-44"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="pending">En attente</option>
          <option value="suspended">Suspendu</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Chauffeur</th>
                  <th className="table-header">Téléphone</th>
                  <th className="table-header">Ville</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Note</th>
                  <th className="table-header">Courses</th>
                  <th className="table-header">Inscription</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(driver => (
                  <tr key={driver.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {initials(driver.profile?.full_name || 'NA')}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{driver.profile?.full_name || '—'}</div>
                          <div className="text-xs text-muted">{driver.vehicle_make} {driver.vehicle_model}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-muted">{driver.profile?.phone || '—'}</td>
                    <td className="table-cell text-muted">{driver.profile?.wilaya || '—'}</td>
                    <td className="table-cell">
                      <span className={getStatusBadgeClass(driver.status)}>
                        {getStatusLabel(driver.status)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-winrak fill-winrak" />
                        <span className="text-sm">{driver.rating?.toFixed(1) || '—'}</span>
                      </div>
                    </td>
                    <td className="table-cell text-center">{driver.total_rides || 0}</td>
                    <td className="table-cell text-muted text-xs">
                      {driver.profile?.created_at ? formatDate(driver.profile.created_at) : '—'}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDrawerDriver(driver)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-primary hover:bg-primary/10 transition-all"
                          title="Voir le profil"
                        >
                          <Eye size={14} />
                        </button>
                        {driver.status === 'pending' && (
                          <button
                            onClick={() => setConfirm({ open: true, action: 'approve', id: driver.id })}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-success hover:bg-success/10 transition-all"
                            title="Approuver"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {driver.status === 'active' && (
                          <button
                            onClick={() => setConfirm({ open: true, action: 'suspend', id: driver.id })}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-all"
                            title="Suspendre"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                        {driver.status === 'suspended' && (
                          <button
                            onClick={() => setConfirm({ open: true, action: 'reactivate', id: driver.id })}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-success hover:bg-success/10 transition-all"
                            title="Réactiver"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {drivers.length === 0 && (
            <EmptyState icon={Car} title="Aucun chauffeur trouvé" description="Modifiez vos filtres de recherche" />
          )}
          <Pagination page={page} total={total} perPage={PER_PAGE} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title={confirm.action === 'suspend' ? 'Suspendre le chauffeur' : confirm.action === 'approve' ? 'Approuver le chauffeur' : 'Réactiver le chauffeur'}
        message={confirm.action === 'suspend' ? 'Le chauffeur ne pourra plus recevoir de courses.' : 'Confirmez cette action.'}
        confirmLabel={confirm.action === 'suspend' ? 'Suspendre' : 'Confirmer'}
        variant={confirm.action === 'suspend' ? 'danger' : 'warning'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm({ open: false, action: '', id: null })}
      />

      {/* Driver Drawer */}
      {drawerDriver && (
        <DriverDrawer driver={drawerDriver} onClose={() => setDrawerDriver(null)} />
      )}
    </div>
  )
}

function DriverDrawer({ driver, onClose }: { driver: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-96 bg-surface border-l border-border h-full overflow-y-auto slide-in-right">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Profil Chauffeur</h2>
            <button onClick={onClose} className="text-muted hover:text-text-primary">✕</button>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
              {initials(driver.profile?.full_name || 'NA')}
            </div>
            <div>
              <div className="font-semibold text-text-primary">{driver.profile?.full_name}</div>
              <div className="text-sm text-muted">{driver.profile?.email}</div>
              <span className={getStatusBadgeClass(driver.status)}>{getStatusLabel(driver.status)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <Section title="Informations personnelles">
              <Row label="Téléphone" value={driver.profile?.phone} />
              <Row label="Ville" value={driver.profile?.wilaya} />
              <Row label="Inscription" value={driver.profile?.created_at ? formatDate(driver.profile.created_at) : '—'} />
            </Section>

            <Section title="Véhicule">
              <Row label="Marque" value={driver.vehicle_make} />
              <Row label="Modèle" value={driver.vehicle_model} />
              <Row label="Année" value={driver.vehicle_year} />
              <Row label="Couleur" value={driver.vehicle_color} />
              <Row label="Plaque" value={driver.vehicle_plate} />
            </Section>

            <Section title="Statistiques">
              <Row label="Total courses" value={driver.total_rides || 0} />
              <Row label="Gains totaux" value={formatDZD(driver.total_earnings || 0)} />
              <Row label="Note moyenne" value={`${driver.rating?.toFixed(2) || '—'} ⭐`} />
              <Row label="Taux d'acceptation" value={`${driver.acceptance_rate || 0}%`} />
            </Section>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg rounded-xl p-4">
      <p className="section-title">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm text-text-primary font-medium">{value || '—'}</span>
    </div>
  )
}
