import { useCallback, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Button } from '../../components/ui/Button'
import { WebMap } from '../../components/map/WebMap'
import { MapPin } from '../../components/map/MapPin'
import { useRideStore } from '../../store/rideStore'
import { useT } from '../../hooks/useT'
import { ALGIERS_CENTER } from '../../mock/map'

export default function MapPick() {
  const Colors  = useColors()
  const styles  = useMemo(() => makeStyles(Colors), [Colors])
  const insets  = useSafeAreaInsets()
  const t       = useT()
  const params  = useLocalSearchParams<{ field?: 'from' | 'to' }>()
  const field   = params.field ?? 'to'

  const setFrom = useRideStore((s) => s.setFrom)
  const setTo   = useRideStore((s) => s.setTo)

  const [moving,  setMoving]  = useState(false)
  const [pickedLat, setLat]   = useState(ALGIERS_CENTER.lat)
  const [pickedLng, setLng]   = useState(ALGIERS_CENTER.lng)
  const [address, setAddress] = useState<string | null>(null)

  const handleRegionChange = useCallback(() => {
    setMoving(true)
    setAddress(null)
  }, [])

  const handleRegionChangeComplete = useCallback((lat: number, lng: number) => {
    setMoving(false)
    setLat(lat)
    setLng(lng)
    // Reverse-geocode label (best-effort, non-blocking)
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
      { headers: { 'User-Agent': 'WinRakApp/1.0' } }
    )
      .then((r) => r.json())
      .then((d) => setAddress(d.display_name ?? null))
      .catch(() => {})
  }, [])

  function confirm() {
    const place = {
      name:    address ?? t('mapPick.selectedLocation'),
      address: address ?? `${pickedLat.toFixed(5)}, ${pickedLng.toFixed(5)}`,
      lat:     pickedLat,
      lng:     pickedLng,
    }
    if (field === 'from') setFrom(place)
    else                  setTo(place)
    router.back()
  }

  return (
    <View style={styles.root}>

      {/* Full-screen map */}
      <WebMap
        center={{ lat: ALGIERS_CENTER.lat, lng: ALGIERS_CENTER.lng }}
        zoom={15}
        showUser
        variant="explore"
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
      />

      {/* Pin fixed at visual center */}
      <View style={styles.pinWrap} pointerEvents="none">
        <MapPin moving={moving} />
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-right" size={22} color={Colors.white} />
        </Pressable>
        <Txt weight="bold" size={16} color={Colors.white} style={{ flex: 1, textAlign: 'center' }}>
          {field === 'from' ? t('mapPick.titleFrom') : t('mapPick.titleTo')}
        </Txt>
        <View style={{ width: 44 }} />
      </View>

      {/* Address chip — shows resolved address when pin settles */}
      {!moving && address && (
        <View style={styles.addressChip}>
          <Icon name="map-marker" size={15} color={Colors.gold} />
          <Txt size={12} color={Colors.white} numberOfLines={2} style={{ flex: 1 }}>
            {address}
          </Txt>
        </View>
      )}

      {/* Confirm button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button
          label={moving ? t('mapPick.moving') : t('mapPick.confirm')}
          onPress={confirm}
          disabled={moving}
        />
      </View>

    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    root:    { flex: 1 },
    pinWrap: {
      position:        'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      alignItems:      'center',
      justifyContent:  'center',
      // Offset slightly up so the tip of the stem sits on the map center
      marginBottom:    26,
    },
    topBar: {
      position:        'absolute',
      top: 0, left: 0, right: 0,
      flexDirection:   'row-reverse',
      alignItems:      'center',
      paddingHorizontal: Spacing.md,
      paddingBottom:   Spacing.sm,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    backBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center', justifyContent: 'center',
    },
    addressChip: {
      position:        'absolute',
      bottom:          100,
      left:            Spacing.lg,
      right:           Spacing.lg,
      flexDirection:   'row-reverse',
      alignItems:      'center',
      gap:             Spacing.sm,
      backgroundColor: 'rgba(0,0,0,0.75)',
      borderRadius:    Spacing.radiusMd,
      padding:         Spacing.md,
    },
    footer: {
      position:        'absolute',
      bottom: 0, left: 0, right: 0,
      paddingHorizontal: Spacing.lg,
      paddingTop:      Spacing.md,
      backgroundColor: Colors.dark2,
    },
  })
}
