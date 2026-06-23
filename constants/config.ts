// ─────────────────────────────────────────────────────────────
// مفتاح خرائط Google (JavaScript API)
// الصق مفتاحك المجاني هنا بين علامتي التنصيص.
// كيف تحصل عليه: console.cloud.google.com → فعّل "Maps JavaScript API" → أنشئ API key
// ─────────────────────────────────────────────────────────────
export const GOOGLE_MAPS_JS_KEY = 'PASTE_YOUR_KEY_HERE'

export const hasMapsKey = GOOGLE_MAPS_JS_KEY.length > 10 && !GOOGLE_MAPS_JS_KEY.startsWith('PASTE')

// ─────────────────────────────────────────────────────────────
// Auth dev bypass
// When true, the OTP flow lets you continue even if SMS isn't configured
// (so you can test the app with any number). Bound to __DEV__: it is ON in
// development/debug builds and automatically OFF in production release builds,
// where real OTP verification is enforced.
// ─────────────────────────────────────────────────────────────
export const DEV_AUTH_BYPASS = __DEV__
