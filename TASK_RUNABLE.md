# WinRak — مهام الإصلاح (Runable)

## الأولويات

### 1. مفتاح Google Maps 🔴 (يحتاج المستخدم)
- app.json فيه مفتاح حقيقي: AIzaSy... ✅ (للخرائط الأصلية)
- geocoding.service.ts يستعمل EXPO_PUBLIC_GOOGLE_MAPS_KEY من .env — مفقود
- **الحل**: إضافة EXPO_PUBLIC_GOOGLE_MAPS_KEY إلى .env.local

### 2. متغيرات Supabase 🔴 (يحتاج المستخدم)
- dashboard/supabase-config.js فيه قيم حقيقية:
  - URL: https://ltxbzqkuoihokgysvafp.supabase.co
  - anon key: sb_publishable_...
- نحتاج .env.local للتطبيق (EXPO_PUBLIC_SUPABASE_URL + ANON_KEY)

### 3. تضارب مفتاح الخرائط 🟡 (أصلحه أنا)
- constants/config.ts: GOOGLE_MAPS_JS_KEY + hasMapsKey = كود ميت (غير مستعمل)
- geocoding.service.ts: يستعمل EXPO_PUBLIC_GOOGLE_MAPS_KEY
- **الحل**: حذف الكود الميت أو توحيد المصدر

### 4. DEV_AUTH_BYPASS 🟡 (مراجعة)
- مربوط بـ __DEV__ — آمن (OFF تلقائياً في الإنتاج)
- يُستعمل في: login, otp, driver/home, ride-active, ride-confirmed
- **الحل**: تأكيد فقط، آمن كما هو

## الحالة
- [x] 1 — Google Maps key ✅
- [x] 2 — Supabase env ✅
- [x] 3 — تضارب الخرائط ✅
- [x] 4 — DEV_AUTH_BYPASS ✅ آمن

## مراجعة Runable (الخطة الثانية — 4 خطوات)
- [x] 1 — مراجعة الكود: تسعير آمن من جهة الخادم (trigger)، إزالة الكود الميت، توحيد مفتاح الخرائط ✅
- [x] 2 — تشغيل التطبيق في المتصفح: WebMap.web.tsx لحل مشكلة react-native-maps — يعمل، 0 أخطاء ✅
- [x] 3 — قاعدة البيانات Supabase: schema + rls + migrations متطابقة، DB_VEHICLE mapping صحيح، migration التسعير مطبّق ✅
- [x] 4 — npm audit: 12 ثغرة (uuid<11.1.1، أدوات بناء Expo فقط، لا تدخل في حزمة التطبيق) → أُصلحت عبر overrides.uuid=^11.1.1 = **0 ثغرات** ✅

## تغييرات جديدة في الملفات
- components/map/WebMap.web.tsx — جديد (خرائط ويب للاختبار فقط)
- package.json — أضيف overrides.uuid=^11.1.1 + react-native-worklets (peer مطلوب لـ reanimated v4)
- constants/config.ts — توحيد GOOGLE_MAPS_KEY، حذف GOOGLE_MAPS_JS_KEY
- supabase/migrations/20260623_secure_pricing.sql — مطبّق
