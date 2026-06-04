import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Car, Users, DollarSign, TrendingUp, AlertTriangle, MapPin, Clock, Star } from 'lucide-react';
import { api } from '../services/api';

const C = { primary: '#1A1A2E', secondary: '#F5A623', accent: '#00D4AA', error: '#FF4757', success: '#2ED573' };

const WEEK_DATA = [
  { day: 'الأحد',    rides: 142, revenue: 45200 },
  { day: 'الإثنين',  rides: 189, revenue: 58300 },
  { day: 'الثلاثاء', rides: 156, revenue: 49800 },
  { day: 'الأربعاء', rides: 221, revenue: 71400 },
  { day: 'الخميس',  rides: 198, revenue: 63200 },
  { day: 'الجمعة',  rides: 267, revenue: 89600 },
  { day: 'السبت',   rides: 312, revenue: 103500 },
];

const SERVICE_PIE = [
  { name: 'GO', value: 48, color: C.primary },
  { name: 'PLUS', value: 28, color: C.secondary },
  { name: 'XL', value: 12, color: C.accent },
  { name: 'SHE', value: 8, color: '#9B59B6' },
  { name: 'DELIVER', value: 4, color: C.error },
];

const StatCard = ({ label, value, sub, icon: Icon, color, trend }: any) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
        <Icon size={20} style={{ color }} />
      </div>
      {trend != null && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
          {trend >= 0 ? '+' : ''}{trend}
        </span>
      )}
    </div>
    <p className="text-2xl font-black text-[#1A1A2E] mb-1">{value}</p>
    <p className="text-sm font-semibold text-gray-700">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

export default function OverviewPage() {
  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data.stats),
    refetchInterval: 15000,
  });

  const { data: ridesData } = useQuery({
    queryKey: ['admin-rides-recent'],
    queryFn: () => api.get('/admin/rides', { params: { limit: 5 } }).then(r => r.data.rides),
  });

  const s = statsData || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">نظرة عامة 👋</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-green-50 text-green-600 px-3 py-1.5 rounded-xl border border-green-100">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-semibold">مباشر</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="رحلات اليوم"       value={s.todayRides    ?? '—'} sub="منذ منتصف الليل"    icon={Car}         color={C.primary}   trend={s.todayRides > 0 ? 12 : null} />
        <StatCard label="الإيرادات"          value={s.todayRevenue != null ? `${Math.round(s.todayRevenue).toLocaleString()} دج` : '—'} sub="اليوم" icon={DollarSign}  color={C.secondary} />
        <StatCard label="السائقون المتصلون"  value={s.onlineDrivers ?? '—'} sub={`من ${s.totalDrivers ?? '—'} نشط`} icon={Users} color={C.accent} />
        <StatCard label="رحلات جارية"        value={s.activeRides   ?? '—'} sub="الآن"               icon={MapPin}       color="#9B59B6"     />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs text-gray-400">آخر 7 أيام</span>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-[#F5A623]" />
              <h3 className="font-bold text-[#1A1A2E]">الإيرادات والرحلات</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={WEEK_DATA}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.secondary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any, n: any) => [n === 'revenue' ? `${v.toLocaleString()} دج` : v, n === 'revenue' ? 'الإيرادات' : 'الرحلات']} />
              <Area type="monotone" dataKey="revenue" stroke={C.secondary} fill="url(#grad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-[#1A1A2E] mb-5">توزيع الخدمات</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={SERVICE_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {SERVICE_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {SERVICE_PIE.map(item => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="font-semibold">{item.value}%</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{item.name}</span>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Rides from API */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <button className="text-xs text-[#00D4AA] font-semibold">عرض الكل</button>
            <h3 className="font-bold text-[#1A1A2E]">آخر الرحلات</h3>
          </div>
          <div className="space-y-3">
            {(ridesData || []).map((ride: any) => (
              <div key={ride.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${ride.status === 'COMPLETED' ? 'bg-green-50 text-green-600'
                    : ride.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600'
                    : 'bg-yellow-50 text-yellow-600'}`}>
                    {ride.status === 'COMPLETED' ? 'مكتملة' : ride.status === 'IN_PROGRESS' ? 'جارية' : ride.status}
                  </span>
                  <span className="font-bold text-[#F5A623] text-sm">{ride.totalFare ? `${Math.round(ride.totalFare)} دج` : '—'}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#1A1A2E]">{ride.pickupAddress} ← {ride.dropoffAddress}</p>
                  <p className="text-xs text-gray-400">{ride.driver?.user?.fullName || 'بحث...'}</p>
                </div>
              </div>
            ))}
            {(!ridesData || ridesData.length === 0) && (
              <p className="text-center text-gray-400 text-sm py-4">لا توجد رحلات بعد</p>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-[#1A1A2E] mb-4">مؤشرات الأداء</h3>
          <div className="space-y-4">
            {[
              { label: 'متوسط وقت الاستجابة', value: '3.2 دق',  icon: Clock,         color: C.accent,   progress: 68 },
              { label: 'معدل إكمال الرحلات',   value: '94.5%',   icon: TrendingUp,    color: C.success,  progress: 94 },
              { label: 'متوسط تقييم السائقين',  value: '4.7 / 5', icon: Star,          color: C.secondary,progress: 94 },
              { label: 'الحوادث المفتوحة',       value: `${s.pendingIncidents ?? '—'}`, icon: AlertTriangle, color: C.error, progress: Math.min((s.pendingIncidents || 0) * 10, 100) },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-sm" style={{ color: item.color }}>{item.value}</span>
                  <div className="flex items-center gap-1.5">
                    <item.icon size={14} style={{ color: item.color }} />
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.progress}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
