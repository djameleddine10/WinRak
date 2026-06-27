import { useEffect, useState, useCallback } from 'react'
import {
  Search, CheckCircle, XCircle, Eye, Car, Star,
  ShieldCheck, Clock, AlertCircle, FileText, X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDate, formatDZD, getStatusBadgeClass, getStatusLabel, initials } from '../lib/utils'
import { TableSkeleton } from '../components/SkeletonLoader'
import { Pagination } from '../components/Pagination'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────
type DriverDoc = {
  id:            string
  type:          string
  status:        'pending' | 'approved' | 'rejected'
  file_url:      string | null
  reject_reason: string | null
  uploaded_at:   string | null
}

type ApprovalDriver = {
  driver_id:         string
  full_name:         string | null
  phone:             string | null
  avatar_url:        string | null
  vehicle_type:      string | null
  vehicle_plate:     string | null
  registration_status: string | null
  total_docs:        number
  pending_docs:      number
  approved_docs:     number
  rejected_docs:     number
  last_upload_at:    string | null
}

// ─── Labels ──────────────────────────────────────────────────────────────────
const DOC_LABEL: Record<string, string> = {
  selfie:         'Selfie',
  permis:         'Permis de conduire',
  carte_grise:    'Carte grise',
  vehicle_front:  'Photo avant véhicule',
  vehicle_rear:   'Photo arrière véhicule',
  piece_identite: "Pièce d'identité",
}

const REJECT_REASONS = [
  'Document illisible ou flou',
  'Document expiré',
  'Document incorrect (mauvais type)',
  'Informations ne correspondent pas',
  'Photo de mauvaise qualité',
  'Document falsifié',
]

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Drivers() {
  const [tab, setTab] = useState<'all' | 'validation'>('all')

  return (
    <div className="p-6 space-y-5 fade-in">
      {/* Tab switcher */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="page-title">Chauffeurs</h1>
        </div>
        <div className="flex gap-1 ml-auto bg-surface border border-border rounded-xl p-1">
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'all' ? 'bg-primary text-white' : 'text-muted hover:text-text-primary'}`}
          >
            Tous les chauffeurs
          </button>
          <button
            onClick={() => setTab('validation')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${tab === 'validation' ? 'bg-primary text-white' : 'text-muted hover:text-text-primary'}`}
          >
            <ShieldCheck size={13} />
            Validation des dossiers
          </button>
        </div>
      </div>

      {tab === 'all' ? <DriversTable /> : <ValidationTable />}
    </div>
  )
}

