import { useCallback, useMemo } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Typography } from '../../constants/typography'
import { Txt } from '../ui/Txt'
import { Icon } from '../ui/Icon'
import { useIsRTL } from '../../i18n/locale'

interface PriceInputProps {
  value: number
  onChange: (v: number) => void
  suggestedPrices?: number[]
  min?: number
  max?: number
  step?: number
  compact?: boolean
}

export function PriceInput({
  value, onChange, suggestedPrices = [], min = 300, max = 3000, step = 50, compact,
}: PriceInputProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
    const t = useT()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])

  const clamp = useCallback((v: number) => Math.max(min, Math.min(max, v)), [min, max])
  const dec = useCallback(() => onChange(clamp(value - step)), [onChange, clamp, value, step])
  const inc = useCallback(() => onChange(clamp(value + step)), [onChange, clamp, value, step])
  const onText = useCallback(
    (text: string) => onChange(clamp(parseInt(text.replace(/[^0-9]/g, '') || '0', 10))),
    [onChange, clamp],
  )

  const atMin = value <= min
  const atMax = value >= max

  return (
    <View style={styles.wrap}>
      <View style={styles.amountRow}>
        <Pressable
          onPress={dec}
          disabled={atMin}
          hitSlop={10}
          accessibilityRole="button"
          style={[styles.stepper, atMin && styles.stepperDisabled]}
        >
          <Icon name="minus" size={20} color={atMin ? Colors.muted : Colors.gold} />
        </Pressable>

        <View style={styles.amount}>
          <TextInput
            style={[styles.input, { fontSize: compact ? 24 : Typography.sizes.hero }]}
            value={String(value)}
            onChangeText={onText}
            keyboardType="number-pad"
            textAlign="center"
            maxLength={5}
          />
          <Txt size={14} color={Colors.muted}>{t('common.currency')}</Txt>
        </View>

        <Pressable
          onPress={inc}
          disabled={atMax}
          hitSlop={10}
          accessibilityRole="button"
          style={[styles.stepper, atMax && styles.stepperDisabled]}
        >
          <Icon name="plus" size={20} color={atMax ? Colors.muted : Colors.gold} />
        </Pressable>
      </View>

      {suggestedPrices.length > 0 && (
        <View style={styles.chips}>
          {suggestedPrices.map((p) => {
            const active = p === value
            return (
              <Pressable
                key={p}
                onPress={() => onChange(clamp(p))}
                hitSlop={6}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Txt size={13} color={active ? Colors.gold : Colors.muted}>{p.toLocaleString('en-US')}</Txt>
              </Pressable>
            )
          })}
        </View>
      )}
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    wrap: { gap: Spacing.md },
    amountRow: { flexDirection: row, alignItems: 'center', justifyContent: 'space-between' },
    stepper: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: Colors.dark3, alignItems: 'center', justifyContent: 'center',
    },
    stepperDisabled: { opacity: 0.4 },
    amount: { flexDirection: row, alignItems: 'baseline', gap: 6 },
    input: {
      fontFamily: Typography.fonts.black,
      color: Colors.gold,
      minWidth: 100,
      textAlign: 'center',
      padding: 0,
    },
    chips: { flexDirection: row, flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
    chip: {
      paddingHorizontal: Spacing.md, paddingVertical: 6,
      borderRadius: Spacing.radiusFull, borderWidth: 1.5, borderColor: 'transparent',
      backgroundColor: Colors.dark3,
    },
    chipActive: { borderColor: Colors.gold, backgroundColor: Colors.goldAlpha10 },
  })
}
