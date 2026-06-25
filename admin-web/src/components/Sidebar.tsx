import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Car, MapPin, Store, Pill,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  TrendingUp, Shield, Map
} from 'lucide-react'
import { useState } from 'react'
import { Logo } from './Logo'
import { useAuthStore } from '../stores/auth.store'
import { cn } from '../lib/utils'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/map', icon: Map, label: 'Carte en direct' },
  { to: '/drivers', icon: Car, label: 'Chauffeurs' },
  { to: '/passengers', icon: Users, label: 'Passagers' },
  { to: '/rides', icon: MapPin, label: 'Courses' },
  { to: '/restaurants', icon: Store, label: 'Restaurants' },
  { to: '/pharmacies', icon: Pill, label: 'Pharmacies' },
  { to: '/pricing', icon: TrendingUp, label: 'Tarification' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen bg-sidebar border-r border-border z-40',
        'flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border flex-shrink-0">
        {collapsed ? (
          <Logo size="sm" variant="icon" />
        ) : (
          <Logo size="sm" variant="full" />
        )}
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
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                )}
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">{label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Admin profile */}
      <div className="p-2 border-t border-border space-y-1">
        {!collapsed && profile && (
          <div className="px-3 py-2 rounded-lg flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield size={12} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">
                {profile.full_name || 'Admin'}
              </p>
              <p className="text-[10px] text-muted truncate">{profile.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-all duration-200"
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-text-primary hover:border-primary/50 transition-all duration-200 z-50"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
