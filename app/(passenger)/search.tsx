import { useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
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
import { GOOGLE_MAPS_KEY } from '../../constants/config'

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
  const [locating, setLocating] = useState(false)
  const proximityRef = useRef<{ lat: number; lng: number } | undefined>(undefined)

  async function locateMe() {
    if (locating) return
    setLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
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
      setFromText(t('search.myLocation'))
      setFrom({ name: t('search.myLocationShort'), address: t('search.currentLocation'), lat: MOCK_LAT, lng: MOCK_LNG })
    } finally {
      setLocating(false)
    }
  }

  function selectSaved(p: Place) {
    Vibration.vibrate(55)
    if (!from) setFrom({ name: t('search.myLocationShort'), address: t('search.currentLocation'), lat: MOCK_LAT, lng: MOCK_LNG })
    setTo({ name: p.name, address: p.address, lat: p.lat, lng: p.lng })
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

      {/* From field */}
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
      </View>

      {/* To field — Google Places Autocomplete */}
      <View style={styles.toSection}>
        <View style={[styles.bullet, { backgroundColor: Colors.muted, marginTop: 36 }]} />
        <View style={styles.toField}>
          <Txt size={11} color={Colors.muted} style={{ marginBottom: 4, textAlign: 'right' }}>
            {t('search.toLabel')}
          </Txt>
          <GooglePlacesAutocomplete
            placeholder={t('search.toPlaceholder')}
            minLength={2}
            debounce={300}
            fetchDetails
            enablePoweredByContainer={false}
            query={{
              key: GOOGLE_MAPS_KEY,
              language: 'ar',
              components: 'country:dz',
              types: 'geocode|establishment',
            }}
            onPress={(data, details) => {
              Vibration.vibrate(55)
              if (!from) setFrom({ name: t('search.myLocationShort'), address: t('search.currentLocation'), lat: MOCK_LAT, lng: MOCK_LNG })
              const loc = details?.geometry?.location
              setTo({
                name: details?.name || data.description,
                address: data.description,
                lat: loc?.lat ?? MOCK_LAT,
                lng: loc?.lng ?? MOCK_LNG,
              })
              router.push('/(passenger)/vehicle-select')
            }}
            textInputProps={{
              textAlign: 'right',
              placeholderTextColor: Colors.muted,
            }}
            styles={{
              container:          { flex: 0, zIndex: 100 },
              textInputContainer: { backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd, paddingHorizontal: Spacing.sm },
              textInput:          { backgroundColor: 'transparent', color: Colors.white, fontSize: 14, height: 44, marginBottom: 0 },
              listView:           { backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd, marginTop: 4, elevation: 10 },
              row:                { backgroundColor: 'transparent', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
              description:        { color: Colors.white, textAlign: 'right', fontSize: 14 },
              separator:          { backgroundColor: Colors.border, height: 1 },
            }}
          />
        </View>
      </View>

      {/* Pick on map */}
      <Pressable
        style={styles.mapPickBtn}
        onPress={() => router.push({ pathname: '/(passenger)/map-pick', params: { field: 'to' } })}
      >
        <Icon name="map-marker-radius" size={20} color={Colors.gold} />
        <Txt size={14} color={Colors.white} style={{ flex: 1 }}>{t('search.pickOnMap')}</Txt>
        <Icon name="chevron-left" size={20} color={Colors.muted} />
      </Pressable>

      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <Txt size={12} color={Colors.muted} style={styles.section}>{t('search.recentSearch')}</Txt>
        {recentPlaces.map((p) => (
          <Row key={p.id} place={p} icon="clock-outline" onPress={() => selectSaved(p as Place)} />
        ))}

        <Txt size={12} color={Colors.muted} style={styles.section}>{t('search.savedPlaces')}</Txt>
        <Row
          place={{ id: 'h', name: savedPlaces.home.name, address: savedPlaces.home.address, lat: savedPlaces.home.lat, lng: savedPlaces.home.lng, type: 'home' }}
          icon="home-account"
          onPress={() => selectSaved({ ...savedPlaces.home, id: 'h', type: 'home' } as Place)}
        />
        <Row
          place={{ id: 'w', name: savedPlaces.work.name, address: savedPlaces.work.address, lat: savedPlaces.work.lat, lng: savedPlaces.work.lng, type: 'work' }}
          icon="briefcase"
          onPress={() => selectSaved({ ...savedPlaces.work, id: 'w', type: 'work' } as Place)}
        />
      </ScrollView>
    </View>
  )
}

function Row({ place, icon = 'map-marker', onPress }: {
  place:   { id?: string; name: string; address: string; lat?: number; lng?: number; type?: string }
  icon?:   string
  onPress: () => void
}) {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Icon name={icon} size={20} color={Colors.gold} />
      <View style={{ flex: 1 }}>
        <Txt size={14} weight="bold">{place.name}</Txt>
        <Txt size={12} color={Colors.muted}>{place.address}</Txt>
      </View>
    </Pressable>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container:  { flex: 1, backgroundColor: Colors.dark1, paddingHorizontal: Spacing.screenPadding },
    header:     { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
    closeBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.dark3, alignItems: 'center', justifyContent: 'center' },
    fields:     { gap: Spacing.md, marginBottom: Spacing.md },
    fieldRow:   { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
    bullet:     { width: 10, height: 10, borderRadius: 5 },
    toSection:  { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md, zIndex: 100 },
    toField:    { flex: 1, zIndex: 100 },
    section:    { marginTop: Spacing.lg, marginBottom: Spacing.sm },
    row:        { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
    mapPickBtn: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: Colors.dark3, borderRadius: Spacing.radiusMd,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      marginBottom: Spacing.sm,
    },
  })
}
