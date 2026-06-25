import { memo, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from './Txt'

interface DividerProps {
  label?: string
  spacing?: number
}

// Plain hairline, or "line — text — line" when label is provided.
export const Divider = memo(function Divider({ label, spacing = Spacing.lg }: DividerProps) {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  if (!label) return <View style={[styles.line, { marginVertical: spacing }]} />
  return (
    <View style={[styles.row, { marginVertical: spacing }]}>
      <View style={styles.flexLine} />
      <Txt size={12} color={Colors.muted} style={styles.label}>{label}</Txt>
      <View style={styles.flexLine} />
    </View>
  )
})

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    line: { height: 1, backgroundColor: Colors.border },
    row: { flexDirection: 'row', alignItems: 'center' },
    flexLine: { flex: 1, height: 1, backgroundColor: Colors.border },
    label: { marginHorizontal: Spacing.md },
  })
}
