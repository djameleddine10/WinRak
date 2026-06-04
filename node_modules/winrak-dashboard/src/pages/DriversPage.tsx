import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Star, CheckCircle, Ban, Shield } from 'lucide-react';
import { api } from '../services/api';

const STATUS_CONF: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:             { label: 'جديد',          color: '#9E9E9E', bg: '#F5F5F5' },
  DOCUMENTS_SUBMITTED: { label: 'وثائق مرفوعة',  color: '#2196F3', bg: '#E3F2FD' },
  UNDER_REVIEW:        { label: 'قيد المراجعة',  color: '#FF9800', bg: '#FFF3E0' },
  ACTIVE:              { label: 'نشط',            color: '#4CAF50', bg: '#E8F5E9' },
  SUSPENDED:           { label: 'موقوف',          color: '#F44336', bg: '#FFEBEE' },
  BANNED:              { label: 'محظور',          color: '#B71C1C', bg: '#FFCDD2' },
};

export default function DriversPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: () => api.get('/admin/drivers').then(r => r.data.drivers),
  });

  const drivers: any[] = (data || []).filter((d: any) =>
    (!search || d.user?.fullName?.includes(search) || d.user?.phone?.includes(search)) &&
    (!filterStatus || d.status === filterStatus)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1A1A2E]">إدارة السائقين</h1>
        <p className="text-gray-500 text-sm mt-1">قائمة السائقين وإدارة حالاتهم وعقودهم</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'نشطون الآن',    value: drivers.filter(d => d.isOnline).length,                         color: '#4CAF50' },
          { label: 'إجمالي النشطين',value: drivers.filter(d => d.status === 'ACTIVE').length,              color: '#1A1A2E' },
          { label: 'قيد المراجعة',  value: drivers.filter(d => d.status === 'UNDER_REVIEW').length,        color: '#FF9800' },
          { label: 'موقوفون',       value: drivers.filter(d => d.status === 'SUSPENDED').length,           color: '#F44336' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 flex-1 min-w-48">
          <Search size={16} className="text-gray-400" />
          <input type="text" placeholder="بحث بالاسم أو الهاتف..." value={search}
            onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm text-right" dir="rtl" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'ACTIVE', 'UNDER_REVIEW', 'DOCUMENTS_SUBMITTED', 'SUSPENDED'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                ${filterStatus === s ? 'bg-[#1A1A2E] text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {s ? (STATUS_CONF[s]?.label || s) : 'الكل'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['الإجراءات', 'العقد', 'الحالة', 'الرحلات', 'التقييم', 'الهاتف', 'الاسم'].map(h => (
                  <th key={h} className="text-right px-5 py-3 font-semibold text-gray-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver: any) => {
                const st = STATUS_CONF[driver.status] || STATUS_CONF['PENDING'];
                const contract = driver.contracts?.[0];
                return (
                  <tr key={driver.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <button onClick={() => setSelected(driver)} className="text-[#1A1A2E] font-semibold text-xs hover:text-[#F5A623] transition-colors">تفاصيل</button>
                    </td>
                    <td className="px-5 py-3">
                      {contract ? (
                        <div className="flex items-center gap-1 text-xs text-[#00D4AA]">
                          <Shield size={12} />
                          <span>{contract.contractType}</span>
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {driver.isOnline && <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />}
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#1A1A2E]">{driver.totalTrips}</td>
                    <td className="px-5 py-3">
                      {driver.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-[#F5A623] fill-[#F5A623]" />
                          <span className="font-semibold">{Number(driver.rating).toFixed(1)}</span>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs" dir="ltr">{driver.user?.phone}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full bg-[#1A1A2E]/10 flex items-center justify-center text-xs font-bold text-[#1A1A2E]">
                          {driver.user?.fullName?.[0] || '?'}
                        </div>
                        <span className="font-semibold text-[#1A1A2E]">{driver.user?.fullName || '—'}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {drivers.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">لا يوجد سائقون</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Driver Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              <h2 className="text-xl font-black text-[#1A1A2E]">ملف السائق</h2>
            </div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#1A1A2E] flex items-center justify-center text-2xl font-black text-white mx-auto mb-3">
                {selected.user?.fullName?.[0] || '?'}
              </div>
              <p className="text-xl font-bold text-[#1A1A2E]">{selected.user?.fullName}</p>
              <p className="text-gray-400 text-sm" dir="ltr">{selected.user?.phone}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'رحلة',   value: selected.totalTrips },
                { label: 'التقييم',value: selected.rating > 0 ? `${Number(selected.rating).toFixed(1)} ⭐` : '—' },
                { label: 'مركبات', value: selected.vehicles?.length || 0 },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="font-black text-[#1A1A2E]">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            {selected.contracts?.[0] && (
              <div className="bg-[#00D4AA]/10 rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-[#1A1A2E] text-right mb-2">🛡️ تفاصيل العقد</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="font-bold text-[#00D4AA]">{selected.contracts[0].profitDriverPercent}%</span><span className="text-gray-600">حصة السائق</span></div>
                  <div className="flex justify-between"><span className="font-bold text-[#F5A623]">{selected.contracts[0].lossWinrakPercent}%</span><span className="text-gray-600">WinRak تغطي الخسائر</span></div>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              {selected.status === 'ACTIVE' && (
                <button className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-50">
                  <Ban size={16} /> إيقاف
                </button>
              )}
              {selected.status !== 'ACTIVE' && selected.status !== 'BANNED' && (
                <button className="flex-1 py-3 rounded-xl bg-[#1A1A2E] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#2a2a4e]">
                  <CheckCircle size={16} /> تفعيل
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
