import { useEffect, useMemo, useRef } from 'react'
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from './Txt'
import { Icon } from './Icon'
import { useIsRTL } from '../../i18n/locale'

export interface SheetAction {
  label: string
  icon?: string
  onPress: () => void
  variant?: 'default' | 'cancel' | 'danger'
}

interface ActionSheetProps {
  visible: boolean
  title?: string
  onClose: () => void
  actions: SheetAction[]
}

export function ActionSheet({ visible, title, onClose, actions }: ActionSheetProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const slideAnim = useRef(new Animated.Value(320)).current

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(320)
      Animated.spring(slideAnim, {
        toValue: 0,
        bounciness: 3,
        speed: 14,
        useNativeDriver: true,
      }).start()
    }
  }, [visible, slideAnim])

  if (!visible) return null

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, Spacing.lg), transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Title */}
          {!!title && (
            <Txt weight="bold" size={16} center style={styles.title}>
              {title}
            </Txt>
          )}

          {/* Action cards */}
          <View style={styles.actions}>
            {actions.map((action, i) => {
              const isCancel = action.variant === 'cancel'
              const isDanger = action.variant === 'danger'
              const iconColor = isCancel ? Colors.muted : isDanger ? Colors.danger : Colors.gold
              const textColor = isCancel ? Colors.muted : isDanger ? Colors.danger : Colors.white

              return (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    styles.card,
                    isCancel ? styles.cancelCard : styles.actionCard,
                    pressed && styles.pressed,
                  ]}
                  onPress={action.onPress}
                  android_ripple={{
                    color: isCancel ? Colors.dark4 : Colors.goldAlpha10,
                    borderless: false,
                  }}
                >
                  {!!action.icon && (
                    <View style={[styles.iconWrap, isCancel && styles.iconWrapCancel]}>
                      <Icon name={action.icon} size={20} color={iconColor} />
                    </View>
                  )}
                  <Txt
                    weight={isCancel ? 'regular' : 'semibold'}
                    size={15}
                    color={textColor}
                  >
                    {action.label}
                  </Txt>
                </Pressable>
              )
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: Colors.overlay,
    },
    sheet: {
      backgroundColor: Colors.dark2,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: Spacing.screenPadding,
      paddingTop: Spacing.sm,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: Colors.dark4,
      marginBottom: Spacing.lg,
    },
    title: {
      marginBottom: Spacing.lg,
    },
    actions: {
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    card: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: Spacing.md,
      borderRadius: 14,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
    },
    actionCard: {
      backgroundColor: Colors.dark3,
      borderWidth: 1.5,
      borderColor: Colors.dark4,
    },
    cancelCard: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: Colors.goldAlpha10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapCancel: {
      backgroundColor: 'transparent',
    },
    pressed: {
      opacity: 0.68,
    },
  })
}
