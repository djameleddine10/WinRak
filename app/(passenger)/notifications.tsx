import { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { TopBar } from '../../components/layout/TopBar'
import { useT } from '../../hooks/useT'
import { mockNotifications, mockNotificationsFilled } from '../../mock/notifications'

// Toggle this to preview the empty state.
const USE_FILLED = true
const data = USE_FILLED ? mockNotificationsFilled : mockNotifications

function makeTypeIcon(Colors: Palette): Record<string, { icon: string; color: string }> {
  return {
    ride_completed: { icon: 'check-circle', color: Colors.success },
    promo: { icon: 'fire', color: Colors.gold },
    sos_resolved: { icon: 'shield-check', color: Colors.blue },
  }
}

export default function Notifications() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const TYPE_ICON = useMemo(() => makeTypeIcon(Colors), [Colors])
  const t = useT()
  return (
    <View style={styles.container}>
      <TopBar title={t('drawer.notifications')} showBack />
      {data.length === 0 ? (
        <View style={styles.empty}>
          <Svg width={140} height={140} viewBox="0 0 140 140">
            <Rect x={30} y={30} width={80} height={80} rx={12} fill={Colors.goldAlpha10} rotation={20} originX={70} originY={70} />
            <Rect x={40} y={40} width={60} height={60} rx={10} fill={Colors.goldAlpha15} rotation={-10} originX={70} originY={70} />
            <Ellipse cx={70} cy={78} rx={34} ry={12} fill={Colors.gold} />
            <Ellipse cx={70} cy={66} rx={18} ry={16} fill={Colors.dark4} />
            <Circle cx={56} cy={82} r={2.4} fill={Colors.dark1} />
            <Circle cx={70} cy={84} r={2.4} fill={Colors.dark1} />
            <Circle cx={84} cy={82} r={2.4} fill={Colors.dark1} />
          </Svg>
          <Txt weight="bold" size={20} center style={{ marginTop: Spacing.lg }}>{t('notifications.emptyTitle')}</Txt>
          <Txt size={13} color={Colors.muted} center style={{ marginTop: 6 }}>{t('notifications.emptySub')}</Txt>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {data.map((n) => {
            const ti = TYPE_ICON[n.type]
            return (
              <View key={n.id} style={[styles.card, !n.read && styles.unread]}>
                <View style={[styles.icon, { backgroundColor: Colors.dark3 }]}>
                  <Icon name={ti.icon} size={20} color={ti.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt size={14} weight="bold">{t(n.titleKey)}</Txt>
                  <Txt size={12} color={Colors.muted}>{t(n.bodyKey)}</Txt>
                </View>
                <Txt size={11} color={Colors.muted}>{n.time.slice(11, 16)}</Txt>
              </View>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.screenPadding },
    list: { padding: Spacing.screenPadding, gap: Spacing.sm },
    card: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.md },
    unread: { borderRightWidth: 3, borderRightColor: Colors.gold, backgroundColor: Colors.dark3 },
    icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  })
}
