import type { ConfigContext, ExpoConfig } from 'expo/config'

// Reads EXPO_PUBLIC_GOOGLE_MAPS_KEY from .env.local at build time.
// This prevents the API key from being hardcoded in app.json (which is committed to git).
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  android: {
    ...config.android,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '',
      },
    },
  },
  ios: {
    ...config.ios,
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '',
    },
  },
})
