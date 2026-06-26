import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { useSettingsStore } from '../../store/settingsStore'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../ui/Txt'
import { Icon } from '../ui/Icon'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import type { Driver } from '../../mock/drivers'
import { useIsRTL } from '../../i18n/locale'

interface DriverCardProps {
  driver: Driver
  showActions?: boolean
  compact?: boolean
  onCall?: () => void
  onMessage?: () => void
}

export function DriverCard({ driver, showActions, compact, onCall, onMessage }: DriverCardProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(isRTL), [isRTL])
  const t = useT()
  const lang = useSettingsStore((s) => s.language)

  // Language-reactive name: Arabic script in Arabic mode, Latin transliteration otherwise
  const displayName = lang === 'ar' ? driver.name : (driver.nameLatin ?? driver.name)
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Avatar initial={initial} size={compact ? 44 : 52} showBorder />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Txt weight="bold" size={15}>{displayName}</Txt>
            {driver.isVerified && <Icon name="check-decagram" size={16} color={Colors.success} />}
          </View>
          <View style={styles.metaRow}>
            <Icon name="star" size={13} color={Colors.gold} />
            <Txt size={12} color={Colors.gold}>{driver.rating}</Txt>
            <Txt size={12} color={Colors.muted}>• {t('profile.rides', { n: driver.totalRides })}</Txt>
          </View>
          {!compact && (
            <Txt size={12} color={Colors.muted}>
              {t(driver.vehicle.modelKey)} • {t(driver.vehicle.colorKey)} • {driver.vehicle.plate}
            </Txt>
          )}
        </View>
      </View>

      {showActions && (
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button label={t('common.message')} icon="message-text" variant="outline" size="md" onPress={onMessage} />
          </View>
          <View style={styles.action}>
            <Button label={t('common.call')} icon="phone" variant="outline" size="md" onPress={onCall} />
          </View>
        </View>
      )}
    </View>
  )
}

function makeStyles(isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    wrap: { gap: Spacing.md },
    row: { flexDirection: row, alignItems: 'center', gap: Spacing.md },
    info: { flex: 1, gap: 2 },
    nameRow: { flexDirection: row, alignItems: 'center', gap: 6 },
    metaRow: { flexDirection: row, alignItems: 'center', gap: 4 },
    actions: { flexDirection: row, gap: Spacing.sm },
    action: { flex: 1 },
  })
}
