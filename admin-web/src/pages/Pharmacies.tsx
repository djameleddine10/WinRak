import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit, Trash2, Pill, ToggleLeft, ToggleRight, X, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { TableSkeleton } from '../components/SkeletonLoader'
import { Pagination } from '../components/Pagination'
import { EmptyState } from '../components/EmptyState'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { toast } from 'sonner'

const MED_CATEGORIES = ['مسكنات', 'مضادات حيوية', 'فيتامينات', 'جلدية', 'عيون', 'أنف وأذن']

export default function Pharmacies() {
  const [pharmacies, setPharmacies] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const PER_PAGE = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count, error } = await supabase
        .from('pharmacies')
        .select('*, medicines(count)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
      if (error) throw error
      setPharmacies(data || [])
      setTotal(count || 0)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetch() }, [fetch])

  const toggleStatus = async (p: any) => {
    const newStatus = p.status === 'active' ? 'pending' : 'active'
    setPharmacies(prev => prev.map(x => x.id === p.id ? { ...x, status: newStatus } : x))
    const { error } = await supabase.from('pharmacies').update({ status: newStatus }).eq('id', p.id)
    if (error) {
      toast.error(error.message)
      setPharmacies(prev => prev.map(x => x.id === p.id ? { ...x, status: p.status } : x))
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('pharmacies').delete().eq('id', deleteId)
    if (error) { toast.error(error.message); return }
    toast.success('Pharmacie supprimée')
    setDeleteId(null)
    fetch()
  }

  return (
    <div className="p-6 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Pharmacies</h1>
          <p className="page-subtitle">{total} pharmacies</p>
        </div>
        <button onClick={() => { setEditing(null); setFormOpen(true) }} className="btn-primary">
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Pharmacie</th>
                  <th className="table-header">Ville</th>
                  <th className="table-header">Téléphone</th>
                  <th className="table-header">Horaires</th>
                  <th className="table-header">Médicaments</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pharmacies.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
                          <Pill size={14} className="text-danger" />
                        </div>
                        <span className="font-medium text-sm">{p.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-muted">{p.city}</td>
                    <td className="table-cell text-muted">{p.phone}</td>
                    <td className="table-cell text-xs text-muted">{p.open_from} – {p.open_to}</td>
                    <td className="table-cell text-center">{p.medicines?.[0]?.count || 0}</td>
                    <td className="table-cell">
                      <span className={p.status === 'active' ? 'badge-success' : 'badge-warning'}>
                        {p.status === 'active' ? 'Actif' : 'En attente'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditing(p); setFormOpen(true) }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-primary hover:bg-primary/10 transition-all">
                          <Edit size={13} />
                        </button>
                        <button onClick={() => toggleStatus(p)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-warning hover:bg-warning/10 transition-all">
                          {p.status === 'active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </button>
                        <button onClick={() => setDeleteId(p.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pharmacies.length === 0 && <EmptyState icon={Pill} title="Aucune pharmacie" description="Ajoutez votre première pharmacie" />}
          <Pagination page={page} total={total} perPage={PER_PAGE} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer la pharmacie"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {formOpen && (
        <PharmacyForm editing={editing} onClose={() => { setFormOpen(false); fetch() }} />
      )}
    </div>
  )
}

function PharmacyForm({ editing, onClose }: { editing: any; onClose: () => void }) {
  const [form, setForm] = useState({
    name: editing?.name || '',
    city: editing?.city || '',
    address: editing?.address || '',
    phone: editing?.phone || '',
    open_from: editing?.open_from || '08:00',
    open_to: editing?.open_to || '23:00',
    status: editing?.status || 'pending',
  })
  const [saving, setSaving] = useState(false)
  const [medicines, setMedicines] = useState<any[]>([])
  const [tab, setTab] = useState<'info' | 'medicines'>('info')

  useEffect(() => {
    if (editing?.id) {
      supabase.from('medicines').select('*').eq('pharmacy_id', editing.id).then(({ data }) => {
        setMedicines(data || [])
      })
    }
  }, [editing])

  const save = async () => {
    setSaving(true)
    try {
      if (editing?.id) {
        const { error } = await supabase.from('pharmacies').update(form).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('pharmacies').insert(form)
        if (error) throw error
      }
      toast.success(editing ? 'Pharmacie mise à jour' : 'Pharmacie ajoutée')
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[480px] bg-surface border-l border-border h-full overflow-y-auto slide-in-right">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{editing ? 'Modifier' : 'Nouvelle'} Pharmacie</h2>
            <button onClick={onClose}><X size={18} className="text-muted" /></button>
          </div>

          {editing && (
            <div className="flex gap-2 mb-6">
              {(['info', 'medicines'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    tab === t ? 'bg-primary text-white' : 'text-muted hover:text-text-primary'
                  }`}>
                  {t === 'info' ? 'Informations' : 'Médicaments'}
                </button>
              ))}
            </div>
          )}

          {tab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1">Nom</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted mb-1">Ville</label>
                  <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Téléphone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Adresse</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted mb-1">Ouverture</label>
                  <input type="time" value={form.open_from} onChange={e => setForm({ ...form, open_from: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Fermeture</label>
                  <input type="time" value={form.open_to} onChange={e => setForm({ ...form, open_to: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Statut</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
                  <option value="active">Actif</option>
                  <option value="pending">En attente</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'medicines' && editing && (
            <MedicinesManager pharmacyId={editing.id} items={medicines} onChange={setMedicines} />
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Annuler</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">
              <Save size={14} />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MedicinesManager({ pharmacyId, items, onChange }: any) {
  const [newItem, setNewItem] = useState({ name: '', description: '', price: 0, category: MED_CATEGORIES[0], stock_available: true })

  const addItem = async () => {
    const { data, error } = await supabase.from('medicines').insert({ ...newItem, pharmacy_id: pharmacyId }).select().single()
    if (error) { toast.error(error.message); return }
    onChange([...items, data])
    setNewItem({ name: '', description: '', price: 0, category: MED_CATEGORIES[0], stock_available: true })
    toast.success('Médicament ajouté')
  }

  const deleteItem = async (id: string) => {
    await supabase.from('medicines').delete().eq('id', id)
    onChange(items.filter((i: any) => i.id !== id))
  }

  const toggleItem = async (item: any) => {
    await supabase.from('medicines').update({ stock_available: !item.stock_available }).eq('id', item.id)
    onChange(items.map((i: any) => i.id === item.id ? { ...i, stock_available: !i.stock_available } : i))
  }

  return (
    <div className="space-y-4">
      <div className="bg-bg rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">Nouveau médicament</p>
        <input placeholder="Nom du médicament" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="input-field" />
        <div className="grid grid-cols-2 gap-3">
          <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className="input-field">
            {MED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" placeholder="Prix (DZD)" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: +e.target.value })} className="input-field" />
        </div>
        <button onClick={addItem} className="btn-primary w-full justify-center">
          <Plus size={14} /> Ajouter
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between bg-bg rounded-lg px-3 py-2.5">
            <div>
              <div className="text-sm font-medium">{item.name}</div>
              <div className="text-xs text-muted">{item.price} DZD · {item.category}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleItem(item)}
                className={`text-xs px-2 py-0.5 rounded-full ${item.stock_available ? 'badge-success' : 'badge-muted'}`}>
                {item.stock_available ? 'En stock' : 'Épuisé'}
              </button>
              <button onClick={() => deleteItem(item.id)}
                className="w-6 h-6 rounded flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-all">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-sm text-muted py-6">Aucun médicament</p>
        )}
      </div>
    </div>
  )
}
