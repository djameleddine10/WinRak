import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, XCircle, Eye, Shield, DollarSign } from 'lucide-react';
import { api } from '../services/api';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:      { label: 'قيد الانتظار', color: '#FF9800', bg: '#FFF3E0' },
  UNDER_REVIEW: { label: 'قيد المراجعة', color: '#2196F3', bg: '#E3F2FD' },
  APPROVED:     { label: 'موافق عليه',   color: '#4CAF50', bg: '#E8F5E9' },
  REJECTED:     { label: 'مرفوض',        color: '#F44336', bg: '#FFEBEE' },
  RESOLVED:     { label: 'محلول',        color: '#9E9E9E', bg: '#F5F5F5' },
};

const TYPE_MAP: Record<string, string> = {
  ACCIDENT_MINOR:          'حادث بسيط',
  ACCIDENT_MAJOR:          'حادث كبير',
  VEHICLE_BREAKDOWN:       'عطل السيارة',
  PASSENGER_DAMAGE:        'ضرر من الراكب',
  ROAD_INCIDENT:           'حادثة طريق',
  CANCELLED_TRIP_PENALTY:  'إلغاء مفاجئ',
};

export default function IncidentsPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', filterStatus],
    queryFn: () => api.get('/incidents', { params: { status: filterStatus || undefined } }).then(r => r.data.incidents),
    initialData: MOCK_INCIDENTS,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status, note }: any) =>
      api.patch(`/incidents/${id}/resolve`, { status, adminNote: note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setSelected(null);
    },
  });

  const incidents: any[] = data || MOCK_INCIDENTS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">إدارة الحوادث والخسائر</h1>
          <p className="text-gray-500 text-sm mt-1">مراجعة ومعالجة الحوادث المبلغ عنها</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-100">
          <AlertTriangle size={16} />
          <span className="font-semibold">3 حوادث تنتظر المراجعة</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الحوادث', value: '18', color: '#1A1A2E', icon: AlertTriangle },
          { label: 'بانتظار المراجعة', value: '3', color: '#FF9800', icon: Eye },
          { label: 'غطّتها WinRak', value: '124,500 دج', color: '#00D4AA', icon: Shield },
          { label: 'تحمّلها السائقون', value: '67,300 دج', color: '#F5A623', icon: DollarSign },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <s.icon size={18} style={{ color: s.color }} />
              <span className="text-gray-500 text-sm">{s.label}</span>
            </div>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border
              ${filterStatus === s ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {s ? (STATUS_MAP[s]?.label || s) : 'الكل'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['الحالة', 'WinRak تغطي', 'السائق يتحمل', 'الخسارة', 'النوع', 'السائق', 'التاريخ', ''].map((h) => (
                  <th key={h} className="text-right px-5 py-3 font-semibold text-gray-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc: any) => {
                const st = STATUS_MAP[inc.status] || STATUS_MAP['PENDING'];
                return (
                  <tr key={inc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color: st.color, backgroundColor: st.bg }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-[#00D4AA]">
                      {inc.winrakCovers ? `${inc.winrakCovers.toLocaleString()} دج` : '—'}
                    </td>
                    <td className="px-5 py-3 font-bold text-[#F5A623]">
                      {inc.driverCovers ? `${inc.driverCovers.toLocaleString()} دج` : '—'}
                    </td>
                    <td className="px-5 py-3 font-bold text-[#1A1A2E]">
                      {inc.totalLossAmount ? `${inc.totalLossAmount.toLocaleString()} دج` : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{TYPE_MAP[inc.incidentType] || inc.incidentType}</td>
                    <td className="px-5 py-3 font-medium">{inc.driver?.user?.fullName || '—'}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(inc.reportedAt).toLocaleDateString('ar-DZ')}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => { setSelected(inc); setAdminNote(''); }}
                        className="text-[#1A1A2E] hover:text-[#F5A623] font-semibold text-xs transition-colors">
                        تفاصيل
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              <h2 className="text-xl font-black text-[#1A1A2E]">تفاصيل الحادثة</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <InfoRow label="النوع" value={TYPE_MAP[selected.incidentType] || selected.incidentType} />
                <InfoRow label="السائق" value={selected.driver?.user?.fullName} />
                <InfoRow label="الوصف" value={selected.description} />
                <InfoRow label="إجمالي الخسارة" value={`${selected.totalLossAmount?.toLocaleString() || '—'} دج`} highlight />
              </div>

              {/* Loss Breakdown */}
              {selected.totalLossAmount > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#00D4AA]/10 rounded-xl p-4 text-center">
                    <p className="text-[#00D4AA] text-xl font-black">{selected.winrakCovers?.toLocaleString() || '—'} دج</p>
                    <p className="text-sm text-gray-600 mt-1">تغطي WinRak</p>
                  </div>
                  <div className="bg-[#F5A623]/10 rounded-xl p-4 text-center">
                    <p className="text-[#F5A623] text-xl font-black">{selected.driverCovers?.toLocaleString() || '—'} دج</p>
                    <p className="text-sm text-gray-600 mt-1">يتحمل السائق</p>
                  </div>
                </div>
              )}

              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none text-right focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20"
                rows={3}
                placeholder="ملاحظة الإدارة..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                dir="rtl"
              />
            </div>

            {selected.status === 'PENDING' || selected.status === 'UNDER_REVIEW' ? (
              <div className="flex gap-3">
                <button
                  onClick={() => resolveMutation.mutate({ id: selected.id, status: 'REJECTED', note: adminNote })}
                  disabled={resolveMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-500 font-bold hover:bg-red-50 transition-all"
                >
                  <XCircle size={18} /> رفض
                </button>
                <button
                  onClick={() => resolveMutation.mutate({ id: selected.id, status: 'APPROVED', note: adminNote })}
                  disabled={resolveMutation.isPending}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1A1A2E] text-white font-bold hover:bg-[#2a2a4e] transition-all"
                >
                  <CheckCircle size={18} /> الموافقة وصرف التعويض
                </button>
              </div>
            ) : (
              <div className="text-center py-3 text-gray-400 text-sm">
                تمت معالجة هذه الحادثة — {STATUS_MAP[selected.status]?.label}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const InfoRow = ({ label, value, highlight = false }: any) => (
  <div className="flex justify-between items-center">
    <span className={`font-semibold ${highlight ? 'text-[#1A1A2E] text-base' : 'text-gray-600'}`}>{value || '—'}</span>
    <span className="text-gray-400">{label}</span>
  </div>
);

// Mock data for demo
const MOCK_INCIDENTS = [
  { id: '1', incidentType: 'ACCIDENT_MINOR', status: 'PENDING', totalLossAmount: 15000, winrakCovers: 4500, driverCovers: 10500, description: 'خدش بسيط في الباب الخلفي', reportedAt: new Date().toISOString(), driver: { user: { fullName: 'علي بن عمر' } } },
  { id: '2', incidentType: 'VEHICLE_BREAKDOWN', status: 'APPROVED', totalLossAmount: 8000, winrakCovers: 2400, driverCovers: 5600, description: 'عطل في المحرك أثناء الرحلة', reportedAt: new Date(Date.now() - 86400000).toISOString(), driver: { user: { fullName: 'سامي مرزوق' } } },
  { id: '3', incidentType: 'PASSENGER_DAMAGE', status: 'UNDER_REVIEW', totalLossAmount: 3500, winrakCovers: 1050, driverCovers: 2450, description: 'الراكب ترك بقعة على المقعد', reportedAt: new Date(Date.now() - 172800000).toISOString(), driver: { user: { fullName: 'كمال شعبان' } } },
];
