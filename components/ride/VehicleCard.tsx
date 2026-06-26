import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../ui/Txt'
import { Badge } from '../ui/Badge'
import { Icon } from '../ui/Icon'
import type { VehicleType } from '../../store/rideStore'
import { useIsRTL } from '../../i18n/locale'

interface VehicleCardProps {
  type: VehicleType
  title: string
  seats: string
  eta: string
  price: number
  isSelected?: boolean
  onPress?: () => void
  isRecommended?: boolean
}

export function VehicleCard({
  type, title, seats, eta, price, isSelected, onPress, isRecommended,
}: VehicleCardProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(isRTL), [isRTL])
  const t = useT()
  const isShe = type === 'she'
  const borderColor = isSelected
    ? (isShe ? Colors.purple : Colors.gold)
    : (isShe ? Colors.purple : 'transparent')
  const bg = isSelected
    ? (isShe ? Colors.purpleAlpha15 : Colors.goldAlpha10)
    : Colors.dark3

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
      <View style={[styles.card, { borderColor, backgroundColor: bg, borderWidth: isSelected ? 2 : isShe ? 1 : 0 }]}>
        {isRecommended && (
          <View style={styles.chipRow}>
            <Badge label={t('veh.fastest')} variant="gold" size="sm" />
          </View>
        )}
        <View style={styles.contentRow}>
          <View style={[styles.iconWrap, { backgroundColor: isShe ? Colors.purpleAlpha15 : Colors.goldAlpha10 }]}>
            <Icon name="car" size={30} color={isShe ? Colors.purple : Colors.gold} />
          </View>
          <View style={styles.info}>
            <Txt weight="bold" size={15} color={isShe ? Colors.purple : Colors.white}>{title}</Txt>
            <Txt size={12} color={Colors.muted}>{seats} • {t('veh.arrival')} {eta}</Txt>
          </View>
          <View style={styles.priceWrap}>
            <Txt weight="black" size={16} color={Colors.gold}>{price.toLocaleString('en-US')}</Txt>
            <Txt size={11} color={Colors.muted}>{t('common.currency')}</Txt>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

function makeStyles(isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    card: {
      borderRadius: 14,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.lg,
      gap: Spacing.sm,
    },
    chipRow: {
      alignSelf: 'flex-start',
    },
    contentRow: {
      flexDirection: row,
      alignItems: 'center',
      gap: Spacing.md,
    },
    iconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1 },
    priceWrap: { flexDirection: row, alignItems: 'baseline', gap: 3 },
  })
}
