import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../ui/Txt'
import { Icon } from '../ui/Icon'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'

type DriverTab = 'orders' | 'performance'

interface DriverTabBarProps {
  active: DriverTab
}

const TABS: { key: DriverTab; icon: string; labelKey: TranslationKey; route: string }[] = [
  { key: 'orders',      icon: 'format-list-bulleted', labelKey: 'driver.tabOrders', route: '/(driver)/home' },
  { key: 'performance', icon: 'view-dashboard-outline', labelKey: 'driver.tabPerformance', route: '/(driver)/performance' },
]

// Bottom bar shared by the driver radar (orders) and performance screens.
export function DriverTabBar({ active }: DriverTabBarProps) {
  const Colors = useColors()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const t = useT()

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 6 }]}>
      {TABS.map((tab) => {
        const on = tab.key === active
        const color = on ? Colors.white : Colors.muted
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => { if (!on) router.replace(tab.route as any) }}
          >
            <Icon name={tab.icon} size={24} color={color} />
            <Txt size={12} color={color} weight={on ? 'bold' : 'regular'}>{t(tab.labelKey)}</Txt>
          </Pressable>
        )
      })}
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row-reverse',
      backgroundColor: Colors.dark2,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingTop: Spacing.sm,
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  })
}
