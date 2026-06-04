import React, { useState } from 'react';
import { Search, Filter, Car } from 'lucide-react';

const STATUS_CONF: Record<string, { label: string; color: string; bg: string }> = {
  REQUESTED:   { label: 'مطلوبة',   color: '#9E9E9E', bg: '#F5F5F5' },
  SEARCHING:   { label: 'بحث',      color: '#9C27B0', bg: '#F3E5F5' },
  ACCEPTED:    { label: 'مقبولة',   color: '#2196F3', bg: '#E3F2FD' },
  ARRIVED:     { label: 'وصل',      color: '#00BCD4', bg: '#E0F7FA' },
  IN_PROGRESS: { label: 'جارية',    color: '#FF9800', bg: '#FFF3E0' },
  COMPLETED:   { label: 'مكتملة',   color: '#4CAF50', bg: '#E8F5E9' },
  CANCELLED:   { label: 'ملغاة',    color: '#F44336', bg: '#FFEBEE' },
};

const MOCK_RIDES = [
  { id: 'R001', pickup: 'حيدرة', dropoff: 'باب الوادي', driver: 'علي بن عمر', passenger: 'محمد الأمين', status: 'COMPLETED', fare: 850, distance: 8.2, requestedAt: new Date().toISOString(), serviceType: 'GO' },
  { id: 'R002', pickup: 'القبة', dropoff: 'مطار هواري بومدين', driver: 'سامي مرزوق', passenger: 'فاطمة زهراء', status: 'IN_PROGRESS', fare: 2100, distance: 18.5, requestedAt: new Date().toISOString(), serviceType: 'PLUS' },
  { id: 'R003', pickup: 'بولوغين', dropoff: 'جامعة هواري', driver: 'كمال شعبان', passenger: 'يوسف بن علي', status: 'ACCEPTED', fare: 650, distance: 6.1, requestedAt: new Date().toISOString(), serviceType: 'GO' },
  { id: 'R004', pickup: 'برج البحري', dropoff: 'الرغاية', driver: '—', passenger: 'أمينة كريمي', status: 'SEARCHING', fare: 1350, distance: 14.0, requestedAt: new Date().toISOString(), serviceType: 'XL' },
  { id: 'R005', pickup: 'الدار البيضاء', dropoff: 'المحمدية', driver: 'رضا بلهاشمي', passenger: 'ليلى بوعلام', status: 'CANCELLED', fare: 920, distance: 9.4, requestedAt: new Date(Date.now()-3600000).toISOString(), serviceType: 'GO' },
];

export default function RidesPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const rides = MOCK_RIDES.filter(r =>
    (!search || r.pickup.includes(search) || r.dropoff.includes(search) || r.driver.includes(search) || r.passenger.includes(search)) &&
    (!filterStatus || r.status === filterStatus)
  );

  const totalRevenue = MOCK_RIDES.filter(r => r.status === 'COMPLETED').reduce((s, r) => s + r.fare, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1A1A2E]">إدارة الرحلات</h1>
        <p className="text-gray-500 text-sm mt-1">متابعة جميع الرحلات في الوقت الفعلي</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'رحلات اليوم', value: '1,485', color: '#1A1A2E' },
          { label: 'جارية الآن', value: '34', color: '#FF9800' },
          { label: 'مكتملة', value: '1,408', color: '#4CAF50' },
          { label: 'إيرادات اليوم', value: `${totalRevenue.toLocaleString()} دج`, color: '#F5A623' },
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
          <input type="text" placeholder="بحث بالعنوان أو السائق..." value={search}
            onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm text-right" dir="rtl" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SEARCHING'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                ${filterStatus === s ? 'bg-[#1A1A2E] text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {s ? (STATUS_CONF[s]?.label || s) : 'الكل'}
            </button>
          ))}
        </div>
      </div>

      {/* Live Badge */}
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-xl w-fit border border-green-100">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="font-semibold">34 رحلة جارية الآن — تحديث تلقائي</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['الحالة', 'الأجرة', 'المسافة', 'الخدمة', 'السائق', 'الراكب', 'من ← إلى', 'الوقت'].map(h => (
                  <th key={h} className="text-right px-4 py-3 font-semibold text-gray-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rides.map(ride => {
                const st = STATUS_CONF[ride.status];
                return (
                  <tr key={ride.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {ride.status === 'IN_PROGRESS' && <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#F5A623]">{ride.fare} دج</td>
                    <td className="px-4 py-3 text-gray-500">{ride.distance} كم</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{ride.serviceType}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ride.driver}</td>
                    <td className="px-4 py-3 font-medium text-[#1A1A2E]">{ride.passenger}</td>
                    <td className="px-4 py-3 font-medium">{ride.pickup} ← {ride.dropoff}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(ride.requestedAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
