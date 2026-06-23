import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { DirIcon } from '../../components/ui/DirIcon'
import { Input } from '../../components/ui/Input'
import { useRideStore } from '../../store/rideStore'
import { useUserStore } from '../../store/userStore'
import { recentPlaces } from '../../mock/places'
import type { Place } from '../../mock/places'
import { searchPlaces, getPlaceCoords, type GeoPlace } from '../../services/geocoding.service'

// Fallback mock coords used when GPS is unavailable (simulator / permission denied fallback path)
const MOCK_LAT = 36.7538
const MOCK_LNG = 3.0588

export default function Search() {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const setFrom = useRideStore((s) => s.setFrom)
  const setTo = useRideStore((s) => s.setTo)
  const savedPlaces = useUserStore((s) => s.passenger.savedPlaces)

  const [from, setFromText] = useState('')
  const [to, setToText] = useState('')
  const [locating, setLocating] = useState(false)
  const [geoResults, setGeoResults] = useState<GeoPlace[]>([])
  const [searching, setSearching] = useState(false)
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const proximityRef = useRef<{ lat: number; lng: number } | undefined>(undefined)

  // Debounced geocoding — fires 350ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (to.trim().length < 2) { setGeoResults([]); setSearching(false); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const places = await searchPlaces(to, proximityRef.current)
      setGeoResults(places)
      setSearching(false)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [to])

  async function locateMe() {
    if (locating) return
    setLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        // User denied — send them to Settings to enable location
        await Linking.openSettings()
        setLocating(false)
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const { latitude, longitude } = loc.coords
      proximityRef.current = { lat: latitude, lng: longitude }
      setFromText(t('search.myLocation'))
      setFrom({ name: t('search.myLocationShort'), address: t('search.currentLocation'), lat: latitude, lng: longitude })
    } catch {
      // GPS unavailable (simulator / no signal) — fall back to mock coordinates
      setFromText(t('search.myLocation'))
      setFrom({ name: t('search.myLocationShort'), address: t('search.currentLocation'), lat: MOCK_LAT, lng: MOCK_LNG })
    } finally {
      setLocating(false)
    }
  }

  async function select(p: Place | GeoPlace) {
    Vibration.vibrate(55)
    if (!from) {
      setFrom({ name: t('search.myLocationShort'), address: t('search.currentLocation'), lat: MOCK_LAT, lng: MOCK_LNG })
    }

    // Google Places results have placeId — fetch real coords before navigating
    const geoPlace = p as GeoPlace
    if (geoPlace.placeId && (!p.lat || !p.lng)) {
      setSelectingId(geoPlace.placeId)
      const coords = await getPlaceCoords(geoPlace.placeId)
      setSelectingId(null)
      if (coords) {
        setTo({ name: coords.name || p.name, address: coords.address || p.address, lat: coords.lat, lng: coords.lng })
      } else {
        setTo({ name: p.name, address: p.address, lat: MOCK_LAT, lng: MOCK_LNG })
      }
    } else {
      setTo({ name: p.name, address: p.address, lat: p.lat, lng: p.lng })
    }

    router.push('/(passenger)/vehicle-select')
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <DirIcon name="arrow-left" size={24} color={Colors.white} />
        </Pressable>
        <Txt weight="bold" size={20} style={{ flex: 1 }}>{t('search.title')}</Txt>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Icon name="close" size={18} color={Colors.muted} />
        </Pressable>
      </View>

      <View style={styles.fields}>
        <View style={styles.fieldRow}>
          <View style={[styles.bullet, { backgroundColor: Colors.blue }]} />
          <View style={{ flex: 1 }}>
            <Input
              label={t('search.fromLabel')}
              placeholder={t('search.myLocation')}
              value={from}
              onChangeText={setFromText}
              leftIcon="magnify"
              rightIcon={locating ? 'dots-horizontal' : 'crosshairs-gps'}
              onRightIconPress={locateMe}
            />
          </View>
        </View>
        <View style={styles.fieldRow}>
          <View style={[styles.bullet, { backgroundColor: Colors.muted }]} />
          <View style={{ flex: 1 }}>
            <Input
              label={t('search.toLabel')}
              placeholder={t('search.toPlaceholder')}
              value={to}
              onChangeText={setToText}
              leftIcon="flag"
            />
          </View>
        </View>
      </View>

      {/* Pick on map button */}
      <Pressable style={styles.mapPickBtn} onPress={() => router.push({ pathname: '/(passenger)/map-pick', params: { field: 'to' } })}>
        <Icon name="map-marker-radius" size={20} color={Colors.gold} />
        <Txt size={14} color={Colors.white} style={{ flex: 1 }}>{t('search.pickOnMap')}</Txt>
        <Icon name="chevron-left" size={20} color={Colors.muted} />
      </Pressable>

      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        {searching && (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
            <ActivityIndicator color={Colors.gold} />
          </View>
        )}

        {!searching && geoResults.length > 0 && (
          <>
            <Txt size={12} color={Colors.muted} style={styles.section}>{t('search.results')}</Txt>
            {geoResults.map((p) => (
              <Row
                key={p.id}
                place={p}
                icon="map-marker"
                loading={selectingId === p.placeId}
                onPress={() => select(p)}
              />
            ))}
          </>
        )}

        {!searching && geoResults.length === 0 && (
          <>
            <Txt size={12} color={Colors.muted} style={styles.section}>{t('search.recentSearch')}</Txt>
            {recentPlaces.map((p) => <Row key={p.id} place={p} icon="clock-outline" onPress={() => select(p)} />)}

            <Txt size={12} color={Colors.muted} style={styles.section}>{t('search.savedPlaces')}</Txt>
            <Row
              place={{ id: 'h', name: savedPlaces.home.name, address: savedPlaces.home.address, lat: savedPlaces.home.lat, lng: savedPlaces.home.lng, type: 'home' }}
              icon="home-account"
              onPress={() => select({ ...savedPlaces.home, id: 'h', type: 'home' } as Place)}
            />
            <Row
              place={{ id: 'w', name: savedPlaces.work.name, address: savedPlaces.work.address, lat: savedPlaces.work.lat, lng: savedPlaces.work.lng, type: 'work' }}
              icon="briefcase"
              onPress={() => select({ ...savedPlaces.work, id: 'w', type: 'work' } as Place)}
            />
          </>
        )}
      </ScrollView>
    </View>
  )
}

function Row({ place, icon = 'map-marker', loading = false, onPress }: {
  place:   { id?: string; name: string; address: string; lat?: number; lng?: number; type?: string }
  icon?:   string
  loading?: boolean
  onPress: () => void
}) {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={loading}>
      {loading
        ? <ActivityIndicator size="small" color={Colors.gold} style={{ width: 20 }} />
        : <Icon name={icon} size={20} color={Colors.gold} />
      }
      <View style={{ flex: 1 }}>
        <Txt size={14} weight="bold">{place.name}</Txt>
        <Txt size={12} color={Colors.muted}>{place.address}</Txt>
      </View>
    </Pressable>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1, paddingHorizontal: Spacing.screenPadding },
    header: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.dark3, alignItems: 'center', justifyContent: 'center' },
    fields: { gap: Spacing.md, marginBottom: Spacing.lg },
    fieldRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
    bullet: { width: 10, height: 10, borderRadius: 5, marginTop: 24 },
    section: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
    row: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
    mapPickBtn: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      marginBottom: Spacing.sm,
    },
  })
}
