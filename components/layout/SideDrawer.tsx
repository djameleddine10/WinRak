import { useEffect, useMemo, useRef } from 'react'
import { Animated, Dimensions, Easing, I18nManager, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../ui/Txt'
import { Icon } from '../ui/Icon'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Divider } from '../ui/Divider'
import { useUserStore } from '../../store/userStore'
import { usePassengerName, useDriverName, useIsRTL } from '../../i18n/locale'
import { useT } from '../../hooks/useT'

interface SideDrawerProps {
  visible: boolean
  onClose: () => void
}

const { width: SCREEN_W } = Dimensions.get('window')
const DRAWER_W = SCREEN_W * 0.8

interface DrawerItem {
  icon: string
  label: string
  route?: string
  active?: boolean
  badge?: number
}

export function SideDrawer({ visible, onClose }: SideDrawerProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets = useSafeAreaInsets()
  const mode = useUserStore((s) => s.mode)
  const setMode = useUserStore((s) => s.setMode)
  const passenger = useUserStore((s) => s.passenger)
  const driver = useUserStore((s) => s.driver)
  const photoStatus = useUserStore((s) => s.photoStatus)
  const photoUri = useUserStore((s) => s.photoUri)
  const passengerName = usePassengerName()
  const driverName = useDriverName()
  const t = useT()

  // ── Drawer side — bulletproof against the RTL/LTR mismatch ──────────────────
  // `syncDirection` (i18n/locale.ts) flips the language instantly via useIsRTL but only
  // calls forceRTL for the NEXT cold start — it never reloads. So the native flag below
  // can disagree with the live language for the whole session.
  //
  // RN swaps physical `left`/`right` under a native-RTL layout (default behaviour). To PIN
  // the panel to the physical edge the live language wants, we pick the style property that
  // RESOLVES to that edge given the current native flag, then slide with a raw translateX
  // (transforms are never swapped). Read inside the component so it stays correct across
  // Fast Refresh — a module-level const would go stale.
  const nativeRTL = I18nManager.isRTL
  const wantRight = isRTL                         // AR → physical right · FR/EN → physical left
  const edgeStyle = wantRight
    ? (nativeRTL ? { left: 0 } : { right: 0 })    // resolves to physical right
    : (nativeRTL ? { right: 0 } : { left: 0 })    // resolves to physical left
  const OPEN_X    = 0
  const CLOSED_X  = wantRight ? DRAWER_W : -DRAWER_W   // slide off that same physical edge

  const translateX      = useRef(new Animated.Value(CLOSED_X)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      translateX.setValue(CLOSED_X)
      backdropOpacity.setValue(0)
      Animated.parallel([
        Animated.spring(translateX, {
          toValue:   OPEN_X,
          tension:   70,
          friction:  13,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue:  1,
          duration: 220,
          easing:   Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue:  CLOSED_X,
          duration: 210,
          easing:   Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue:  0,
          duration: 180,
          easing:   Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, CLOSED_X])

  function go(route: string) {
    onClose()
    setTimeout(() => router.push(route as any), 220)
  }

  const isDriver = mode === 'driver'
  const photoMissing = !isDriver && photoStatus === 'missing'

  const items: DrawerItem[] = isDriver
    ? [
        { icon: 'car', label: t('drawer.city'), active: true },
        { icon: 'bell', label: t('drawer.notifications'), route: '/(passenger)/notifications', badge: 20 },
        { icon: 'shield-check', label: t('drawer.safety'), route: '/(passenger)/security' },
        { icon: 'cog', label: t('settings.title'), route: '/(passenger)/settings' },
        { icon: 'message-text', label: t('drawer.support'), route: '/(passenger)/help' },
        { icon: 'file-document-edit-outline', label: t('drawer.updateDocs'), route: '/(driver)/driver-documents' },
      ]
    : [
        { icon: 'car', label: t('drawer.cityRide'), active: true },
        { icon: 'bell', label: t('drawer.notifications'), route: '/(passenger)/notifications', badge: 3 },
        { icon: 'shield-check', label: t('drawer.safety'), route: '/(passenger)/security' },
        { icon: 'cog', label: t('settings.title'), route: '/(passenger)/settings' },
        { icon: 'message-text', label: t('drawer.support'), route: '/(passenger)/help' },
      ]

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 999, elevation: 30 }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          styles.drawer,
          // edgeStyle pins the panel to the physical edge of the live language; translateX
          // (raw, never swapped) slides it on/off that edge. Correct in all 4 launch×language
          // combinations even while the native RTL flag disagrees with the language.
          edgeStyle,
          { width: DRAWER_W, paddingTop: insets.top + Spacing.lg, transform: [{ translateX }] },
        ]}
      >
        {/* Mode chip — shows clearly which mode is active */}
        <View style={[styles.modeChip, { backgroundColor: isDriver ? Colors.driverGreen + '22' : Colors.goldAlpha15 }]}>
          <Icon name={isDriver ? 'steering' : 'account'} size={13} color={isDriver ? Colors.success : Colors.gold} />
          <Txt size={11} weight="bold" color={isDriver ? Colors.success : Colors.gold}>
            {isDriver ? t('driver.modeLabel') : t('passenger.modeLabel')}
          </Txt>
        </View>

        {/* Header */}
        <Pressable
          style={styles.header}
          onPress={() => !isDriver && go('/(passenger)/profile-settings')}
        >
          <Avatar
            initial={isDriver ? driverName.charAt(0).toUpperCase() : passengerName.charAt(0).toUpperCase()}
            size={56}
            imageUri={isDriver ? null : photoUri}
            showBorder
          />
          <View style={styles.headerInfo}>
            <Txt weight="bold" size={16}>{isDriver ? driverName : passengerName}</Txt>
            <View style={styles.ratingRow}>
              <Icon name="star" size={13} color={Colors.gold} />
              <Txt size={12} color={Colors.gold}>{isDriver ? driver.rating : passenger.rating}</Txt>
              {isDriver && <Badge label={driver.level} variant="gold" size="sm" />}
            </View>
            {photoMissing && (
              <View style={styles.addPhotoRow}>
                <Icon name="alert-circle" size={13} color={Colors.danger} />
                <Txt size={11} color={Colors.danger}>{t('drawer.addPhoto')}</Txt>
              </View>
            )}
          </View>
        </Pressable>

        <Divider spacing={Spacing.md} />

        {/* Items */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {items.map((it) => (
            <Pressable
              key={it.label}
              style={[styles.item, it.active && styles.itemActive]}
              onPress={() => it.route && go(it.route)}
            >
              <Icon name={it.icon} size={22} color={it.active ? Colors.gold : Colors.white} />
              <Txt size={14} color={it.active ? Colors.gold : Colors.white} style={{ flex: 1 }}>{it.label}</Txt>
              {it.badge ? <Badge label={String(it.badge)} variant="gold" size="sm" /> : null}
            </Pressable>
          ))}
        </ScrollView>

        {/* Footer */}
        {isDriver ? (
          <Button
            label={t('drawer.passengerMode')}
            variant="white"
            icon="account-arrow-left"
            onPress={() => { setMode('passenger'); go('/(passenger)/(tabs)/home') }}
          />
        ) : (
          <View style={styles.footer}>
            <Button
              label={t('drawer.registerDriver')}
              variant="white"
              icon="steering"
              onPress={() => go('/(driver)/driver-signup')}
            />
            <View style={styles.social}>
              <Icon name="whatsapp" size={22} color={Colors.muted} />
              <Icon name="facebook" size={22} color={Colors.muted} />
              <Icon name="instagram" size={22} color={Colors.muted} />
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const dir: 'row' | 'row-reverse' = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.overlay, zIndex: 0 },
    drawer: {
      // No left/right — translateX alone handles position (see CLOSED_X / OPEN_X constants).
      position: 'absolute', top: 0, bottom: 0,
      backgroundColor: Colors.dark2,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl,
    },
    modeChip: {
      flexDirection: dir, alignItems: 'center', gap: 5,
      alignSelf: 'flex-start', borderRadius: Spacing.radiusFull,
      paddingHorizontal: Spacing.md, paddingVertical: 5, marginBottom: Spacing.md,
    },
    header: { flexDirection: dir, alignItems: 'center', gap: Spacing.md },
    headerInfo: { flex: 1, gap: 2 },
    ratingRow: { flexDirection: dir, alignItems: 'center', gap: 6 },
    addPhotoRow: { flexDirection: dir, alignItems: 'center', gap: 4, marginTop: 2 },
    item: {
      flexDirection: dir, alignItems: 'center', gap: Spacing.md,
      paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, borderRadius: Spacing.radiusSm,
    },
    itemActive: { backgroundColor: Colors.goldAlpha10 },
    footer: { gap: Spacing.md },
    social: { flexDirection: dir, justifyContent: 'center', gap: Spacing.xl, paddingTop: Spacing.sm },
  })
}
