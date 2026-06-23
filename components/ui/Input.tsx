import { useMemo, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Typography } from '../../constants/typography'
import { Txt } from './Txt'
import { Icon } from './Icon'
import { useIsRTL } from '../../i18n/locale'

type InputType = 'text' | 'phone' | 'otp' | 'numeric'

interface InputProps {
  placeholder?: string
  value: string
  onChangeText: (t: string) => void
  leftIcon?: string
  rightIcon?: string
  onRightIconPress?: () => void
  type?: InputType
  error?: string
  required?: boolean
  label?: string
  multiline?: boolean
}

export function Input({
  placeholder, value, onChangeText, leftIcon, rightIcon, onRightIconPress,
  type = 'text', error, required, label, multiline,
}: InputProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const [focused, setFocused] = useState(false)

  if (type === 'otp') return <OtpInput value={value} onChangeText={onChangeText} />

  const borderColor = error ? Colors.danger : focused ? Colors.gold : 'transparent'

  return (
    <View style={styles.wrap}>
      {!!label && (value.length > 0 || focused) && (
        <Txt size={12} color={Colors.muted} style={styles.label}>
          {label}{required ? ' *' : ''}
        </Txt>
      )}
      <View style={[styles.field, { borderColor, height: multiline ? 80 : Spacing.inputHeight }]}>
        {type === 'phone' && (
          <View style={styles.prefix}>
            <Txt size={14}>🇩🇿</Txt>
            <Txt size={14} color={Colors.white}>+213</Txt>
          </View>
        )}
        {leftIcon && <Icon name={leftIcon} size={18} color={Colors.muted} />}
        <TextInput
          style={[styles.input, multiline && styles.multiline, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={type === 'phone' || type === 'numeric' ? 'number-pad' : 'default'}
          multiline={multiline}
        />
        {rightIcon && (
          <Icon name={rightIcon} size={18} color={Colors.gold} style={styles.rightIcon} onPress={onRightIconPress} />
        )}
      </View>
      {!!error && <Txt size={12} color={Colors.danger} style={styles.error}>{error}</Txt>}
    </View>
  )
}

function OtpInput({ value, onChangeText }: { value: string; onChangeText: (t: string) => void }) {
  // Single hidden field driving 6 visual boxes.
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const [focused, setFocused] = useState(false)
  const digits = value.split('')
  return (
    <View style={styles.otpWrap}>
      <TextInput
        style={styles.otpHidden}
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/[^0-9]/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <View style={styles.otpRow} pointerEvents="none">
        {Array.from({ length: 6 }).map((_, i) => {
          const active = focused && i === digits.length
          const filled = !!digits[i]
          return (
            <View
              key={i}
              style={[
                styles.otpBox,
                { borderColor: active ? Colors.gold : 'transparent', backgroundColor: filled ? Colors.dark4 : Colors.dark3 },
              ]}
            >
              <Txt weight="bold" size={22} color={Colors.gold}>{digits[i] ?? ''}</Txt>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  return StyleSheet.create({
    wrap: { width: '100%' },
    label: { marginBottom: 4, ...(isRTL ? { marginRight: 4 } : { marginLeft: 4 }) },
    field: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: Colors.dark3,
      borderRadius: 10,
      borderWidth: 1.5,
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
    },
    prefix: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 4,
      ...(isRTL
        ? { paddingLeft: Spacing.sm, borderLeftWidth: 1, borderLeftColor: Colors.dark4 }
        : { paddingRight: Spacing.sm, borderRightWidth: 1, borderRightColor: Colors.dark4 }),
    },
    input: {
      flex: 1, color: Colors.white, fontFamily: Typography.fonts.regular, fontSize: 14,
    },
    multiline: { textAlignVertical: 'top', paddingTop: Spacing.md },
    rightIcon: {},
    error: { marginTop: 4, ...(isRTL ? { marginRight: 4 } : { marginLeft: 4 }) },
    otpWrap: { width: '100%' },
    otpHidden: { position: 'absolute', width: '100%', height: 52, opacity: 0, zIndex: 2 },
    otpRow: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'center', gap: Spacing.sm },
    otpBox: { width: 52, height: 52, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  })
}
