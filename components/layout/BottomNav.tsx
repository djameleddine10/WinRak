import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../ui/Txt'
import { Icon } from '../ui/Icon'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'
import { useUserStore } from '../../store/userStore'

const TABS: Record<string, { icon: string; labelKey: TranslationKey }> = {
  home:            { icon: 'home',               labelKey: 'nav.home'   },
  'rides-history': { icon: 'map-marker-radius',   labelKey: 'nav.trips'  },
  wallet:          { icon: 'wallet',              labelKey: 'nav.wallet' },
  profile:         { icon: 'account',             labelKey: 'nav.account' },
}

// Minimal shape of the expo-router / react-navigation tab bar props we use.
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] }
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean }
    navigate: (name: string) => void
  }
}

// Custom tab bar for the passenger tab navigator.
export function BottomNav({ state, navigation }: TabBarProps) {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const t = useT()
  const mode = useUserStore((s) => s.mode)

  // A driver who opens a shared screen (settings/notifications/…) is inside the passenger
  // tab navigator; hide its bottom bar so its Home tab can't bounce them into passenger mode.
  if (mode === 'driver') return null

  return (
    <View style={[styles.bar, { height: Spacing.tabBarHeight + insets.bottom, paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name]
        if (!tab) return null
        const focused = state.index === index
        const color = focused ? Colors.gold : Colors.muted
        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name)
            }}
          >
            <Icon name={tab.icon} size={24} color={color} />
            <Txt size={11} color={color} weight={focused ? 'bold' : 'regular'}>{t(tab.labelKey)}</Txt>
            {focused && <View style={styles.dot} />}
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
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
    dot: { width: 16, height: 3, borderRadius: 2, backgroundColor: Colors.gold, marginTop: 2 },
  })
}
