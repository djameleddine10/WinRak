import { useEffect, useMemo, useState } from 'react'
import { Pressable, SectionList, StyleSheet, View } from 'react-native'
import { type Palette } from '../../../constants/colors'
import { useColors } from '../../../hooks/useColors'
import { Spacing } from '../../../constants/spacing'
import { Txt } from '../../../components/ui/Txt'
import { TopBar } from '../../../components/layout/TopBar'
import { Icon } from '../../../components/ui/Icon'
import { useT } from '../../../hooks/useT'
import { type TranslationKey } from '../../../i18n/translations'
import { useSettingsStore, type Language } from '../../../store/settingsStore'
import { useUserStore } from '../../../store/userStore'
import { getMyTrips } from '../../../services/trips.service'

type Filter = 'all' | 'city' | 'intercity'
const FILTERS: { key: Filter; labelKey: TranslationKey }[] = [
  { key: 'all', labelKey: 'rides.filterAll' },
  { key: 'city', labelKey: 'drawer.city' },
  { key: 'intercity', labelKey: 'drawer.intercity' },
]

const MONTHS: Record<Language, string[]> = {
  ar: ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

function dateLabel(iso: string, lang: Language) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[lang][d.getMonth()]}`
}

type DisplayRide = {
  id:          string
  status:      string
  rideType:    'city' | 'intercity'
  vehicleType: string
  createdAt:   string
  to:          { name: string }
  price:       number
}

function dbToDisplay(trip: any): DisplayRide {
  return {
    id:          trip.id,
    status:      trip.status === 'cancelled' ? 'cancelled' : 'completed',
    rideType:    trip.vehicle_type === 'intercites' ? 'intercity' : 'city',
    vehicleType: trip.vehicle_type === 'she' ? 'she' : 'sedan',
    createdAt:   trip.created_at,
    to:          { name: trip.to_address ?? '' },
    price:       trip.price ?? 0,
  }
}

export default function RidesHistory() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const [filter, setFilter] = useState<Filter>('all')
  const t = useT()
  const lang    = useSettingsStore((s) => s.language)
  const profile = useUserStore((s) => s.profile)
  const [realTrips, setRealTrips] = useState<DisplayRide[] | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    getMyTrips(profile.id, 'passenger')
      .then((data) => setRealTrips(data.map(dbToDisplay)))
      .catch(console.warn)
  }, [profile?.id])

  const allItems: DisplayRide[] = realTrips ?? []

  const sections = useMemo(() => {
    const filtered = allItems.filter((r) => filter === 'all' || r.rideType === filter)
    const groups: Record<string, DisplayRide[]> = {}
    filtered.forEach((r) => {
      const k = dateLabel(r.createdAt, lang)
      ;(groups[k] ??= []).push(r)
    })
    return Object.entries(groups).map(([title, data]) => ({ title, data }))
  }, [filter, lang, allItems])

  return (
    <View style={styles.container}>
      <TopBar title={t('rides.title')} />
      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const on = filter === f.key
          return (
            <Pressable key={f.key} style={[styles.pill, on ? styles.pillOn : styles.pillOff]} onPress={() => setFilter(f.key)}>
              <Txt size={13} color={on ? Colors.dark1 : Colors.muted} weight={on ? 'bold' : 'regular'}>{t(f.labelKey)}</Txt>
            </Pressable>
          )
        })}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.screenPadding, gap: Spacing.md }}
        renderSectionHeader={({ section }) => (
          <Txt weight="bold" size={14} style={{ marginTop: Spacing.sm }}>{section.title}</Txt>
        )}
        renderItem={({ item }) => {
          const cancelled = item.status === 'cancelled'
          const isShe = item.vehicleType === 'she'
          return (
            <View style={styles.card}>
              <View style={[styles.thumb, { backgroundColor: isShe ? Colors.purpleAlpha15 : Colors.goldAlpha10 }]}>
                <Icon name="car" size={30} color={isShe ? Colors.purple : Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                {cancelled && <Txt size={12} color={Colors.danger}>{t('rides.cancelled')}</Txt>}
                <Txt size={16} weight="bold">{item.to.name}</Txt>
                <Txt size={13} color={Colors.muted}>{item.createdAt.slice(11, 16)}</Txt>
              </View>
              <Txt size={14} weight="bold" color={cancelled ? Colors.muted : Colors.white}>
                {cancelled ? '0.00' : item.price.toFixed(2)} {t('common.currency')}
              </Txt>
            </View>
          )
        }}
      />
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    filters: { flexDirection: 'row-reverse', gap: Spacing.sm, padding: Spacing.screenPadding, paddingBottom: 0 },
    pill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Spacing.radiusFull },
    pillOn: { backgroundColor: Colors.white },
    pillOff: { backgroundColor: Colors.dark3 },
    card: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.dark3, borderRadius: 14, padding: Spacing.md },
    thumb: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  })
}
