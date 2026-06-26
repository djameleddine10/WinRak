import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/distance'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../ui/Txt'
import { Icon } from '../ui/Icon'
import { useIsRTL } from '../../i18n/locale'

interface RideInfoRowProps {
  distanceKm: number
  durationMin: number
  price: number
}

// Three pill chips: distance / duration / price.
export function RideInfoRow({ distanceKm, durationMin, price }: RideInfoRowProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
    const t = useT()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const distanceUnit = useSettingsStore((s) => s.distanceUnit)
  const chips = [
    { icon: 'map-marker-distance', label: formatDistance(distanceKm, distanceUnit) },
    { icon: 'clock-outline', label: `${durationMin} ${t('common.min')}` },
    { icon: 'cash', label: `${price.toLocaleString('en-US')} ${t('common.currency')}` },
  ]
  return (
    <View style={styles.row}>
      {chips.map((c) => (
        <View key={c.icon} style={styles.chip}>
          <Icon name={c.icon} size={15} color={Colors.gold} />
          <Txt size={12} color={Colors.white}>{c.label}</Txt>
        </View>
      ))}
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    row: { flexDirection: row, gap: Spacing.sm },
    chip: {
      flex: 1,
      flexDirection: row,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: Colors.dark3,
      borderRadius: Spacing.radiusFull,
      paddingVertical: Spacing.sm,
    },
  })
}
