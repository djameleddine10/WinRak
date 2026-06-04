import React, { useState } from 'react';
import { Save, Info } from 'lucide-react';

const SERVICE_ICONS: Record<string, string> = { GO: '🚗', PLUS: '🚙', XL: '🚐', SHE: '👩', DELIVER: '📦' };
const SERVICE_NAMES: Record<string, string> = { GO: 'WinRak GO', PLUS: 'WinRak PLUS', XL: 'WinRak XL', SHE: 'WinRak SHE', DELIVER: 'WinRak DELIVER' };

const DEFAULT_PRICING = [
  { vehicleType: 'GO',      baseFare: 150, pricePerKm: 45,  waitingPerMin: 15, surgeMultiplier: 1.0 },
  { vehicleType: 'PLUS',    baseFare: 250, pricePerKm: 75,  waitingPerMin: 20, surgeMultiplier: 1.0 },
  { vehicleType: 'XL',      baseFare: 350, pricePerKm: 100, waitingPerMin: 25, surgeMultiplier: 1.0 },
  { vehicleType: 'SHE',     baseFare: 200, pricePerKm: 55,  waitingPerMin: 18, surgeMultiplier: 1.0 },
  { vehicleType: 'DELIVER', baseFare: 200, pricePerKm: 50,  waitingPerMin: 10, surgeMultiplier: 1.0 },
];

const CONTRACT_TEMPLATES = [
  { type: 'STANDARD', label: 'أساسي ⭐',  profitDriver: 85, profitWinrak: 15, lossWinrak: 30, lossDriver: 70, monthlyCap: 5000 },
  { type: 'PREMIUM',  label: 'مميز 💎',    profitDriver: 88, profitWinrak: 12, lossWinrak: 40, lossDriver: 60, monthlyCap: 8000 },
  { type: 'PARTNER',  label: 'شريك 🤝',   profitDriver: 90, profitWinrak: 10, lossWinrak: 50, lossDriver: 50, monthlyCap: 12000 },
];

export default function PricingPage() {
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [saved, setSaved] = useState(false);

  const updatePrice = (index: number, field: string, value: number) => {
    const updated = [...pricing];
    (updated[index] as any)[field] = value;
    setPricing(updated);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Calculate example price
  const calcExample = (p: typeof pricing[0]) => {
    const dist = 10; // 10 km
    return Math.round(p.baseFare + dist * p.pricePerKm);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">إعدادات التسعير والعقود</h1>
          <p className="text-gray-500 text-sm mt-1">تعديل أسعار الخدمات ونسب عقود الشراكة</p>
        </div>
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm
            ${saved ? 'bg-green-500 text-white' : 'bg-[#1A1A2E] text-white hover:bg-[#2a2a4e]'}`}>
          <Save size={16} />
          {saved ? 'تم الحفظ ✓' : 'حفظ التغييرات'}
        </button>
      </div>

      {/* Pricing Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#1A1A2E]">جدول الأسعار</h2>
          <p className="text-xs text-gray-400 mt-1">جميع الأسعار بالدينار الجزائري (دج)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['مثال (10 كم)', 'الانتظار/دق', 'السعر/كم', 'رسوم الانطلاق', 'الخدمة'].map(h => (
                  <th key={h} className="text-right px-5 py-3 font-semibold text-gray-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pricing.map((row, i) => (
                <tr key={row.vehicleType} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-bold text-[#F5A623]">≈ {calcExample(row)} دج</span>
                  </td>
                  <td className="px-5 py-3">
                    <input type="number" value={row.waitingPerMin} onChange={e => updatePrice(i, 'waitingPerMin', +e.target.value)}
                      className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20" />
                  </td>
                  <td className="px-5 py-3">
                    <input type="number" value={row.pricePerKm} onChange={e => updatePrice(i, 'pricePerKm', +e.target.value)}
                      className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20" />
                  </td>
                  <td className="px-5 py-3">
                    <input type="number" value={row.baseFare} onChange={e => updatePrice(i, 'baseFare', +e.target.value)}
                      className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20" />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <span className="text-lg">{SERVICE_ICONS[row.vehicleType]}</span>
                      <span className="font-semibold text-[#1A1A2E]">{SERVICE_NAMES[row.vehicleType]}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Templates */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-[#00D4AA]" />
          <h2 className="font-bold text-[#1A1A2E]">قوالب عقود الشراكة</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CONTRACT_TEMPLATES.map(t => (
            <div key={t.type} className={`bg-white rounded-2xl p-5 border-2 shadow-sm transition-all
              ${t.type === 'PARTNER' ? 'border-[#00D4AA]' : t.type === 'PREMIUM' ? 'border-[#F5A623]' : 'border-gray-200'}`}>
              <div className="text-center mb-4">
                <p className="text-xl font-black text-[#1A1A2E]">{t.label}</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#00D4AA]">{t.profitDriver}%</span>
                  <span className="text-gray-500 text-sm">حصة السائق من الأرباح</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#F5A623]">{t.profitWinrak}%</span>
                  <span className="text-gray-500 text-sm">عمولة WinRak</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#1A1A2E]">{t.lossWinrak}%</span>
                  <span className="text-gray-500 text-sm">WinRak تغطي من الخسائر</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-red-400">{t.monthlyCap.toLocaleString()} دج</span>
                  <span className="text-gray-500 text-sm">أقصى خسارة شهرية</span>
                </div>
              </div>
              <button className="w-full mt-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                تعديل القالب
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-blue-800 text-sm">ملاحظة مهمة</p>
          <p className="text-blue-600 text-sm mt-1">
            أي تغيير في الأسعار أو نسب العقود سيُطبَّق على الطلبات الجديدة فقط.
            العقود الموقَّعة مسبقاً تبقى سارية حتى تاريخ انتهائها.
          </p>
        </div>
      </div>
    </div>
  );
}
