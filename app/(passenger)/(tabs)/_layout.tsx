import { Tabs } from 'expo-router'
import { useColors } from '../../../hooks/useColors'
import { BottomNav } from '../../../components/layout/BottomNav'

export default function TabsLayout() {
  const Colors = useColors()
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...(props as any)} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.dark1 },
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="rides-history" />
      <Tabs.Screen name="wallet" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}
