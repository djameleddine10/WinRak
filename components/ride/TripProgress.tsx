import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Txt } from '../ui/Txt'

interface TripProgressProps {
  progress: number // 0..1
  driverArriving?: boolean
}

export function TripProgress({ progress, driverArriving = true }: TripProgressProps) {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const pct = Math.max(0, Math.min(1, progress)) * 100
  return (
    <View style={styles.wrap}>
      <Txt size={13} color={Colors.muted}>
        {driverArriving ? t('trip.driverArriving') : t('trip.inProgress')}
      </Txt>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
        <View style={[styles.dot, { left: `${pct}%` }]} />
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    wrap: { gap: 8 },
    track: { height: 6, backgroundColor: Colors.dark3, borderRadius: 999, justifyContent: 'center' },
    fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: Colors.gold, borderRadius: 999 },
    dot: {
      position: 'absolute', width: 12, height: 12, borderRadius: 6,
      backgroundColor: Colors.pureWhite, marginLeft: -6,
      borderWidth: 2, borderColor: Colors.gold,
    },
  })
}
