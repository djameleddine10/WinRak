import { useEffect, useState, useCallback } from 'react'
import {
  Car, Users, MapPin, TrendingUp, Activity, Clock,
  RefreshCw
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { supabase } from '../lib/supabase'
import { formatDZD, formatRelative, getStatusBadgeClass, getStatusLabel, getRideTypeColor } from '../lib/utils'
import { StatCardSkeleton } from '../components/SkeletonLoader'
import { toast } from 'sonner'

interface Stats {
  totalDrivers: number
  activeDrivers: number
  pendingDrivers: number
  totalPassengers: number
  todayPassengers: number
  totalRides: number
  todayRides: number
  weekRides: number
  totalRevenue: number
  todayRevenue: number
  weekRevenue: number
  liveDrivers: number
  pendingApplications: number
}

const RIDE_COLORS = {
  passenger: '#6366F1',
  women: '#F59E0B',
  delivery: '#22C55E',
  pharmacy: '#EF4444',
  food: '#8B5CF6',
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentRides, setRecentRides] = useState<any[]>([])
  const [ridesChart, setRidesChart] = useState<any[]>([])
  const [rideTypes, setRideTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [
        { count: totalDrivers },
        { count: activeDrivers },
        { count: pendingDrivers },
        { count: totalPassengers },
        { count: todayPassengers },
        { count: totalRides },
        { count: todayRides },
        { count: weekRides },
        { count: liveDrivers },
        { count: pendingApplications },
        { data: revenueData },
        { data: todayRevData },
        { data: weekRevData },
        { data: recent },
        { data: last30 },
        { data: typeBreakdown },
      ] = await Promise.all([
        supabase.from('drivers').select('*', { count: 'exact', head: true }),
        supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'passenger'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'passenger').gte('created_at', todayStart),
        supabase.from('rides').select('*', { count: 'exact', head: true }),
        supabase.from('rides').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('rides').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
        supabase.from('driver_locations').select('*', { count: 'exact', head: true }).eq('is_online', true),
        supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('rides').select('price').eq('status', 'completed'),
        supabase.from('rides').select('price').eq('status', 'completed').gte('created_at', todayStart),
        supabase.from('rides').select('price').eq('status', 'completed').gte('created_at', weekStart),
        supabase.from('rides').select('id, ride_type, status, price, created_at, passenger:profiles!passenger_id(full_name), driver:profiles!driver_id(full_name)').order('created_at', { ascending: false }).limit(20),
        supabase.from('rides').select('created_at, price, status').gte('created_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()).order('created_at', { ascending: true }),
        supabase.from('rides').select('ride_type').eq('status', 'completed'),
      ])

      const totalRevenue = (revenueData || []).reduce((s: number, r: any) => s + (r.price || 0), 0)
      const todayRevenue = (todayRevData || []).reduce((s: number, r: any) => s + (r.price || 0), 0)
      const weekRevenue = (weekRevData || []).reduce((s: number, r: any) => s + (r.price || 0), 0)

      setStats({
        totalDrivers: totalDrivers || 0,
        activeDrivers: activeDrivers || 0,
        pendingDrivers: pendingDrivers || 0,
        totalPassengers: totalPassengers || 0,
        todayPassengers: todayPassengers || 0,
        totalRides: totalRides || 0,
        todayRides: todayRides || 0,
        weekRides: weekRides || 0,
        totalRevenue,
        todayRevenue,
        weekRevenue,
        liveDrivers: liveDrivers || 0,
        pendingApplications: pendingApplications || 0,
      })

      setRecentRides(recent || [])

      // Chart: rides per day
      const grouped: Record<string, { rides: number; revenue: number }> = {}
      ;(last30 || []).forEach((r: any) => {
        const day = r.created_at.slice(0, 10)
        if (!grouped[day]) grouped[day] = { rides: 0, revenue: 0 }
        grouped[day].rides++
        if (r.status === 'completed') grouped[day].revenue += r.price || 0
      })
      const chartData = Object.entries(grouped).map(([date, v]) => ({
        date: date.slice(5),
        rides: v.rides,
        revenue: Math.round(v.revenue),
      }))
      setRidesChart(chartData)

      // Pie: ride types
      const typeCounts: Record<string, number> = {}
      ;(typeBreakdown || []).forEach((r: any) => {
        typeCounts[r.ride_type] = (typeCounts[r.ride_type] || 0) + 1
      })
      setRideTypes(Object.entries(typeCounts).map(([name, value]) => ({ name, value })))

    } catch (err: any) {
      toast.error('Erreur de chargement: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()

    // Realtime
    const channel = supabase
      .channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations' }, () => {})
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchStats])

  return (
    <div className="p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Vue d'ensemble de WinRak en temps réel</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary">
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({length: 8}).map((_,i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Chauffeurs"
            value={stats.totalDrivers}
            sub={`${stats.activeDrivers} actifs · ${stats.pendingDrivers} en attente`}
            icon={Car}
            color="primary"
          />
          <StatCard
            label="En ligne maintenant"
            value={stats.liveDrivers}
            sub="Chauffeurs actifs"
            icon={Activity}
            color="success"
            live
          />
          <StatCard
            label="Passagers"
            value={stats.totalPassengers}
            sub={`+${stats.todayPassengers} aujourd'hui`}
            icon={Users}
            color="warning"
          />
          <StatCard
            label="Candidatures"
            value={stats.pendingApplications}
            sub="En attente d'approbation"
            icon={Clock}
            color="danger"
            highlight={stats.pendingApplications > 0}
          />
          <StatCard
            label="Courses aujourd'hui"
            value={stats.todayRides}
            sub={`${stats.weekRides} cette semaine`}
            icon={MapPin}
            color="primary"
          />
          <StatCard
            label="Total Courses"
            value={stats.totalRides}
            sub="Depuis le lancement"
            icon={MapPin}
            color="muted"
          />
          <StatCard
            label="Revenus aujourd'hui"
            value={formatDZD(stats.todayRevenue)}
            sub={`${formatDZD(stats.weekRevenue)} cette semaine`}
            icon={TrendingUp}
            color="success"
            isText
          />
          <StatCard
            label="Revenus totaux"
            value={formatDZD(stats.totalRevenue)}
            sub="Depuis le lancement"
            icon={TrendingUp}
            color="muted"
            isText
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Line chart */}
        <div className="bg-surface border border-border rounded-xl p-5 xl:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Courses — 30 derniers jours</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ridesChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
              <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#111118', border: '1px solid #1E1E2E', borderRadius: 8 }}
                labelStyle={{ color: '#F9FAFB' }}
              />
              <Line type="monotone" dataKey="rides" stroke="#6366F1" strokeWidth={2} dot={false} name="Courses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Types de courses</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={rideTypes} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {rideTypes.map((entry) => (
                  <Cell key={entry.name} fill={RIDE_COLORS[entry.name as keyof typeof RIDE_COLORS] || '#6B7280'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#111118', border: '1px solid #1E1E2E', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {rideTypes.map(t => (
              <div key={t.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: RIDE_COLORS[t.name as keyof typeof RIDE_COLORS] || '#6B7280' }} />
                <span className="text-xs text-muted">{t.name} ({t.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue bar chart */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Revenus — 30 derniers jours (DZD)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={ridesChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
            <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#111118', border: '1px solid #1E1E2E', borderRadius: 8 }}
              formatter={(v: any) => [formatDZD(v), 'Revenu']}
            />
            <Bar dataKey="revenue" fill="#6366F1" radius={[4,4,0,0]} name="Revenu" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent rides */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Courses récentes</h3>
          <div className="flex items-center gap-1.5 text-xs text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success live-dot" />
            Temps réel
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Passager</th>
                <th className="table-header">Chauffeur</th>
                <th className="table-header">Type</th>
                <th className="table-header">Prix</th>
                <th className="table-header">Statut</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentRides.map(ride => (
                <tr key={ride.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="table-cell font-medium">{ride.passenger?.full_name || '—'}</td>
                  <td className="table-cell text-muted">{ride.driver?.full_name || '—'}</td>
                  <td className="table-cell">
                    <span className={getRideTypeColor(ride.ride_type)}>
                      {getStatusLabel(ride.ride_type)}
                    </span>
                  </td>
                  <td className="table-cell font-medium text-winrak">{formatDZD(ride.price)}</td>
                  <td className="table-cell">
                    <span className={getStatusBadgeClass(ride.status)}>
                      {getStatusLabel(ride.status)}
                    </span>
                  </td>
                  <td className="table-cell text-muted text-xs">{formatRelative(ride.created_at)}</td>
                </tr>
              ))}
              {recentRides.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted text-sm">Aucune course récente</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, sub, icon: Icon, color, live, highlight, isText }: any) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    muted: 'bg-white/5 text-muted',
  }

  return (
    <div className={`stat-card relative overflow-hidden ${highlight ? 'border-danger/40' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={17} />
        </div>
        {live && (
          <div className="flex items-center gap-1 text-xs text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success live-dot" />
            Live
          </div>
        )}
      </div>
      <div className={`${isText ? 'text-xl' : 'text-3xl'} font-bold text-text-primary mb-0.5`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
      <div className="text-xs text-muted/70 mt-0.5">{sub}</div>
    </div>
  )
}
