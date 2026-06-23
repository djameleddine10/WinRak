import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { supabase } from '../lib/supabase'

const PROJECT_ID = 'b8e5f0cf-5331-407a-8b8e-1817e574726f'

// Register this device's Expo push token for the given driver.
// Safe to call multiple times — only writes to Supabase if the token changed.
export async function registerPushToken(driverId: string): Promise<void> {
  if (Platform.OS === 'web') return

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return

  try {
    const { data: tokenData } = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })
    if (!tokenData) return

    await supabase
      .from('drivers')
      .update({ push_token: tokenData })
      .eq('id', driverId)
  } catch (e) {
    console.warn('[WinRak] registerPushToken failed:', e)
  }
}
