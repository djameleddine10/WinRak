import { Stack } from 'expo-router'
import { useColors } from '../../hooks/useColors'

export default function AdminLayout() {
  const Colors = useColors()
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.dark1 } }} />
  )
}
