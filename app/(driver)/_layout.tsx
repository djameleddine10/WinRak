import { Stack } from 'expo-router'
import { useColors } from '../../hooks/useColors'

export default function DriverLayout() {
  const Colors = useColors()
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.dark1 },
      }}
    >
      <Stack.Screen name="driver-signup" />
      <Stack.Screen name="driver-registration" options={{ presentation: 'modal' }} />
      <Stack.Screen name="driver-setup-loading" />
      <Stack.Screen name="driver-pending" />
      <Stack.Screen name="home" />
      <Stack.Screen name="performance" />
      <Stack.Screen name="benefits" />
      <Stack.Screen name="incoming-request" options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <Stack.Screen name="going-to-pickup" />
      <Stack.Screen name="ride-active" />
      <Stack.Screen name="rating" />
      <Stack.Screen name="earnings" />
      <Stack.Screen name="driver-documents" />
    </Stack>
  )
}
