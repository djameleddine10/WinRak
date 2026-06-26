import { useEffect, useMemo, useState } from 'react'
import { Animated, Pressable, SectionList, StyleSheet, View } from 'react-native'
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
import { useIsRTL } from '../../../i18n/locale'

type Filter = 'all' | 'city'
const FILTERS: { key: Filter; labelKey: TranslationKey }[] = [
  { key: 'all', labelKey: 'rides.filterAll' },
  { key: 'city', labelKey: 'drawer.city' },
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
  rideType:    'city'
  vehicleType: string
  createdAt:   string
  from:        { name: string }
  to:          { name: string }
  price:       number
}

function dbToDisplay(trip: any): DisplayRide {
  return {
    id:          trip.id,
    status:      trip.status === 'cancelled' ? 'cancelled' : 'completed',
    rideType:    'city',
    vehicleType: trip.vehicle_type === 'she' ? 'she' : 'sedan',
    createdAt:   trip.created_at,
    from:        { name: trip.from_address ?? '' },
    to:          { name: trip.to_address ?? '' },
    price:       trip.price ?? 0,
  }
}

export default function RidesHistory() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const [filter, setFilter] = useState<Filter>('all')
  const t = useT()
  const lang    = useSettingsStore((s) => s.language)
  const profile = useUserStore((s) => s.profile)
  const [realTrips, setRealTrips] = useState<DisplayRide[] | null>(null)
  const [loading, setLoading]    = useState(true)

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return }
    getMyTrips(profile.id, 'passenger')
      .then((data) => { setRealTrips(data.map(dbToDisplay)); setLoading(false) })
      .catch(() => setLoading(false))
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

      {loading ? (
        // Skeleton placeholder cards while loading
        <View style={{ padding: Spacing.screenPadding, gap: Spacing.md }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.card, { opacity: 0.5 }]}>
              <View style={[styles.thumb, { backgroundColor: Colors.dark3 }]} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={{ height: 14, width: '60%', backgroundColor: Colors.dark3, borderRadius: 6 }} />
                <View style={{ height: 11, width: '40%', backgroundColor: Colors.dark3, borderRadius: 6 }} />
              </View>
            </View>
          ))}
        </View>
      ) : sections.length === 0 ? (
        // Empty state
        <View style={styles.empty}>
          <Icon name="car-off" size={52} color={Colors.muted} />
          <Txt size={16} weight="bold" center style={{ marginTop: Spacing.lg }}>{t('rides.title')}</Txt>
          <Txt size={13} color={Colors.muted} center style={{ marginTop: Spacing.sm }}>
            {t('rides.filterAll')} — لا توجد رحلات بعد
          </Txt>
        </View>
      ) : (
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
                  <Txt size={14} weight="bold" numberOfLines={1}>{item.to.name}</Txt>
                  {item.from.name ? (
                    <View style={styles.fromRow}>
                      <Icon name="map-marker-outline" size={12} color={Colors.muted} />
                      <Txt size={12} color={Colors.muted} numberOfLines={1}>{item.from.name}</Txt>
                    </View>
                  ) : null}
                  <Txt size={12} color={Colors.muted}>{item.createdAt.slice(11, 16)}</Txt>
                </View>
                <Txt size={14} weight="bold" color={cancelled ? Colors.muted : Colors.white}>
                  {cancelled ? '--' : item.price.toFixed(0)} {t('common.currency')}
                </Txt>
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    filters: { flexDirection: row, gap: Spacing.sm, padding: Spacing.screenPadding, paddingBottom: 0 },
    pill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Spacing.radiusFull },
    pillOn: { backgroundColor: Colors.white },
    pillOff: { backgroundColor: Colors.dark3 },
    card: { flexDirection: row, alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.dark3, borderRadius: 14, padding: Spacing.md },
    thumb: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    fromRow: { flexDirection: row, alignItems: 'center', gap: 3, marginTop: 1 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  })
}
