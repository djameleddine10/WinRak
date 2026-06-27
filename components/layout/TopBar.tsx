import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../ui/Txt'
import { Icon } from '../ui/Icon'
import { DirIcon } from '../ui/DirIcon'
import { useIsRTL } from '../../i18n/locale'
import { useUserStore } from '../../store/userStore'

interface TopBarProps {
  title?: string
  showBack?: boolean
  showMenu?: boolean
  showNotification?: boolean
  notificationCount?: number
  rightAction?: React.ReactNode
  onBack?: () => void
  onMenu?: () => void
  onNotification?: () => void
  transparent?: boolean
}

export function TopBar({
  title, showBack, showMenu, showNotification, notificationCount = 0,
  rightAction, onBack, onMenu, onNotification, transparent = false,
}: TopBarProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets = useSafeAreaInsets()
  const mode = useUserStore((s) => s.mode)
  const defaultBack = mode === 'driver'
    ? () => router.replace('/(driver)/home')
    : () => router.back()

  return (
    <View style={[styles.bar, { paddingTop: insets.top, height: Spacing.topBarHeight + insets.top }, transparent && styles.barTransparent]}>
      <View style={styles.leading}>
        {showBack && (
          <Pressable onPress={onBack ?? defaultBack} style={styles.iconBtn} hitSlop={8}>
            <DirIcon name="arrow-left" size={24} color={Colors.white} />
          </Pressable>
        )}
        {showMenu && (
          <Pressable onPress={onMenu} style={styles.iconBtn} hitSlop={8}>
            <Icon name="menu" size={24} color={Colors.white} />
          </Pressable>
        )}
      </View>

      <View style={styles.center} pointerEvents="none">
        {!!title && <Txt weight="bold" size={18}>{title}</Txt>}
      </View>

      <View style={styles.trailing}>
        {rightAction}
        {showNotification && (
          <Pressable onPress={onNotification} style={styles.iconBtn} hitSlop={8}>
            <Icon name="bell" size={22} color={Colors.white} />
            {notificationCount > 0 && <View style={styles.dot} />}
          </Pressable>
        )}
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const dir = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    bar: {
      flexDirection: dir,
      alignItems: 'flex-end',
      backgroundColor: Colors.dark2,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    barTransparent: {
      backgroundColor: 'transparent',
      borderBottomWidth: 0,
    },
    leading: { flexDirection: dir, alignItems: 'center', minWidth: 80 },
    center: { position: 'absolute', left: 0, right: 0, bottom: Spacing.md, alignItems: 'center' },
    trailing: { flexDirection: dir, alignItems: 'center', minWidth: 80, justifyContent: 'flex-end', gap: Spacing.sm },
    iconBtn: { padding: 6 },
    dot: { position: 'absolute', top: 4, left: 6, width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.gold },
  })
}
