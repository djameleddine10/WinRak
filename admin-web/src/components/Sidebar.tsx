import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Car, MapPin, Store, Pill,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  TrendingUp, Shield, Map
} from 'lucide-react'
import { Logo } from './Logo'
import { useAuthStore } from '../stores/auth.store'
import { useSidebarStore } from '../stores/sidebar.store'
import { useT } from '../lib/i18n'
import { useUIStore } from '../stores/ui.store'
import { cn } from '../lib/utils'

export function Sidebar() {
  const { collapsed, toggle } = useSidebarStore()
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const t   = useT()
  const lang = useUIStore(s => s.lang)
  const isRtl = lang === 'ar'

  const NAV = [
    { to: '/dashboard',    icon: LayoutDashboard, label: t('dashboard') },
    { to: '/map',          icon: Map,             label: t('map') },
    { to: '/drivers',      icon: Car,             label: t('drivers') },
    { to: '/passengers',   icon: Users,           label: t('passengers') },
    { to: '/rides',        icon: MapPin,          label: t('rides') },
    { to: '/restaurants',  icon: Store,           label: t('restaurants') },
    { to: '/pharmacies',   icon: Pill,            label: t('pharmacies') },
    { to: '/pricing',      icon: TrendingUp,      label: t('pricing') },
    { to: '/notifications',icon: Bell,            label: t('notifications') },
    { to: '/settings',     icon: Settings,        label: t('settings') },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'winrak-sidebar fixed top-0 h-screen bg-sidebar border-border z-40',
        'flex flex-col transition-all duration-300',
        isRtl ? 'border-l right-0' : 'border-r left-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border flex-shrink-0">
        {collapsed ? <Logo size="sm" variant="icon" /> : <Logo size="sm" variant="full" />}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                isRtl ? 'flex-row-reverse text-right' : '',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted hover:text-text-primary hover:bg-white/5'
              )
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className={cn(
                    'sidebar-active-bar absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary',
                    isRtl ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'
                  )} />
                )}
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Admin profile */}
      <div className="p-2 border-t border-border space-y-1">
        {!collapsed && profile && (
          <div className={cn(
            'px-3 py-2 rounded-lg flex items-center gap-2',
            isRtl && 'flex-row-reverse'
          )}>
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield size={12} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">
                {profile.full_name || t('admin_name_default')}
              </p>
              <p className="text-[10px] text-muted truncate">{profile.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-all duration-200',
            isRtl && 'flex-row-reverse'
          )}
          title={collapsed ? t('logout') : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">{t('logout')}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className={cn(
          'collapse-btn absolute top-20 w-6 h-6 rounded-full bg-surface border border-border',
          'flex items-center justify-center text-muted hover:text-text-primary',
          'hover:border-primary/50 transition-all duration-200 z-50',
          isRtl ? '-left-3' : '-right-3'
        )}
      >
        {isRtl
          ? (collapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />)
          : (collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />)
        }
      </button>
    </aside>
  )
}
