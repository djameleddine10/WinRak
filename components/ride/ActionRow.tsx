import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../ui/Txt'
import { Icon } from '../ui/Icon'
import { useIsRTL } from '../../i18n/locale'

interface ActionRowProps {
  onCall?: () => void
  onMessage?: () => void
  onSOS?: () => void
}

// Three equal action buttons: call / message / SOS.
export function ActionRow({ onCall, onMessage, onSOS }: ActionRowProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
    const t = useT()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  return (
    <View style={styles.row}>
      <Pressable style={styles.btn} onPress={onCall}>
        <Icon name="phone" size={20} color={Colors.success} />
        <Txt size={12}>{t('common.call')}</Txt>
      </Pressable>
      <Pressable style={styles.btn} onPress={onMessage}>
        <Icon name="message-text" size={20} color={Colors.blue} />
        <Txt size={12}>{t('common.message')}</Txt>
      </Pressable>
      <Pressable style={[styles.btn, { backgroundColor: Colors.danger }]} onPress={onSOS}>
        <Icon name="shield-check" size={20} color={Colors.pureWhite} />
        <Txt size={12} color={Colors.pureWhite}>{t('common.sos')}</Txt>
      </Pressable>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    row: { flexDirection: row, gap: Spacing.sm },
    btn: {
      flex: 1, height: 52, borderRadius: Spacing.radiusMd,
      backgroundColor: Colors.dark3, alignItems: 'center', justifyContent: 'center', gap: 2,
    },
  })
}
