import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Shield, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const MONTHLY_DATA = [
  { month: 'يوليو',  revenue: 2850000, winrakCut: 427500, driverPay: 2422500, losses: 45000 },
  { month: 'أغسطس', revenue: 3120000, winrakCut: 468000, driverPay: 2652000, losses: 38000 },
  { month: 'سبتمبر',revenue: 2940000, winrakCut: 441000, driverPay: 2499000, losses: 52000 },
  { month: 'أكتوبر',revenue: 3380000, winrakCut: 507000, driverPay: 2873000, losses: 41000 },
  { month: 'نوفمبر',revenue: 3670000, winrakCut: 550500, driverPay: 3119500, losses: 67000 },
  { month: 'ديسمبر',revenue: 4210000, winrakCut: 631500, driverPay: 3578500, losses: 59000 },
];

export default function FinancePage() {
  const [period, setPeriod] = useState('month');

  const currentMonth = MONTHLY_DATA[MONTHLY_DATA.length - 1];
  const prevMonth = MONTHLY_DATA[MONTHLY_DATA.length - 2];
  const revGrowth = ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1A1A2E]">التقارير المالية</h1>
        <p className="text-gray-500 text-sm mt-1">تحليل شامل للإيرادات والمدفوعات وتقاسم الخسائر</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الإيرادات', value: `${(currentMonth.revenue / 1000).toFixed(0)}K دج`, trend: `+${revGrowth}%`, up: true, icon: DollarSign, color: '#F5A623' },
          { label: 'صافي WinRak', value: `${(currentMonth.winrakCut / 1000).toFixed(0)}K دج`, trend: `${((currentMonth.winrakCut/currentMonth.revenue)*100).toFixed(1)}% النسبة`, up: true, icon: TrendingUp, color: '#1A1A2E' },
          { label: 'مدفوعات السائقين', value: `${(currentMonth.driverPay / 1000).toFixed(0)}K دج`, trend: '85% من الإيرادات', up: true, icon: ArrowUpRight, color: '#00D4AA' },
          { label: 'خسائر تقاسمها WinRak', value: `${(currentMonth.losses / 1000).toFixed(0)}K دج`, trend: 'هذا الشهر', up: false, icon: Shield, color: '#FF4757' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${card.up ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                {card.trend}
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.color + '18' }}>
                <card.icon size={18} style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-2xl font-black text-[#1A1A2E]">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Breakdown Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {['week', 'month', 'quarter'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${period === p ? 'bg-[#1A1A2E] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {p === 'week' ? 'أسبوع' : p === 'month' ? 'شهر' : 'ربع سنوي'}
              </button>
            ))}
          </div>
          <h3 className="font-bold text-[#1A1A2E]">تحليل الإيرادات الشهرية</h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={MONTHLY_DATA} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: any) => [`${v.toLocaleString()} دج`, '']} />
            <Legend formatter={(v) => v === 'revenue' ? 'الإيرادات' : v === 'winrakCut' ? 'نصيب WinRak' : 'مدفوعات السائقين'} />
            <Bar dataKey="driverPay"  fill="#00D4AA"   radius={[4,4,0,0]} name="driverPay" />
            <Bar dataKey="winrakCut" fill="#F5A623"   radius={[4,4,0,0]} name="winrakCut" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Loss Sharing Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-[#1A1A2E] mb-5">📊 تقاسم الخسائر — الـ 6 أشهر الأخيرة</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MONTHLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => [`${v.toLocaleString()} دج`, 'الخسائر المغطاة']} />
              <Line type="monotone" dataKey="losses" stroke="#FF4757" strokeWidth={2.5} dot={{ r: 4, fill: '#FF4757' }} name="losses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-[#1A1A2E] mb-5">💳 ملخص الشهر الحالي</h3>
          <div className="space-y-4">
            {[
              { label: 'إجمالي الرحلات المدفوعة', value: '4,210,000 دج', color: '#1A1A2E' },
              { label: 'عمولة WinRak (15%)', value: '631,500 دج', color: '#F5A623' },
              { label: 'مدفوعات للسائقين (85%)', value: '3,578,500 دج', color: '#00D4AA' },
              { label: 'خسائر تحملتها WinRak', value: '- 59,000 دج', color: '#FF4757' },
              { label: 'صافي ربح WinRak', value: '572,500 دج', color: '#2ED573', bold: true },
            ].map(row => (
              <div key={row.label} className={`flex justify-between items-center py-2 border-b border-gray-50 last:border-0 ${row.bold ? 'border-t-2 border-t-gray-200 mt-2 pt-4' : ''}`}>
                <span className="font-bold" style={{ color: row.color, fontSize: row.bold ? 16 : 14 }}>{row.value}</span>
                <span className="text-gray-600 text-sm">{row.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
