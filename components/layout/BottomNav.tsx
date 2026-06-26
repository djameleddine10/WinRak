import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Txt } from '../ui/Txt'
import { Icon } from '../ui/Icon'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'
import { useUserStore } from '../../store/userStore'
import { useIsRTL } from '../../i18n/locale'
import { Shadows } from '../../constants/shadows'

const TABS: Record<string, { icon: string; labelKey: TranslationKey }> = {
  home:            { icon: 'home',              labelKey: 'nav.home'    },
  'rides-history': { icon: 'map-marker-radius', labelKey: 'nav.trips'   },
  wallet:          { icon: 'wallet',            labelKey: 'nav.wallet'  },
  profile:         { icon: 'account',           labelKey: 'nav.account' },
}

// Minimal shape of the expo-router / react-navigation tab bar props we use.
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] }
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean }
    navigate: (name: string) => void
  }
}

// Floating pill tab bar for the passenger tab navigator.
// The focused tab is rendered as a raised gold circle (56 px, marginTop: -26).
// All other tabs show their icon + label in muted/gold depending on focus state.
// Direction-aware: pill reverses in RTL so Home ends up on the far right in Arabic.
export function BottomNav({ state, navigation }: TabBarProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const t = useT()
  const mode = useUserStore((s) => s.mode)

  // A driver who opens a shared screen (settings/notifications/…) is inside the passenger
  // tab navigator; hide its bottom bar so its Home tab can't bounce them into passenger mode.
  if (mode === 'driver') return null

  function go(route: { key: string; name: string }, focused: boolean) {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name)
  }

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + 8 }]} pointerEvents="box-none">
      <View style={[styles.pill, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {state.routes.map((route, index) => {
          const tab = TABS[route.name]
          if (!tab) return null
          const focused = state.index === index

          // Focused tab → raised gold circle (no label).
          if (focused) {
            return (
              <Pressable
                key={route.key}
                style={styles.activeWrap}
                onPress={() => go(route, focused)}
                hitSlop={10}
              >
                <View style={styles.activeBtn}>
                  <Icon name={tab.icon} size={26} color="#000" />
                </View>
              </Pressable>
            )
          }

          // Idle tab → icon + label.
          return (
            <Pressable
              key={route.key}
              style={styles.tab}
              onPress={() => go(route, focused)}
              hitSlop={8}
            >
              <Icon name={tab.icon} size={23} color={Colors.muted} />
              <Txt size={10} color={Colors.muted} weight="regular" style={styles.label}>
                {t(tab.labelKey)}
              </Txt>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute', left: 0, right: 0, bottom: 0,
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    pill: {
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: Colors.dark2,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 22,
      height: 64,
      width: '100%',
      maxWidth: 420,
      ...Shadows.lg,
    },
    // Raised gold circle for the active tab.
    activeWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeBtn: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: Colors.gold,
      alignItems: 'center', justifyContent: 'center',
      marginTop: -26,
      borderWidth: 4,
      borderColor: Colors.dark1,
      shadowColor: Colors.gold,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 14,
      elevation: 16,
    },
    // Idle tabs.
    tab: { alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 52 },
    label: { textAlign: 'center' },
  })
}
