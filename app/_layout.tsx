import { useEffect, useState } from 'react'
import { I18nManager } from 'react-native'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  useFonts,
  Cairo_400Regular,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_900Black,
} from '@expo-google-fonts/cairo'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'
import { useColors, useResolvedScheme } from '../hooks/useColors'
import { useHydration } from '../hooks/useHydration'
import { useSettingsStore } from '../store/settingsStore'
import { syncDirection } from '../i18n/locale'
import { AnimatedSplash } from '../components/layout/AnimatedSplash'

// Keep the native splash visible until fonts + stores are ready.
SplashScreen.preventAutoHideAsync()

I18nManager.allowRTL(true)

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
  }),
})

export default function RootLayout() {
  const Colors = useColors()
  const scheme = useResolvedScheme()
  const hydrated = useHydration()
  const language = useSettingsStore((s) => s.language)
  const [minDelayDone, setMinDelayDone] = useState(false)
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_900Black,
    ...MaterialCommunityIcons.font,
  })

  useEffect(() => {
    if (hydrated) syncDirection(language)
  }, [language, hydrated])

  // Hide native splash on first mount so our animated RN splash shows underneath.
  // By the time this effect fires, AnimatedSplash is already painted — no flash.
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  // Minimum splash display: 800ms is enough to see the first two radar rings.
  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), 800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { tripId?: string }
      if (data?.tripId) router.push('/(driver)/incoming-request')
    })
    return () => sub.remove()
  }, [])

  // Show animated splash until fonts, stores, AND minimum 2s delay are all done.
  if (!fontsLoaded || !hydrated || !minDelayDone) return <AnimatedSplash />

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.dark1 }}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.dark1 } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(passenger)" />
          <Stack.Screen name="(driver)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
