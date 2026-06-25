import { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle, Globe, Key, Save, Shield, MapPin,
  Languages, Check, Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth.store'
import { useUIStore, type Lang } from '../stores/ui.store'
import { useT } from '../lib/i18n'
import { Logo } from '../components/Logo'
import { toast } from 'sonner'
import { cn } from '../lib/utils'

const WILAYAS = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou',
  'Alger','Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès',
  'Annaba','Guelma','Constantine','Médéa','Mostaganem',"M'Sila",'Mascara',
  'Ouargla','Oran','El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès',
  'El Tarf','Tindouf','Tissemsilt','El Oued','Khenchela','Souk Ahras',
  'Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent','Ghardaïa','Relizane',
]

const LANGS: { value: Lang; flag: string; label: string; native: string }[] = [
  { value: 'fr', flag: '🇫🇷', label: 'Français', native: 'FR' },
  { value: 'ar', flag: '🇩🇿', label: 'العربية',  native: 'AR' },
]

async function setConfig(key: string, value: unknown, userId: string) {
  const { error } = await supabase
    .from('app_config')
    .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: userId })
  if (error) throw error
}

export default function Settings() {
  const { profile } = useAuthStore()
  const { lang, setLang } = useUIStore()
  const t     = useT()
  const isRtl = lang === 'ar'

  const [maintenance,   setMaintenance]   = useState(false)
  const [appName,       setAppName]       = useState('WinRak')
  const [supportEmail,  setSupportEmail]  = useState('support@winrak.dz')
  const [supportPhone,  setSupportPhone]  = useState('+213 555 000 000')
  const [activeWilayas, setActiveWilayas] = useState<string[]>(['Alger','Oran','Constantine'])
  const [newPass,       setNewPass]       = useState('')

  const [loadingConfig, setLoadingConfig] = useState(true)
  const [savingInfo,    setSavingInfo]    = useState(false)
  const [savingMaint,   setSavingMaint]   = useState(false)
  const [savingWilayas, setSavingWilayas] = useState(false)
  const [savingPass,    setSavingPass]    = useState(false)

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true)
    try {
      const { data, error } = await supabase.from('app_config').select('key, value')
      if (error) throw error
      const map: Record<string, unknown> = {}
      ;(data || []).forEach(row => { map[row.key] = row.value })
      if (map['maintenance']    != null) setMaintenance(map['maintenance'] as boolean)
      if (map['app_name']       != null) setAppName(map['app_name'] as string)
      if (map['support_email']  != null) setSupportEmail(map['support_email'] as string)
      if (map['support_phone']  != null) setSupportPhone(map['support_phone'] as string)
      if (map['active_wilayas'] != null) setActiveWilayas(map['active_wilayas'] as string[])
    } catch {
      toast.error('Impossible de charger la configuration')
    } finally {
      setLoadingConfig(false)
    }
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  const saveInfo = async () => {
    if (!profile?.id) return
    setSavingInfo(true)
    try {
      await Promise.all([
        setConfig('app_name',      appName,      profile.id),
        setConfig('support_email', supportEmail, profile.id),
        setConfig('support_phone', supportPhone, profile.id),
      ])
      toast.success(t('save') + ' ✓')
    } catch (err: any) { toast.error(err.message) }
    finally { setSavingInfo(false) }
  }

  const toggleMaintenance = async () => {
    if (!profile?.id) return
    const next = !maintenance
    setMaintenance(next)
    setSavingMaint(true)
    try {
      await setConfig('maintenance', next, profile.id)
      toast.success(next ? '⚠️ Maintenance activée' : '✅ Application opérationnelle')
    } catch (err: any) {
      setMaintenance(!next)
      toast.error(err.message)
    } finally { setSavingMaint(false) }
  }

  const saveWilayas = async () => {
    if (!profile?.id) return
    setSavingWilayas(true)
    try {
      await setConfig('active_wilayas', activeWilayas, profile.id)
      toast.success(`${activeWilayas.length} wilayas sauvegardées ✓`)
    } catch (err: any) { toast.error(err.message) }
    finally { setSavingWilayas(false) }
  }

  const changePassword = async () => {
    if (!newPass || newPass.length < 6) { toast.error(t('min_chars')); return }
    setSavingPass(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) toast.error(error.message)
    else { toast.success('Mot de passe mis à jour ✓'); setNewPass('') }
    setSavingPass(false)
  }

  const toggleWilaya = (w: string) =>
    setActiveWilayas(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w])

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className={cn('p-6 space-y-6 fade-in', isRtl && 'text-right')} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div>
        <h1 className="page-title">{t('settings_title')}</h1>
        <p className="page-subtitle">{t('settings_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Langue ───────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className={cn('flex items-center gap-2 mb-4', isRtl && 'flex-row-reverse')}>
            <div className="w-8 h-8 rounded-lg bg-winrak/10 flex items-center justify-center flex-shrink-0">
              <Languages size={16} className="text-winrak" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t('language')}</h3>
              <p className="text-xs text-muted">{t('language_desc')}</p>
            </div>
          </div>

          {/* Compact horizontal lang switcher */}
          <div className="flex gap-2">
            {LANGS.map(l => {
              const active = lang === l.value
              return (
                <button
                  key={l.value}
                  onClick={() => setLang(l.value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 flex-1',
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-bg text-muted hover:border-primary/40 hover:text-text-primary'
                  )}
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className="text-sm font-medium">{l.label}</span>
                  {active && (
                    <span className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Check size={10} className="text-white" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── App Info ─────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className={cn('flex items-center gap-2 mb-5', isRtl && 'flex-row-reverse')}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Globe size={16} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold">{t('platform_info')}</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-1">{t('platform_name')}</label>
              <input value={appName} onChange={e => setAppName(e.target.value)} className="input-field" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">{t('support_email')}</label>
              <input value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="input-field" type="email" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">{t('support_phone')}</label>
              <input value={supportPhone} onChange={e => setSupportPhone(e.target.value)} className="input-field" dir="ltr" />
            </div>
            <button onClick={saveInfo} disabled={savingInfo} className="btn-primary">
              {savingInfo ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {savingInfo ? t('saving') : t('save')}
            </button>
          </div>
        </div>

        {/* ── Maintenance ──────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className={cn('flex items-center gap-2 mb-5', isRtl && 'flex-row-reverse')}>
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-warning" />
            </div>
            <h3 className="text-sm font-semibold">{t('maintenance')}</h3>
          </div>
          <div className={cn(
            'rounded-xl p-4 border transition-all duration-300',
            maintenance ? 'bg-danger/5 border-danger/30' : 'bg-bg border-border'
          )}>
            <div className={cn('flex items-center justify-between gap-4', isRtl && 'flex-row-reverse')}>
              <div>
                <p className="text-sm font-medium">
                  {maintenance ? t('maintenance_on') : t('maintenance_off')}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {maintenance
                    ? 'Les utilisateurs voient un message de maintenance'
                    : "L'application fonctionne normalement"}
                </p>
              </div>
              <button
                onClick={toggleMaintenance}
                disabled={savingMaint}
                className={cn(
                  'w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0',
                  maintenance ? 'bg-danger' : 'bg-border',
                  savingMaint && 'opacity-60 cursor-not-allowed'
                )}
              >
                <span className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300',
                  maintenance ? 'left-7' : 'left-1'
                )} />
              </button>
            </div>
          </div>
          {maintenance && (
            <div className="mt-3 bg-danger/5 border border-danger/20 rounded-lg p-3 text-xs text-danger">
              ⚠️ L'application est actuellement indisponible pour tous les utilisateurs.
            </div>
          )}
        </div>

        {/* ── Password ─────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className={cn('flex items-center gap-2 mb-5', isRtl && 'flex-row-reverse')}>
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <Key size={16} className="text-success" />
            </div>
            <h3 className="text-sm font-semibold">{t('change_password')}</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted mb-1">{t('new_password')}</label>
              <input
                type="password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder={t('min_chars')}
                className="input-field"
                dir="ltr"
              />
            </div>
            <button onClick={changePassword} disabled={savingPass || !newPass} className="btn-primary">
              {savingPass ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {savingPass ? t('updating') : t('update_password')}
            </button>
          </div>
        </div>

        {/* ── Admin Info ───────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-5 xl:col-span-2">
          <div className={cn('flex items-center gap-2 mb-5', isRtl && 'flex-row-reverse')}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold">{t('admin_account')}</h3>
          </div>
          <div className={cn('flex items-center gap-4', isRtl && 'flex-row-reverse')}>
            <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {profile?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className={isRtl ? 'text-right' : ''}>
              <p className="font-semibold text-base">{profile?.full_name || t('admin_name_default')}</p>
              <p className="text-sm text-muted">{profile?.email}</p>
              <span className="badge-primary mt-1.5 inline-block">{t('admin_label')}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Wilayas ──────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className={cn('flex items-center justify-between mb-5', isRtl && 'flex-row-reverse')}>
          <div className={cn('flex items-center gap-2', isRtl && 'flex-row-reverse')}>
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-warning" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t('active_wilayas')}</h3>
              <p className="text-xs text-muted">{activeWilayas.length} / {WILAYAS.length} wilayas actives</p>
            </div>
          </div>
          <div className={cn('flex gap-3', isRtl && 'flex-row-reverse')}>
            <button onClick={() => setActiveWilayas(WILAYAS)} className="text-xs text-primary hover:underline">
              Tout sélectionner
            </button>
            <span className="text-muted/40">·</span>
            <button onClick={() => setActiveWilayas([])} className="text-xs text-muted hover:text-danger transition-colors">
              Tout désélectionner
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          {WILAYAS.map(w => (
            <button
              key={w}
              onClick={() => toggleWilaya(w)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                activeWilayas.includes(w)
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-bg text-muted border border-border hover:border-muted/40 hover:text-text-primary'
              )}
            >
              {w}
            </button>
          ))}
        </div>
        <button onClick={saveWilayas} disabled={savingWilayas} className="btn-primary">
          {savingWilayas ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {savingWilayas ? t('saving') : t('save_wilayas')}
        </button>
      </div>

      {/* ── About ────────────────────────────────────────────────────────── */}
      <div className={cn('bg-surface border border-border rounded-xl p-5 flex items-center gap-4', isRtl && 'flex-row-reverse')}>
        <Logo size="md" variant="full" />
        <div className={cn(isRtl ? 'mr-4 text-right' : 'ml-4')}>
          <p className="text-sm text-muted">Version 1.0.0 · © 2026 WinRak. Tous droits réservés.</p>
          <p className="text-xs text-muted/50 mt-0.5">Plateforme VTC Algérienne — Admin Panel</p>
        </div>
      </div>

    </div>
  )
}
