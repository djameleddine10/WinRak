import { Stack } from 'expo-router'
import { useColors } from '../../hooks/useColors'

export default function AuthLayout() {
  const Colors = useColors()
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.dark1 },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
    </Stack>
  )
}
