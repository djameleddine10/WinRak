import { useMemo } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Typography } from '../../constants/typography'
import { Txt } from '../ui/Txt'
import { Icon } from '../ui/Icon'

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
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const clamp = (v: number) => Math.max(min, Math.min(max, v))

  return (
    <View style={styles.wrap}>
      <View style={styles.amountRow}>
        <Pressable onPress={() => onChange(clamp(value - step))} style={styles.stepper}>
          <Icon name="minus" size={20} color={Colors.gold} />
        </Pressable>

        <View style={styles.amount}>
          <TextInput
            style={[styles.input, { fontSize: compact ? 24 : Typography.sizes.hero }]}
            value={String(value)}
            onChangeText={(text) => onChange(clamp(parseInt(text.replace(/[^0-9]/g, '') || '0', 10)))}
            keyboardType="number-pad"
            textAlign="center"
          />
          <Txt size={14} color={Colors.muted}>{t('common.currency')}</Txt>
        </View>

        <Pressable onPress={() => onChange(clamp(value + step))} style={styles.stepper}>
          <Icon name="plus" size={20} color={Colors.gold} />
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

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    wrap: { gap: Spacing.md },
    amountRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
    stepper: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: Colors.dark3, alignItems: 'center', justifyContent: 'center',
    },
    amount: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 6 },
    input: {
      fontFamily: Typography.fonts.black,
      color: Colors.gold,
      minWidth: 100,
      textAlign: 'center',
      padding: 0,
    },
    chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
    chip: {
      paddingHorizontal: Spacing.md, paddingVertical: 6,
      borderRadius: Spacing.radiusFull, borderWidth: 1.5, borderColor: 'transparent',
      backgroundColor: Colors.dark3,
    },
    chipActive: { borderColor: Colors.gold, backgroundColor: Colors.goldAlpha10 },
  })
}
