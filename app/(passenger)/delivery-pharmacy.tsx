import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PhotoUpload } from '../../components/ui/PhotoUpload'
import { TopBar } from '../../components/layout/TopBar'
import { pharmacies as seedPharmacies, type Pharmacy } from '../../mock/delivery'
import { useDeliveryStore } from '../../store/deliveryStore'
import { useT } from '../../hooks/useT'
import { DirIcon } from '../../components/ui/DirIcon'
import { fetchPharmacies } from '../../services/pharmacy.service'

export default function DeliveryPharmacy() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const insets = useSafeAreaInsets()
  const t = useT()
  const cur = t('common.currency')

  const selectPharmacy = useDeliveryStore((s) => s.selectPharmacy)
  const setMethod = useDeliveryStore((s) => s.setMethod)
  const setPrescription = useDeliveryStore((s) => s.setPrescription)

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(seedPharmacies)

  useEffect(() => {
    fetchPharmacies()
      .then((list) => { if (list.length > 0) setPharmacies(list) })
      .catch(() => {})
  }, [])

  const firstOpen = pharmacies.find((p) => p.openNow) ?? pharmacies[0]
  const [selectedId, setSelectedId] = useState(firstOpen?.id ?? '')
  const [rxUri, setRxUri] = useState<string | null>(null)
  const selected = pharmacies.find((p) => p.id === selectedId) ?? firstOpen

  const isNight = (() => { const h = new Date().getHours(); return h >= 20 || h < 7 })()

  function pick(p: Pharmacy) {
    if (!p.openNow && !p.open24h) return
    setSelectedId(p.id)
  }

  function goCatalog() {
    selectPharmacy(selected)
    setMethod('catalog')
    router.push('/(passenger)/delivery-meds')
  }

  function goPrescription() {
    if (!rxUri) return
    selectPharmacy(selected)
    setMethod('prescription')
    setPrescription(rxUri)
    router.push('/(passenger)/delivery-checkout')
  }

  return (
    <View style={styles.container}>
      <TopBar title={t('delivery.pharmacyTitle')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Day / night 24-7 highlight */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name={isNight ? 'weather-night' : 'white-balance-sunny'} size={28} color={Colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.heroTitle}>
              <Txt weight="bold" size={15}>{t('pharmacy.heroTitle')}</Txt>
              <Badge label={t('pharmacy.nightBadge')} variant="green" size="sm" icon="hours-24" />
            </View>
            <Txt size={12} color={Colors.muted} style={{ marginTop: 2 }}>
              {isNight ? t('pharmacy.nightActive') : t('pharmacy.dayActive')}
            </Txt>
          </View>
        </View>

        {/* Pharmacy picker */}
        <Txt size={12} color={Colors.muted} style={styles.section}>{t('pharmacy.choosePharmacy')}</Txt>
        <View style={{ gap: Spacing.sm }}>
          {pharmacies.map((p) => {
            const closed = !p.openNow && !p.open24h
            const active = p.id === selectedId
            return (
              <Pressable key={p.id} onPress={() => pick(p)} disabled={closed}>
                <View style={[styles.phRow, active && styles.phRowActive, closed && styles.phRowClosed]}>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.phTitle}>
                      <Txt weight="bold" size={14}>{p.name}</Txt>
                      {p.open24h
                        ? <Badge label="24/24" variant="green" size="sm" />
                        : closed
                          ? <Badge label={t('pharmacy.closed')} variant="red" size="sm" />
                          : <Badge label={t('pharmacy.open')} variant="gray" size="sm" />}
                    </View>
                    <View style={styles.phMeta}>
                      <Icon name="map-marker-outline" size={13} color={Colors.muted} />
                      <Txt size={11} color={Colors.muted}>{p.area}</Txt>
                      <Txt size={11} color={Colors.muted}>· {p.distanceKm} {t('common.km')}</Txt>
                      <Icon name="star" size={13} color={Colors.gold} />
                      <Txt size={11} color={Colors.muted}>{p.rating}</Txt>
                    </View>
                  </View>
                  <View style={styles.phRight}>
                    <Txt size={11} color={Colors.muted}>{t('pharmacy.delivery')}</Txt>
                    <Txt weight="bold" size={13} color={Colors.gold}>{p.deliveryFee} {cur}</Txt>
                    <Txt size={10} color={Colors.muted}>~{p.etaMin} {t('pharmacy.min')}</Txt>
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>

        {/* How to order */}
        <Txt size={12} color={Colors.muted} style={styles.section}>{t('pharmacy.howToOrder')}</Txt>

        <Card style={styles.method} onPress={goCatalog}>
          <View style={styles.methodRow}>
            <View style={[styles.methodIcon, { backgroundColor: Colors.goldAlpha15 }]}>
              <Icon name="pill" size={26} color={Colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={15}>{t('pharmacy.browseMeds')}</Txt>
              <Txt size={12} color={Colors.muted} style={{ marginTop: 2 }}>{t('pharmacy.browseMedsSub')}</Txt>
            </View>
            <DirIcon name="chevron-right" size={24} color={Colors.muted} />
          </View>
        </Card>

        <View style={styles.rxCard}>
          <View style={styles.methodRow}>
            <View style={[styles.methodIcon, { backgroundColor: Colors.successAlpha15 }]}>
              <Icon name="file-upload-outline" size={26} color={Colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={15}>{t('pharmacy.rxOrder')}</Txt>
              <Txt size={12} color={Colors.muted} style={{ marginTop: 2 }}>{t('pharmacy.rxOrderSub')}</Txt>
            </View>
          </View>
          <View style={styles.rxUpload}>
            <PhotoUpload
              size={96}
              shape="square"
              label={t('pharmacy.rxPhoto')}
              initialUri={rxUri}
              onPhotoSelected={setRxUri}
            />
          </View>
          <Button label={t('pharmacy.continuePay')} icon="arrow-right" iconPosition="right" disabled={!rxUri} onPress={goPrescription} />
        </View>

        <View style={{ height: insets.bottom + Spacing.lg }} />
      </ScrollView>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding },
    hero: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md,
      backgroundColor: Colors.successAlpha15, borderRadius: Spacing.radiusLg, padding: Spacing.md,
    },
    heroIcon: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.dark2,
      alignItems: 'center', justifyContent: 'center',
    },
    heroTitle: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
    section: { marginTop: Spacing.xl, marginBottom: Spacing.sm },
    phRow: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd,
      borderWidth: 1.5, borderColor: 'transparent', padding: Spacing.md,
    },
    phRowActive: { borderColor: Colors.gold },
    phRowClosed: { opacity: 0.5 },
    radio: {
      width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.dark4,
      alignItems: 'center', justifyContent: 'center',
    },
    radioActive: { borderColor: Colors.gold },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gold },
    phTitle: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
    phMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 4 },
    phRight: { alignItems: 'center', gap: 2 },
    method: { padding: Spacing.lg, marginBottom: Spacing.md },
    methodRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
    methodIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    rxCard: {
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusMd, padding: Spacing.lg, gap: Spacing.md,
    },
    rxUpload: { alignItems: 'center', paddingVertical: Spacing.sm },
  })
}
