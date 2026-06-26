import { useState, useEffect } from 'react'
import { Bell, Send, Users, Car, User, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import { toast } from 'sonner'

const TARGETS = [
  { value: 'all', label: 'Tous les utilisateurs', icon: Users },
  { value: 'drivers', label: 'Tous les chauffeurs', icon: Car },
  { value: 'passengers', label: 'Tous les passagers', icon: User },
]

export default function Notifications() {
  const [form, setForm] = useState({
    target: 'all',
    title: '',
    body: '',
    data: '',
  })
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true)
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (!error && data) setHistory(data)
      setLoadingHistory(false)
    }
    fetchHistory()
  }, [])

  const send = async () => {
    if (!form.title || !form.body) {
      toast.error('Titre et message requis')
      return
    }
    setSending(true)
    try {
      const payload = {
        target: form.target,
        title:  form.title,
        body:   form.body,
        data:   form.data ? (() => { try { return JSON.parse(form.data) } catch { return null } })() : null,
      }

      const { data, error } = await supabase.functions.invoke('notify-broadcast', {
        body: payload,
      })
      if (error) throw error

      const label = TARGETS.find(t => t.value === form.target)?.label
      toast.success(`Envoyé à ${label} — ${data.sent}/${data.total} appareils`)

      // Reload history from DB so the new row (inserted by the Edge Function) appears
      const { data: fresh } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (fresh) setHistory(fresh)

      setForm({ target: 'all', title: '', body: '', data: '' })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 space-y-6 fade-in">
      <div>
        <h1 className="page-title">Notifications Push</h1>
        <p className="page-subtitle">Envoyez des messages à vos utilisateurs</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell size={16} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold">Composer une notification</h3>
          </div>

          <div className="space-y-4">
            {/* Target */}
            <div>
              <label className="block text-xs text-muted mb-2">Destinataires</label>
              <div className="grid grid-cols-3 gap-2">
                {TARGETS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setForm({ ...form, target: t.value })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                      form.target === t.value
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-bg border-border text-muted hover:border-border/80'
                    }`}
                  >
                    <t.icon size={16} />
                    <span className="text-xs text-center leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs text-muted mb-1">Titre</label>
              <input
                placeholder="Ex: Offre spéciale du soir !"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="input-field"
                maxLength={100}
              />
              <p className="text-xs text-muted mt-0.5 text-right">{form.title.length}/100</p>
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs text-muted mb-1">Message</label>
              <textarea
                placeholder="Votre message ici..."
                value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
                className="input-field resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted mt-0.5 text-right">{form.body.length}/500</p>
            </div>

            {/* Preview */}
            {(form.title || form.body) && (
              <div className="bg-bg rounded-xl p-4 border border-border">
                <p className="text-xs text-muted mb-2 uppercase tracking-wider">Aperçu</p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-winrak to-yellow-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-winrak-dark">WR</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{form.title || 'Titre'}</p>
                    <p className="text-xs text-muted mt-0.5">{form.body || 'Message...'}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={send}
              disabled={sending || !form.title || !form.body}
              className="btn-primary w-full justify-center py-2.5"
            >
              <Send size={14} />
              {sending ? 'Envoi...' : 'Envoyer maintenant'}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Historique des notifications</h3>
          <div className="space-y-3">
            {loadingHistory && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={22} className="animate-spin text-primary" />
              </div>
            )}
            {!loadingHistory && history.length === 0 && (
              <div className="text-center py-12 text-muted">
                <Bell size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucune notification envoyée</p>
              </div>
            )}
            {history.map((n: any) => (
              <div key={n.id} className="bg-bg rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted mt-0.5">{n.body}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge-primary">{TARGETS.find(t => t.value === n.target)?.label}</span>
                      <span className="text-xs text-muted">{formatDate(n.created_at)}</span>
                      <span className="text-xs text-muted">{n.sent_count} appareils</span>
                    </div>
                  </div>
                  <span className={n.status === 'partial' ? 'badge-warning flex-shrink-0' : 'badge-success flex-shrink-0'}>
                    {n.status === 'no_tokens' ? 'Aucun token' : n.status === 'partial' ? 'Partiel' : 'Envoyé'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
