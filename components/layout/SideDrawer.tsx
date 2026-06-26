import { useEffect, useMemo, useRef } from 'react'
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native'
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
// ~85% of screen width, capped for tablets.
const DRAWER_W = Math.min(SCREEN_W * 0.85, 340)

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

  // ── Slide-in/out positioning ─────────────────────────────────────────────────
  // We anchor the panel at `left: 0` + `direction: 'ltr'` so `left` is always
  // physical-left regardless of the native RTL flag. translateX then moves the
  // panel to the correct physical edge:
  //   AR  → physical RIGHT: rest at (SCREEN_W − DRAWER_W), close at SCREEN_W
  //   FR/EN → physical LEFT : rest at 0,                     close at −DRAWER_W
  const wantRight = isRTL
  const OPEN_X   = wantRight ? SCREEN_W - DRAWER_W : 0
  const CLOSED_X = wantRight ? SCREEN_W            : -DRAWER_W

  const translateX      = useRef(new Animated.Value(CLOSED_X)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      translateX.setValue(CLOSED_X)
      backdropOpacity.setValue(0)
      Animated.parallel([
        Animated.spring(translateX, {
          toValue:   OPEN_X,
          stiffness: 220,
          damping:   26,
          mass:      0.9,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue:  1,
          duration: 240,
          easing:   Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue:  CLOSED_X,
          duration: 230,
          easing:   Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue:  0,
          duration: 200,
          easing:   Easing.in(Easing.cubic),
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
        { icon: 'car',                        label: t('drawer.city'),         active: true },
        { icon: 'bell',                        label: t('drawer.notifications'), route: '/(passenger)/notifications', badge: 20 },
        { icon: 'shield-check',               label: t('drawer.safety'),        route: '/(passenger)/security' },
        { icon: 'cog',                         label: t('settings.title'),       route: '/(passenger)/settings' },
        { icon: 'message-text',               label: t('drawer.support'),       route: '/(passenger)/help' },
        { icon: 'file-document-edit-outline', label: t('drawer.updateDocs'),    route: '/(driver)/driver-documents' },
      ]
    : [
        { icon: 'car',          label: t('drawer.cityRide'),       active: true },
        { icon: 'bell',         label: t('drawer.notifications'),  route: '/(passenger)/notifications', badge: 3 },
        { icon: 'shield-check', label: t('drawer.safety'),         route: '/(passenger)/security' },
        { icon: 'cog',          label: t('settings.title'),        route: '/(passenger)/settings' },
        { icon: 'message-text', label: t('drawer.support'),        route: '/(passenger)/help' },
      ]

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 999, elevation: 30 }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Panel
          `left: 0` + `direction: 'ltr'` on the panel keeps `left` = physical-left
          regardless of the native RTL flag. The INNER content wrapper then applies
          `direction: isRTL ? 'rtl' : 'ltr'` so all children (text, rows, icons)
          lay out in the correct reading direction for the active language.
          This decouples the panel position (always translateX-based) from the content
          direction (always driven by the live language setting). */}
      <Animated.View
        style={[
          styles.panel,
          {
            left:      0,
            direction: 'ltr',
            width:     DRAWER_W,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Inner content — correct language direction, safe-area aware */}
        <View
          style={[
            styles.inner,
            {
              direction:      isRTL ? 'rtl' : 'ltr',
              paddingTop:     insets.top    + Spacing.lg,
              paddingBottom:  insets.bottom + Spacing.xl,
            },
          ]}
        >
          {/* Mode chip */}
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
                <Icon name="whatsapp"  size={22} color={Colors.muted} />
                <Icon name="facebook"  size={22} color={Colors.muted} />
                <Icon name="instagram" size={22} color={Colors.muted} />
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const dir: 'row' | 'row-reverse' = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    backdrop: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: Colors.overlay,
      zIndex: 0,
    },
    // Outer animated panel — position + shadow only, no padding/direction here.
    panel: {
      position: 'absolute', top: 0, bottom: 0,
      backgroundColor: Colors.dark2,
      shadowColor: '#000',
      shadowOffset: { width: isRTL ? -8 : 8, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 24,
      elevation: 40,
    },
    // Inner content wrapper — handles direction + safe-area padding.
    inner: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
    },
    modeChip: {
      flexDirection: dir, alignItems: 'center', gap: 5,
      alignSelf: 'flex-start', borderRadius: Spacing.radiusFull,
      paddingHorizontal: Spacing.md, paddingVertical: 5, marginBottom: Spacing.md,
    },
    header:       { flexDirection: dir, alignItems: 'center', gap: Spacing.md },
    headerInfo:   { flex: 1, gap: 2 },
    ratingRow:    { flexDirection: dir, alignItems: 'center', gap: 6 },
    addPhotoRow:  { flexDirection: dir, alignItems: 'center', gap: 4, marginTop: 2 },
    item: {
      flexDirection: dir, alignItems: 'center', gap: Spacing.md,
      paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
      borderRadius: Spacing.radiusSm,
    },
    itemActive: { backgroundColor: Colors.goldAlpha10 },
    footer:  { gap: Spacing.md },
    social:  { flexDirection: dir, justifyContent: 'center', gap: Spacing.xl, paddingTop: Spacing.sm },
  })
}
