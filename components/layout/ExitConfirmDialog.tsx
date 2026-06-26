import { useMemo } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../ui/Txt'
import { Button } from '../ui/Button'
import { useT } from '../../hooks/useT'
import { useIsRTL } from '../../i18n/locale'

interface ExitConfirmDialogProps {
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Bottom sheet modal confirming exit from a registration flow.
export function ExitConfirmDialog({ visible, onConfirm, onCancel }: ExitConfirmDialogProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const t = useT()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Txt weight="bold" size={20} center>{t('exit.title')}</Txt>
          <Txt size={13} color={Colors.muted} center style={{ marginTop: 6 }}>
            {t('exit.body')}
          </Txt>
          <View style={styles.actions}>
            <View style={styles.flex}>
              <Button label={t('common.yes')} variant="primary" onPress={onConfirm} />
            </View>
            <View style={styles.flex}>
              <Button label={t('common.no')} variant="ghost" style={styles.noBtn} onPress={onCancel} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: Colors.dark2,
      borderTopLeftRadius: Spacing.radiusLg,
      borderTopRightRadius: Spacing.radiusLg,
      padding: Spacing.xl,
      paddingBottom: Spacing.xxxl,
      gap: Spacing.md,
    },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.dark4, alignSelf: 'center', marginBottom: Spacing.sm },
    actions: { flexDirection: row, gap: Spacing.md, marginTop: Spacing.md },
    flex: { flex: 1 },
    noBtn: { backgroundColor: Colors.dark3 },
  })
}
