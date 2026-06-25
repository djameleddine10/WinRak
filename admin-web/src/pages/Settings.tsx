import { useState } from 'react'
import {
  AlertTriangle, Globe, Key, Save, Shield, MapPin,
  Sun, Moon, Languages, Check
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth.store'
import { useUIStore, type Theme, type Lang } from '../stores/ui.store'
import { useT } from '../lib/i18n'
import { Logo } from '../components/Logo'
import { toast } from 'sonner'
import { cn } from '../lib/utils'

const WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
  'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou',
  'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès',
  'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem', "M'Sila", 'Mascara',
  'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj', 'Boumerdès',
  'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela', 'Souk Ahras',
  'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane',
]

export default function Settings() {
  const { profile } = useAuthStore()
  const { theme, lang, setTheme, setLang } = useUIStore()
  const t = useT()

  const [maintenance,   setMaintenance]   = useState(false)
  const [appName,       setAppName]       = useState('WinRak')
  const [supportEmail,  setSupportEmail]  = useState('support@winrak.dz')
  const [supportPhone,  setSupportPhone]  = useState('+213 555 000 000')
  const [newPass,       setNewPass]       = useState('')
  const [saving,        setSaving]        = useState(false)
  const [activeWilayas, setActiveWilayas] = useState<string[]>(['Alger', 'Oran', 'Constantine'])

  const toggleWilaya = (w: string) =>
    setActiveWilayas(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w])

  const changePassword = async () => {
    if (!newPass || newPass.length < 6) {
      toast.error('Le nouveau mot de passe doit comporter au moins 6 caractères')
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) { toast.error(error.message) }
    else        { toast.success('Mot de passe mis à jour'); setNewPass('') }
    setSaving(false)
  }

  // ── Theme option card ────────────────────────────────────────────────────

  function ThemeCard({ value, icon: Icon, label, desc }: {
    value: Theme; icon: React.ElementType; label: string; desc: string
  }) {
    const active = theme === value
    return (
      <button
        onClick={() => setTheme(value)}
        className={cn(
          'flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-center',
          active
            ? 'border-primary bg-primary/10'
            : 'border-border bg-bg hover:border-primary/40'
        )}
      >
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          active ? 'bg-primary text-white' : 'bg-surface text-muted'
        )}>
          <Icon size={20} />
        </div>
        <div>
          <p className={cn('text-sm font-semibold', active ? 'text-primary' : 'text-text-primary')}>
            {label}
          </p>
          <p className="text-xs text-muted mt-0.5">{desc}</p>
        </div>
        {active && (
          <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check size={12} className="text-white" />
          </span>
        )}
      </button>
    )
  }

  // ── Language option card ─────────────────────────────────────────────────

  function LangCard({ value, flag, label, desc }: {
    value: Lang; flag: string; label: string; desc: string
  }) {
    const active = lang === value
    return (
      <button
        onClick={() => setLang(value)}
        className={cn(
          'flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-center',
          active
            ? 'border-primary bg-primary/10'
            : 'border-border bg-bg hover:border-primary/40'
        )}
      >
        <div className="text-3xl">{flag}</div>
        <div>
          <p className={cn('text-sm font-semibold', active ? 'text-primary' : 'text-text-primary')}>
            {label}
          </p>
          <p className="text-xs text-muted mt-0.5">{desc}</p>
        </div>
        {active && (
          <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check size={12} className="text-white" />
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="p-6 space-y-6 fade-in">
      <div>
        <h1 className="page-title">{t('settings_title')}</h1>
        <p className="page-subtitle">{t('settings_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Apparence ─────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sun size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t('appearance')}</h3>
              <p className="text-xs text-muted">{t('appearance_desc')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <ThemeCard
              value="dark"
              icon={Moon}
              label={t('theme_dark')}
              desc={t('theme_dark_desc')}
            />
            <ThemeCard
              value="light"
              icon={Sun}
              label={t('theme_light')}
              desc={t('theme_light_desc')}
            />
          </div>
        </div>

        {/* ── Langue ────────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-winrak/10 flex items-center justify-center">
              <Languages size={16} className="text-winrak" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t('language')}</h3>
              <p className="text-xs text-muted">{t('language_desc')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <LangCard
              value="fr"
              flag="🇫🇷"
              label={t('lang_fr')}
              desc={t('lang_fr_desc')}
            />
            <LangCard
              value="ar"
              flag="🇩🇿"
              label={t('lang_ar')}
              desc={t('lang_ar_desc')}
            />
          </div>
        </div>

        {/* ── App Info ──────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe size={16} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold">{t('platform_info')}</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-1">{t('platform_name')}</label>
              <input value={appName} onChange={e => setAppName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">{t('support_email')}</label>
              <input value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="input-field" type="email" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">{t('support_phone')}</label>
              <input value={supportPhone} onChange={e => setSupportPhone(e.target.value)} className="input-field" />
            </div>
            <button className="btn-primary">
              <Save size={14} />
              {t('save')}
            </button>
          </div>
        </div>

        {/* ── Maintenance ───────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle size={16} className="text-warning" />
            </div>
            <h3 className="text-sm font-semibold">{t('maintenance')}</h3>
          </div>
          <div className={cn(
            'rounded-xl p-4 mb-4 border',
            maintenance ? 'bg-danger/5 border-danger/30' : 'bg-bg border-border'
          )}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {maintenance ? t('maintenance_on') : t('maintenance_off')}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {maintenance
                    ? 'Les utilisateurs voient un message de maintenance'
                    : "L'application fonctionne normalement"
                  }
                </p>
              </div>
              <button
                onClick={() => setMaintenance(!maintenance)}
                className={cn(
                  'w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0',
                  maintenance ? 'bg-danger' : 'bg-border'
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
            <div className="bg-danger/5 border border-danger/20 rounded-lg p-3 text-xs text-danger">
              ⚠️ L'application est actuellement indisponible pour tous les utilisateurs.
            </div>
          )}
        </div>

        {/* ── Password ──────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
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
              />
            </div>
            <button onClick={changePassword} disabled={saving || !newPass} className="btn-primary">
              <Save size={14} />
              {saving ? t('updating') : t('update_password')}
            </button>
          </div>
        </div>

        {/* ── Admin Info ────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield size={16} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold">{t('admin_account')}</h3>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold">
              {profile?.full_name?.[0] || 'A'}
            </div>
            <div>
              <p className="font-semibold">{profile?.full_name || t('admin_name_default')}</p>
              <p className="text-sm text-muted">{profile?.email}</p>
              <span className="badge-primary mt-1 inline-block">{t('admin_label')}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Wilayas ─────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <MapPin size={16} className="text-warning" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t('active_wilayas')}</h3>
            <p className="text-xs text-muted">{activeWilayas.length} wilayas actives</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {WILAYAS.map(w => (
            <button
              key={w}
              onClick={() => toggleWilaya(w)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                activeWilayas.includes(w)
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-bg text-muted border border-border hover:border-border/80'
              )}
            >
              {w}
            </button>
          ))}
        </div>
        <button className="btn-primary mt-4">
          <Save size={14} />
          {t('save_wilayas')}
        </button>
      </div>

      {/* ── About ───────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
        <Logo size="md" variant="full" />
        <div className="ml-4">
          <p className="text-sm text-muted">Version 1.0.0 · © 2026 WinRak. Tous droits réservés.</p>
          <p className="text-xs text-muted/50">Plateforme VTC Algérienne — Admin Panel</p>
        </div>
      </div>
    </div>
  )
}
