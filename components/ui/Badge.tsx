import { memo } from 'react'
import { StyleSheet, View } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from './Txt'
import { Icon } from './Icon'

type BadgeVariant = 'gold' | 'green' | 'red' | 'blue' | 'purple' | 'gray'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  icon?: string
}

export const Badge = memo(function Badge({ label, variant = 'gold', size = 'md', icon }: BadgeProps) {
  const Colors = useColors()
  const v = makeVariants(Colors)[variant]
  const fontSize = size === 'sm' ? 10 : 12
  return (
    <View style={[styles.base, { backgroundColor: v.bg }]}>
      {icon && <Icon name={icon} size={fontSize + 2} color={v.text} />}
      <Txt weight="semibold" size={fontSize} color={v.text}>{label}</Txt>
    </View>
  )
})

function makeVariants(Colors: Palette): Record<BadgeVariant, { bg: string; text: string }> {
  return {
    gold:   { bg: Colors.goldAlpha15,    text: Colors.gold    },
    green:  { bg: Colors.successAlpha15, text: Colors.success },
    red:    { bg: Colors.dangerAlpha10,  text: Colors.danger  },
    blue:   { bg: Colors.blueAlpha15,    text: Colors.blue    },
    purple: { bg: Colors.purpleAlpha15,  text: Colors.purple  },
    gray:   { bg: Colors.dark3,          text: Colors.muted   },
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Spacing.radiusFull,
    alignSelf: 'flex-start',
  },
})
