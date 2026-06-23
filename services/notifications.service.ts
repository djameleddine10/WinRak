import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'

// EAS project id — read from env, fall back to the value in app.json so the
// token request works even before .env.local is filled in.
const PROJECT_ID =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'b8e5f0cf-5331-407a-8b8e-1817e574726f'

// Foreground presentation: show a banner + list entry, play sound, bump badge.
// (SDK 56 requires shouldShowBanner/shouldShowList; shouldShowAlert is the
// deprecated alias kept for older native runtimes.)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
  }),
})

// Registers this device's Expo push token for the signed-in user.
// Safe to call on every app open. Returns the token, or null when running on a
// simulator / without permission / on web.
export async function registerPushToken(userId: string): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })
    if (!token) return null

    // Primary store: profiles.push_token (works for passengers and drivers,
    // since drivers.id === passengers.id === profiles.id === auth uid).
    await supabase.from('profiles').update({ push_token: token }).eq('id', userId)
    // Keep drivers.push_token in sync so the existing notify-driver edge
    // function keeps working. No-op (0 rows) for passengers.
    await supabase.from('drivers').update({ push_token: token }).eq('id', userId)

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name:             'WinRak',
        importance:       Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor:       '#ffbc07',
      })
    }

    return token
  } catch (e) {
    console.warn('[WinRak] registerPushToken failed:', e)
    return null
  }
}

// Fired when a notification arrives while the app is foregrounded.
export function useNotificationListener(onNotification: (n: Notifications.Notification) => void) {
  return Notifications.addNotificationReceivedListener(onNotification)
}

// Fired when the user taps a notification (app background/closed).
export function useNotificationResponseListener(
  onResponse: (r: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(onResponse)
}