// ─── Tab 1: Tableau général ───────────────────────────────────────────────────
function DriversTable() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('')
  const [confirm, setConfirm] = useState<{ open: boolean; action: string; id: string | null }>({ open: false, action: '', id: null })
  const [drawerDriver, setDrawerDriver] = useState<any>(null)

  const PER_PAGE = 20

  const fetchDrivers = useCallback(async () => {
    setLoading(true)
    try {
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

      const { data, count, error } = await q
      if (error) throw error
      const filtered = search
        ? (data || []).filter((d: any) => d.profile?.full_name?.toLowerCase().includes(search.toLowerCase()))
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
    <>
      <p className="page-subtitle">{total} chauffeurs enregistrés</p>

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
                          <div className="text-xs text-muted">{driver.vehicle_brand} {driver.vehicle_plate}</div>
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

      {drawerDriver && (
        <DriverInfoDrawer driver={drawerDriver} onClose={() => setDrawerDriver(null)} />
      )}
    </>
  )
}

// ─── Tab 2: Validation des dossiers ──────────────────────────────────────────
function ValidationTable() {
  const [items,    setItems]    = useState<ApprovalDriver[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<ApprovalDriver | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('driver_approval_summary')
        .select('*')
        .order('last_upload_at', { ascending: false })
      if (error) throw error
      setItems(data || [])
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  function regStatusBadge(s: string | null) {
    if (s === 'approved') return 'badge-success'
    if (s === 'rejected') return 'badge-danger'
    return 'badge-warning'
  }
  function regStatusLabel(s: string | null) {
    if (s === 'approved') return 'Approuvé'
    if (s === 'rejected') return 'Rejeté'
    if (s === 'pending')  return 'En attente'
    return s || '—'
  }

  return (
    <>
      <p className="page-subtitle">{items.length} dossier(s) en attente de validation</p>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Chauffeur</th>
                  <th className="table-header">Véhicule</th>
                  <th className="table-header">Statut dossier</th>
                  <th className="table-header">Docs</th>
                  <th className="table-header">Dernier dépôt</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.driver_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {initials(item.full_name || 'NA')}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{item.full_name || '—'}</div>
                          <div className="text-xs text-muted">{item.phone || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-sm text-muted">
                      {item.vehicle_type || '—'} · {item.vehicle_plate || '—'}
                    </td>
                    <td className="table-cell">
                      <span className={regStatusBadge(item.registration_status)}>
                        {regStatusLabel(item.registration_status)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-success flex items-center gap-0.5">
                          <CheckCircle size={11} /> {item.approved_docs}
                        </span>
                        <span className="text-warning flex items-center gap-0.5">
                          <Clock size={11} /> {item.pending_docs}
                        </span>
                        <span className="text-danger flex items-center gap-0.5">
                          <AlertCircle size={11} /> {item.rejected_docs}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-muted text-xs">
                      {item.last_upload_at ? formatDate(item.last_upload_at) : '—'}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => setSelected(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
                      >
                        <FileText size={12} />
                        Examiner
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <EmptyState icon={ShieldCheck} title="Aucun dossier en attente" description="Tous les dossiers ont été traités" />
          )}
        </div>
      )}

      {selected && (
        <DriverValidationDrawer
          driver={selected}
          onClose={() => setSelected(null)}
          onRefresh={fetchItems}
        />
      )}
    </>
  )
}

// ─── Drawer Validation ────────────────────────────────────────────────────────
function DriverValidationDrawer({
  driver, onClose, onRefresh,
}: {
  driver: ApprovalDriver
  onClose: () => void
  onRefresh: () => void
}) {
  const [docs,       setDocs]       = useState<DriverDoc[]>([])
  const [loading,    setLoading]    = useState(true)
  const [rejectModal, setRejectModal] = useState<{ open: boolean; docId: string | null }>({ open: false, docId: null })
  const [rejectReason, setRejectReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadDocs()
  }, [driver.driver_id])

  async function loadDocs() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('driver_documents')
        .select('id, type, status, file_url, reject_reason, uploaded_at')
        .eq('driver_id', driver.driver_id)
        .order('uploaded_at', { ascending: false })
      if (error) throw error
      setDocs(data || [])
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function approveDoc(docId: string) {
    setProcessing(docId)
    try {
      const { error } = await supabase
        .from('driver_documents')
        .update({ status: 'approved', reject_reason: null, reviewed_at: new Date().toISOString() })
        .eq('id', docId)
      if (error) throw error
      toast.success('Document approuvé')
      loadDocs()
      onRefresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setProcessing(null)
    }
  }

  async function rejectDoc() {
    const finalReason = customReason.trim() || rejectReason
    if (!finalReason) { toast.error('Choisissez un motif de refus'); return }
    if (!rejectModal.docId) return
    setProcessing(rejectModal.docId)
    try {
      const { error } = await supabase
        .from('driver_documents')
        .update({
          status:        'rejected',
          reject_reason: finalReason,
          reviewed_at:   new Date().toISOString(),
        })
        .eq('id', rejectModal.docId)
      if (error) throw error
      toast.success('Document refusé')
      setRejectModal({ open: false, docId: null })
      setRejectReason('')
      setCustomReason('')
      loadDocs()
      onRefresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setProcessing(null)
    }
  }

  function docStatusIcon(s: string) {
    if (s === 'approved') return <CheckCircle size={14} className="text-success" />
    if (s === 'rejected') return <AlertCircle size={14} className="text-danger" />
    return <Clock size={14} className="text-warning" />
  }

  function docStatusLabel(s: string) {
    if (s === 'approved') return 'Approuvé'
    if (s === 'rejected') return 'Refusé'
    return 'En attente'
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[520px] bg-surface border-l border-border h-full overflow-y-auto slide-in-right flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <div>
            <h2 className="text-base font-semibold">Validation du dossier</h2>
            <p className="text-sm text-muted">{driver.full_name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-text-primary hover:bg-white/5">
            <X size={16} />
          </button>
        </div>

        {/* Docs */}
        <div className="flex-1 p-5 space-y-4">
          {loading ? (
            <TableSkeleton rows={3} cols={2} />
          ) : docs.length === 0 ? (
            <EmptyState icon={FileText} title="Aucun document" description="Le chauffeur n'a encore uploadé aucun document" />
          ) : (
            docs.map((doc) => (
              <div
                key={doc.id}
                className={`rounded-xl border p-4 space-y-3 transition-all ${
                  doc.status === 'approved' ? 'border-success/30 bg-success/5'
                  : doc.status === 'rejected' ? 'border-danger/30 bg-danger/5'
                  : 'border-border bg-bg'
                }`}
              >
                {/* Doc header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {docStatusIcon(doc.status)}
                    <span className="text-sm font-medium">
                      {DOC_LABEL[doc.type] ?? doc.type}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${
                    doc.status === 'approved' ? 'text-success'
                    : doc.status === 'rejected' ? 'text-danger'
                    : 'text-warning'
                  }`}>
                    {docStatusLabel(doc.status)}
                  </span>
                </div>

                {/* Image */}
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={doc.file_url}
                      alt={doc.type}
                      className="w-full h-48 object-cover rounded-lg border border-border hover:opacity-90 transition-opacity cursor-zoom-in"
                    />
                  </a>
                )}

                {/* Motif de refus */}
                {doc.status === 'rejected' && doc.reject_reason && (
                  <p className="text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">
                    Motif : {doc.reject_reason}
                  </p>
                )}

                {/* Actions — seulement si pending ou rejected */}
                {doc.status !== 'approved' && (
                  <div className="flex gap-2">
                    <button
                      disabled={processing === doc.id}
                      onClick={() => approveDoc(doc.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-success/15 text-success text-sm font-medium hover:bg-success/25 transition-all disabled:opacity-50"
                    >
                      <CheckCircle size={14} />
                      Approuver
                    </button>
                    <button
                      disabled={processing === doc.id}
                      onClick={() => setRejectModal({ open: true, docId: doc.id })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-danger/15 text-danger text-sm font-medium hover:bg-danger/25 transition-all disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      Refuser
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal motif de refus */}
        {rejectModal.open && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setRejectModal({ open: false, docId: null })} />
            <div className="relative bg-surface border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 z-10">
              <h3 className="font-semibold text-base">Motif de refus</h3>
              <div className="space-y-2">
                {REJECT_REASONS.map((r) => (
                  <label key={r} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={rejectReason === r}
                      onChange={() => { setRejectReason(r); setCustomReason('') }}
                      className="accent-primary"
                    />
                    <span className="text-sm">{r}</span>
                  </label>
                ))}
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Ou préciser :</p>
                <textarea
                  value={customReason}
                  onChange={(e) => { setCustomReason(e.target.value); setRejectReason('') }}
                  className="input-field resize-none h-20 text-sm"
                  placeholder="Motif personnalisé..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRejectModal({ open: false, docId: null })}
                  className="flex-1 py-2 rounded-lg border border-border text-sm text-muted hover:text-text-primary transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={rejectDoc}
                  disabled={processing === rejectModal.docId}
                  className="flex-1 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:bg-danger/80 transition-all disabled:opacity-50"
                >
                  Confirmer le refus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Driver Info Drawer (Tab 1) ───────────────────────────────────────────────
function DriverInfoDrawer({ driver, onClose }: { driver: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-96 bg-surface border-l border-border h-full overflow-y-auto slide-in-right">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Profil Chauffeur</h2>
            <button onClick={onClose} className="text-muted hover:text-text-primary">
              <X size={16} />
            </button>
          </div>

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
              <Row label="Marque" value={driver.vehicle_brand} />
              <Row label="Plaque" value={driver.vehicle_plate} />
              <Row label="Type" value={driver.vehicle_type} />
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
