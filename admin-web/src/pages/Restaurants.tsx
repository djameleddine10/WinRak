import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit, Trash2, Store, ToggleLeft, ToggleRight, X, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'

import { TableSkeleton } from '../components/SkeletonLoader'
import { Pagination } from '../components/Pagination'
import { EmptyState } from '../components/EmptyState'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { toast } from 'sonner'

const CATEGORIES = ['بيتزا', 'برغر', 'مشاوي', 'سلطات', 'حلويات', 'مأكولات بحرية', 'أخرى']

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState<any[]>([])
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
        .from('restaurants')
        .select('*, menu_items(count)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
      if (error) throw error
      setRestaurants(data || [])
      setTotal(count || 0)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetch() }, [fetch])

  const toggleStatus = async (r: any) => {
    const newStatus = r.status === 'active' ? 'pending' : 'active'
    // Optimistic
    setRestaurants(prev => prev.map(x => x.id === r.id ? { ...x, status: newStatus } : x))
    const { error } = await supabase.from('restaurants').update({ status: newStatus }).eq('id', r.id)
    if (error) {
      toast.error(error.message)
      setRestaurants(prev => prev.map(x => x.id === r.id ? { ...x, status: r.status } : x))
    } else {
      toast.success(`Statut mis à jour`)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('restaurants').delete().eq('id', deleteId)
    if (error) { toast.error(error.message); return }
    toast.success('Restaurant supprimé')
    setDeleteId(null)
    fetch()
  }

  return (
    <div className="p-6 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Restaurants</h1>
          <p className="page-subtitle">{total} restaurants</p>
        </div>
        <button onClick={() => { setEditing(null); setFormOpen(true) }} className="btn-primary">
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Nom</th>
                  <th className="table-header">Catégorie</th>
                  <th className="table-header">Ville</th>
                  <th className="table-header">Horaires</th>
                  <th className="table-header">Articles</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map(r => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        {r.logo_url ? (
                          <img src={r.logo_url} className="w-8 h-8 rounded-lg object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                            <Store size={14} className="text-warning" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">{r.name}</div>
                          <div className="text-xs text-muted">{r.name_fr}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-muted">{r.category}</td>
                    <td className="table-cell text-muted">{r.city}</td>
                    <td className="table-cell text-xs text-muted">{r.open_from} – {r.open_to}</td>
                    <td className="table-cell text-center">{r.menu_items?.[0]?.count || 0}</td>
                    <td className="table-cell">
                      <span className={r.status === 'active' ? 'badge-success' : 'badge-warning'}>
                        {r.status === 'active' ? 'Actif' : 'En attente'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditing(r); setFormOpen(true) }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-primary hover:bg-primary/10 transition-all">
                          <Edit size={13} />
                        </button>
                        <button onClick={() => toggleStatus(r)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-warning hover:bg-warning/10 transition-all">
                          {r.status === 'active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </button>
                        <button onClick={() => setDeleteId(r.id)}
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
          {restaurants.length === 0 && <EmptyState icon={Store} title="Aucun restaurant" description="Ajoutez votre premier restaurant" />}
          <Pagination page={page} total={total} perPage={PER_PAGE} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Supprimer le restaurant"
        message="Cette action est irréversible. Tous les articles du menu seront supprimés."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {formOpen && (
        <RestaurantForm
          editing={editing}
          onClose={() => { setFormOpen(false); fetch() }}
        />
      )}
    </div>
  )
}

function RestaurantForm({ editing, onClose }: { editing: any; onClose: () => void }) {
  const [form, setForm] = useState({
    name: editing?.name || '',
    name_fr: editing?.name_fr || '',
    category: editing?.category || CATEGORIES[0],
    city: editing?.city || '',
    address: editing?.address || '',
    phone: editing?.phone || '',
    logo_url: editing?.logo_url || '',
    cover_url: editing?.cover_url || '',
    open_from: editing?.open_from || '08:00',
    open_to: editing?.open_to || '23:00',
    delivery_fee: editing?.delivery_fee || 150,
    min_order: editing?.min_order || 500,
    status: editing?.status || 'pending',
  })
  const [saving, setSaving] = useState(false)
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [tab, setTab] = useState<'info' | 'menu'>('info')

  useEffect(() => {
    if (editing?.id) {
      supabase.from('menu_items').select('*').eq('restaurant_id', editing.id).then(({ data }) => {
        setMenuItems(data || [])
      })
    }
  }, [editing])

  const save = async () => {
    setSaving(true)
    try {
      if (editing?.id) {
        const { error } = await supabase.from('restaurants').update(form).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('restaurants').insert(form)
        if (error) throw error
      }
      toast.success(editing ? 'Restaurant mis à jour' : 'Restaurant ajouté')
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        className="input-field"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[520px] bg-surface border-l border-border h-full overflow-y-auto slide-in-right">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{editing ? 'Modifier' : 'Nouveau'} Restaurant</h2>
            <button onClick={onClose}><X size={18} className="text-muted" /></button>
          </div>

          {editing && (
            <div className="flex gap-2 mb-6">
              {(['info', 'menu'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    tab === t ? 'bg-primary text-white' : 'text-muted hover:text-text-primary'
                  }`}>
                  {t === 'info' ? 'Informations' : 'Menu'}
                </button>
              ))}
            </div>
          )}

          {tab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {field('Nom (Arabe)', 'name')}
                {field('Nom (Français)', 'name_fr')}
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Catégorie</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {field('Ville', 'city')}
                {field('Téléphone', 'phone')}
              </div>
              {field('Adresse', 'address')}
              <div className="grid grid-cols-2 gap-4">
                {field('Ouverture', 'open_from', 'time')}
                {field('Fermeture', 'open_to', 'time')}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted mb-1">Frais de livraison (DZD)</label>
                  <input type="number" value={form.delivery_fee} onChange={e => setForm({ ...form, delivery_fee: +e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Commande min (DZD)</label>
                  <input type="number" value={form.min_order} onChange={e => setForm({ ...form, min_order: +e.target.value })} className="input-field" />
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

          {tab === 'menu' && editing && (
            <MenuItemsManager restaurantId={editing.id} items={menuItems} onChange={setMenuItems} />
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

function MenuItemsManager({ restaurantId, items, onChange }: any) {
  const [newItem, setNewItem] = useState({ name: '', description: '', price: 0, category: '', image_url: '', is_available: true })

  const addItem = async () => {
    const { data, error } = await supabase.from('menu_items').insert({ ...newItem, restaurant_id: restaurantId }).select().single()
    if (error) { toast.error(error.message); return }
    onChange([...items, data])
    setNewItem({ name: '', description: '', price: 0, category: '', image_url: '', is_available: true })
    toast.success('Article ajouté')
  }

  const deleteItem = async (id: string) => {
    await supabase.from('menu_items').delete().eq('id', id)
    onChange(items.filter((i: any) => i.id !== id))
  }

  const toggleItem = async (item: any) => {
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id)
    onChange(items.map((i: any) => i.id === item.id ? { ...i, is_available: !i.is_available } : i))
  }

  return (
    <div className="space-y-4">
      {/* Add new */}
      <div className="bg-bg rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">Nouvel article</p>
        <input placeholder="Nom de l'article" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="input-field" />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Catégorie" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className="input-field" />
          <input type="number" placeholder="Prix (DZD)" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: +e.target.value })} className="input-field" />
        </div>
        <button onClick={addItem} className="btn-primary w-full justify-center">
          <Plus size={14} /> Ajouter l'article
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {items.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between bg-bg rounded-lg px-3 py-2.5">
            <div>
              <div className="text-sm font-medium">{item.name}</div>
              <div className="text-xs text-muted">{item.price} DZD · {item.category}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleItem(item)}
                className={`text-xs px-2 py-0.5 rounded-full ${item.is_available ? 'badge-success' : 'badge-muted'}`}>
                {item.is_available ? 'Dispo' : 'Indispo'}
              </button>
              <button onClick={() => deleteItem(item.id)}
                className="w-6 h-6 rounded flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition-all">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-sm text-muted py-6">Aucun article dans le menu</p>
        )}
      </div>
    </div>
  )
}
