import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In production: call /api/v1/auth/admin-login
    navigate('/overview');
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#F5A623] flex items-center justify-center mx-auto mb-4">
            <span className="text-[#1A1A2E] font-black text-3xl">W</span>
          </div>
          <h1 className="text-2xl font-black text-[#1A1A2E]">لوحة تحكم WinRak</h1>
          <p className="text-gray-400 text-sm mt-1">تسجيل دخول المشرفين</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">البريد الإلكتروني</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20"
              placeholder="admin@winrak.dz" dir="ltr" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">كلمة المرور</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20"
              placeholder="••••••••" required />
          </div>
          <button type="submit"
            className="w-full bg-[#1A1A2E] text-white font-bold py-3.5 rounded-xl hover:bg-[#2a2a4e] transition-all mt-2">
            تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
}
