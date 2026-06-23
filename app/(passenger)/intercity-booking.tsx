import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/distance'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { TopBar } from '../../components/layout/TopBar'
import { useUserStore } from '../../store/userStore'
import { useRideStore } from '../../store/rideStore'
import { popularIntercityRoutes } from '../../mock/places'
import { useT } from '../../hooks/useT'
import { useLocalizeCity, useIsRTL } from '../../i18n/locale'

export default function IntercityBooking() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const distanceUnit = useSettingsStore((s) => s.distanceUnit)
  const insets = useSafeAreaInsets()
  const currentCity = useUserStore((s) => s.currentCity)
  const setRideType = useRideStore((s) => s.setRideType)
  const setLuggage = useRideStore((s) => s.setLuggage)
  const t = useT()
  const city = useLocalizeCity()
  const isRTL = useIsRTL()

  const [luggage, setLocalLuggage] = useState(false)
  const [dest, setDest] = useState('')

  function search() {
    setRideType('intercity')
    setLuggage(luggage)
    router.push('/(passenger)/vehicle-select')
  }

  return (
    <View style={styles.container}>
      <TopBar title={t('drawer.intercityRide')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card radius={14}>
          <View style={styles.routeRow}>
            <View style={[styles.bullet, { backgroundColor: Colors.blue }]} />
            <Txt size={14} weight="bold">{t('intercity.from', { city: city(currentCity) })}</Txt>
          </View>
          <View style={styles.routeLine} />
          <Pressable style={styles.routeRow} onPress={() => router.push('/(passenger)/search')}>
            <View style={[styles.bullet, { backgroundColor: Colors.muted }]} />
            <Txt size={14} color={dest ? Colors.white : Colors.muted}>{dest ? city(dest) : t('intercity.toWhere')}</Txt>
          </Pressable>
        </Card>

        <Card radius={14} style={styles.dateRow}>
          <Icon name="calendar" size={20} color={Colors.gold} />
          <Txt size={14} style={{ flex: 1 }}>{t('intercity.departureDate')}</Txt>
          <Txt size={14} color={Colors.muted}>{t('intercity.todayTime')}</Txt>
        </Card>

        <Card radius={14} style={styles.dateRow}>
          <Icon name="bag-suitcase" size={20} color={Colors.gold} />
          <Txt size={14} style={{ flex: 1 }}>{t('intercity.allowLuggage')}</Txt>
          <Switch
            value={luggage}
            onValueChange={setLocalLuggage}
            trackColor={{ true: Colors.gold, false: Colors.dark4 }}
            thumbColor={Colors.white}
          />
        </Card>

        <Txt size={12} color={Colors.muted} style={styles.section}>{t('intercity.popularRoutes')}</Txt>
        {popularIntercityRoutes.map((r, i) => (
          <Pressable key={i} style={styles.popRow} onPress={() => setDest(r.to)}>
            <Txt size={14} weight="bold" style={{ flex: 1 }}>{city(r.from)} {isRTL ? '←' : '→'} {city(r.to)}</Txt>
            <Txt size={12} color={Colors.muted}>({t('profile.rides', { n: r.count })})</Txt>
            <View style={styles.kmChip}><Txt size={11} color={Colors.gold}>{formatDistance(r.distanceKm, distanceUnit)}</Txt></View>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button label={t('intercity.searchRide')} onPress={search} />
      </View>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding, gap: Spacing.md },
    routeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
    routeLine: { width: 1, height: 20, backgroundColor: Colors.dark4, marginRight: 4, marginVertical: 4 },
    bullet: { width: 12, height: 12, borderRadius: 6 },
    dateRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
    section: { marginTop: Spacing.md },
    popRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    kmChip: { backgroundColor: Colors.goldAlpha10, borderRadius: Spacing.radiusFull, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
    footer: { padding: Spacing.screenPadding, paddingTop: Spacing.sm },
  })
}
