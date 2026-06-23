// ─────────────────────────────────────────────────────────────
// مفتاح خرائط Google
// يُقرأ من متغير البيئة EXPO_PUBLIC_GOOGLE_MAPS_KEY في ملف .env.local
// (نفس المفتاح المستعمل في services/geocoding.service.ts — مصدر واحد موحّد)
// كيف تحصل عليه: console.cloud.google.com → فعّل "Maps JavaScript API"
//                و "Places API" → أنشئ API key
// ─────────────────────────────────────────────────────────────
export const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? ''

export const hasMapsKey = GOOGLE_MAPS_KEY.length > 10

// ─────────────────────────────────────────────────────────────
// Auth dev bypass
// When true, the OTP flow lets you continue even if SMS isn't configured
// (so you can test the app with any number). Bound to __DEV__: it is ON in
// development/debug builds and automatically OFF in production release builds,
// where real OTP verification is enforced.
// ─────────────────────────────────────────────────────────────
export const DEV_AUTH_BYPASS = __DEV__
