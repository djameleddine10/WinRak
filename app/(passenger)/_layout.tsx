import { Stack } from 'expo-router'
import { useColors } from '../../hooks/useColors'
import { useIsRTL } from '../../i18n/locale'

export default function PassengerLayout() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  // Forward navigation must slide IN from the natural "forward" edge of the
  // reading direction: from the LEFT in Arabic (RTL), from the RIGHT in FR/EN.
  // Without this the push animation feels reversed/unnatural for Arabic users.
  const animation = isRTL ? 'slide_from_left' : 'slide_from_right'
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.dark1 }, animation }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="search" />
      <Stack.Screen name="vehicle-select" />
      <Stack.Screen name="intercity-booking" />
      <Stack.Screen name="packages" />
      <Stack.Screen name="delivery" />
      <Stack.Screen name="delivery-food" />
      <Stack.Screen name="delivery-pharmacy" />
      <Stack.Screen name="delivery-meds" />
      <Stack.Screen name="delivery-checkout" />
      <Stack.Screen name="delivery-tracking" />
      <Stack.Screen name="restaurant" />
      <Stack.Screen name="restaurant-chat" />
      <Stack.Screen name="restaurant-signup" />
      <Stack.Screen name="searching" />
      <Stack.Screen name="ride-confirmed" />
      <Stack.Screen name="ride-active" />
      <Stack.Screen name="ride-completed" />
      <Stack.Screen name="rating" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="add-card" />
      <Stack.Screen name="topup" />
      <Stack.Screen name="profile-settings" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="security" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="appearance" />
      <Stack.Screen name="distance-unit" />
      <Stack.Screen name="language" />
      <Stack.Screen name="legal" />
      <Stack.Screen name="legal-doc" />
      <Stack.Screen name="help" />
      <Stack.Screen name="sos" />
      <Stack.Screen name="emergency-contacts" />
      <Stack.Screen name="security-detail" />
    </Stack>
  )
}
