// إعداد ديناميكي: تطبيقان من كود واحد (راكب / سائق)
// APP_VARIANT=driver  → WinRak Driver | الافتراضي → WinRak (راكب)
const variant = process.env.APP_VARIANT || 'passenger';
const isDriver = variant === 'driver';

const LOC_MSG = 'WinRak يحتاج موقعك لتحديد نقطة انطلاق رحلتك.';

export default {
  expo: {
    name: isDriver ? 'WinRak Driver' : 'WinRak',
    slug: 'winrak',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: isDriver ? './assets/icon-driver.png' : './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#FFD400',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: isDriver ? 'dz.winrak.driver' : 'dz.winrak.app',
      infoPlist: { NSLocationWhenInUseUsageDescription: LOC_MSG },
    },
    android: {
      package: isDriver ? 'dz.winrak.driver' : 'dz.winrak.app',
      versionCode: 3,
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
      adaptiveIcon: {
        foregroundImage: isDriver ? './assets/adaptive-icon-driver.png' : './assets/adaptive-icon.png',
        backgroundColor: isDriver ? '#FFD400' : '#0A0A0A',
      },
    },
    plugins: [
      ['expo-location', { locationWhenInUsePermission: LOC_MSG }],
      ['expo-image-picker', { photosPermission: 'WinRak يحتاج الوصول للصور لرفع وثائقك.' }],
      'expo-notifications',
    ],
    extra: {
      appVariant: variant,
      eas: { projectId: 'a03b3e3f-ee0d-4024-86d8-2f9b44c7f973' },
    },
  },
};
