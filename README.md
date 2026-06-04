# 🚖 WinRak — وين راك؟ نجيك!

منصة جزائرية لنقل المسافرين مع نظام **تقاسم الأرباح والخسائر** مع السائقين.

---

## 🗂️ هيكل المشروع

```
winrak/
├── backend/               # Node.js + Express + PostgreSQL + Socket.io
│   ├── src/modules/       # Auth, Rides, Contracts, Drivers, Incidents...
│   ├── src/socket/        # Socket.io real-time handlers
│   └── prisma/            # Database schema
├── apps/
│   ├── mobile/            # React Native + Expo (Passenger + Driver)
│   └── web-dashboard/     # React.js Admin Dashboard
└── shared/                # Shared TypeScript types
```

---

## 🚀 تشغيل المشروع

### 1. إعداد قاعدة البيانات
```bash
cd backend
cp .env.example .env
# عدّل DATABASE_URL في .env
npm install
npx prisma db push
npx prisma generate
```

### 2. تشغيل الـ Backend
```bash
cd backend
npm run dev
# يعمل على http://localhost:3000
```

### 3. تشغيل لوحة التحكم
```bash
cd apps/web-dashboard
npm install
npm run dev
# يعمل على http://localhost:5173
```

### 4. تشغيل التطبيق المحمول
```bash
cd apps/mobile
npm install
npx expo start
```

---

## ⚙️ المتطلبات

| الأداة | الإصدار |
|--------|---------|
| Node.js | 18+ |
| PostgreSQL | 15+ |
| Redis | 7+ |

---

## 🌟 الميزة الجوهرية: تقاسم الخسائر

على خلاف Yassir و inDrive، تتحمل WinRak جزءاً من خسائر السائقين:

| العقد | حصة السائق | تغطية WinRak للخسائر | أقصى خسارة شهرية |
|-------|-----------|---------------------|-----------------|
| أساسي ⭐ | 85% | 30% | 5,000 دج |
| مميز 💎 | 88% | 40% | 8,000 دج |
| شريك 🤝 | 90% | 50% | 12,000 دج |

---

## 🔌 API الرئيسية

```
POST  /api/v1/auth/send-otp        → إرسال رمز OTP
POST  /api/v1/auth/verify-otp      → التحقق من OTP
POST  /api/v1/rides/estimate       → تقدير السعر
POST  /api/v1/rides/request        → طلب رحلة
GET   /api/v1/rides/:id/track      → تتبع حي (SSE)
GET   /api/v1/contracts/my         → عقدي الحالي
POST  /api/v1/contracts/sign       → توقيع عقد
POST  /api/v1/incidents/report     → تبليغ عن حادثة
```

---

## 🎨 الهوية البصرية

| اللون | القيمة | الاستخدام |
|-------|--------|----------|
| Navy Dark | `#1A1A2E` | الأساسي — ليل الجزائر |
| Golden Amber | `#F5A623` | الثانوي — اللون الذهبي |
| Teal Green | `#00D4AA` | التمييز — اللون الحيوي |

---

*WinRak — وين راك؟ نجيك! 🚖*
