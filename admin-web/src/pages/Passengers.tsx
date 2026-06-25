import { useEffect, useState, useCallback } from 'react'
import { Search, Users, Ban, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDate, formatDZD, initials } from '../lib/utils'
import { TableSkeleton } from '../components/SkeletonLoader'
import { Pagination } from '../components/Pagination'
import { EmptyState } from '../components/EmptyState'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { toast } from 'sonner'

export default function Passengers() {
  const [passengers, setPassengers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState<{ open: boolean; id: string; action: string }>({ open: false, id: '', action: '' })
  const PER_PAGE = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      let q = supabase
        .from('profiles')
        .select('*, rides:rides(count)', { count: 'exact' })
        .eq('role', 'passenger')
        .order('created_at', { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

      if (search) q = q.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)

      const { data, count, error } = await q
      if (error) throw error
      setPassengers(data || [])
      setTotal(count || 0)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetch() }, [fetch])

  const handleBlockToggle = async () => {
    const p = passengers.find(p => p.id === confirm.id)
    if (!p) return
    const { error } = await supabase.from('profiles').update({ is_blocked: !p.is_blocked }).eq('id', confirm.id)
    if (error) { toast.error(error.message); return }
    toast.success(p.is_blocked ? 'Compte débloqué' : 'Compte bloqué')
    setConfirm({ open: false, id: '', action: '' })
    fetch()
  }

  return (
    <div className="p-6 space-y-5 fade-in">
      <div>
        <h1 className="page-title">Passagers</h1>
        <p className="page-subtitle">{total} passagers enregistrés</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          placeholder="Rechercher nom ou téléphone..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="input-field pl-9"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Passager</th>
                  <th className="table-header">Téléphone</th>
                  <th className="table-header">Solde</th>
                  <th className="table-header">Courses</th>
                  <th className="table-header">Inscription</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-xs font-bold text-warning">
                          {initials(p.full_name || 'NA')}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{p.full_name || '—'}</div>
                          <div className="text-xs text-muted">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-muted">{p.phone || '—'}</td>
                    <td className="table-cell text-winrak font-medium">{formatDZD(p.wallet_balance || 0)}</td>
                    <td className="table-cell text-center">{p.rides?.[0]?.count || 0}</td>
                    <td className="table-cell text-muted text-xs">{formatDate(p.created_at)}</td>
                    <td className="table-cell">
                      {p.is_blocked ? (
                        <span className="badge-danger">Bloqué</span>
                      ) : (
                        <span className="badge-success">Actif</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => setConfirm({ open: true, id: p.id, action: p.is_blocked ? 'unblock' : 'block' })}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          p.is_blocked
                            ? 'text-muted hover:text-success hover:bg-success/10'
                            : 'text-muted hover:text-danger hover:bg-danger/10'
                        }`}
                        title={p.is_blocked ? 'Débloquer' : 'Bloquer'}
                      >
                        {p.is_blocked ? <CheckCircle size={14} /> : <Ban size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {passengers.length === 0 && (
            <EmptyState icon={Users} title="Aucun passager trouvé" />
          )}
          <Pagination page={page} total={total} perPage={PER_PAGE} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title={confirm.action === 'block' ? 'Bloquer le compte' : 'Débloquer le compte'}
        message={confirm.action === 'block' ? 'Le passager ne pourra plus utiliser l\'application.' : 'Le passager pourra de nouveau utiliser l\'application.'}
        confirmLabel={confirm.action === 'block' ? 'Bloquer' : 'Débloquer'}
        variant={confirm.action === 'block' ? 'danger' : 'warning'}
        onConfirm={handleBlockToggle}
        onCancel={() => setConfirm({ open: false, id: '', action: '' })}
      />
    </div>
  )
}
