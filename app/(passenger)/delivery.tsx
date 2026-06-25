import { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { TopBar } from '../../components/layout/TopBar'
import { useDeliveryStore, type DeliveryService } from '../../store/deliveryStore'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'
import { DirIcon } from '../../components/ui/DirIcon'

interface ServiceDef {
  service:  DeliveryService
  titleKey: TranslationKey
  subKey:   TranslationKey
  icon:     string
  accent:   (c: Palette) => string
  tint:     (c: Palette) => string
  badge?:   { label: string; variant: 'gold' | 'green' | 'blue' }
}

const SERVICES: ServiceDef[] = [
  {
    service: 'pharmacy',
    titleKey: 'delivery.pharmacyTitle',
    subKey: 'delivery.pharmacySub',
    icon: 'medical-bag',
    accent: (c) => c.success,
    tint: (c) => c.successAlpha15,
    badge: { label: '24/24', variant: 'green' },
  },
  {
    service: 'food',
    titleKey: 'delivery.foodTitle',
    subKey: 'delivery.foodSub',
    icon: 'silverware-fork-knife',
    accent: (c) => c.gold,
    tint: (c) => c.goldAlpha15,
    badge: { label: 'قريباً', variant: 'gold' as const },
  },
  {
    service: 'parcel',
    titleKey: 'delivery.parcelTitle',
    subKey: 'delivery.parcelSub',
    icon: 'package-variant',
    accent: (c) => c.blue,
    tint: (c) => c.blueAlpha15,
  },
]

export default function Delivery() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const reset = useDeliveryStore((s) => s.reset)
  const setService = useDeliveryStore((s) => s.setService)
  const t = useT()


  function open(service: DeliveryService) {
    reset()
    setService(service)
    if (service === 'pharmacy') router.push('/(passenger)/delivery-pharmacy')
    else if (service === 'food') router.push('/(passenger)/delivery-food')
    else router.push('/(passenger)/packages')
  }

  return (
    <View style={styles.container}>
      <TopBar title={t('service.delivery')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="moped" size={34} color={Colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight="black" size={18}>{t('delivery.heroTitle')}</Txt>
            <Txt size={13} color={Colors.muted} style={{ marginTop: 2 }}>
              {t('delivery.heroSub')}
            </Txt>
          </View>
        </View>

        <Txt size={12} color={Colors.muted} style={styles.section}>{t('delivery.chooseService')}</Txt>

        <View style={{ gap: Spacing.md }}>
          {SERVICES.map((s) => (
            <Card key={s.service} onPress={() => open(s.service)} leftAccent={s.accent(Colors)} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={[styles.iconWrap, { backgroundColor: s.tint(Colors) }]}>
                  <Icon name={s.icon} size={30} color={s.accent(Colors)} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Txt weight="bold" size={16}>{t(s.titleKey)}</Txt>
                    {s.badge && <Badge label={s.badge.label} variant={s.badge.variant} size="sm" />}
                  </View>
                  <Txt size={12} color={Colors.muted} style={{ marginTop: 4 }}>{t(s.subKey)}</Txt>
                </View>
                <DirIcon name="chevron-right" size={24} color={Colors.muted} />
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.nightBanner}>
          <Icon name="weather-night" size={22} color={Colors.success} />
          <Txt size={13} color={Colors.white} style={{ flex: 1 }}>
            {t('delivery.nightBanner')}
          </Txt>
        </View>
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
      backgroundColor: Colors.dark2, borderRadius: Spacing.radiusLg, padding: Spacing.lg,
    },
    heroIcon: {
      width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.goldAlpha10,
      alignItems: 'center', justifyContent: 'center',
    },
    section: { marginTop: Spacing.xl, marginBottom: Spacing.sm },
    card: { padding: Spacing.lg },
    cardRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md },
    iconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    titleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm },
    nightBanner: {
      flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: Colors.successAlpha15, borderRadius: Spacing.radiusMd,
      padding: Spacing.md, marginTop: Spacing.xl,
    },
  })
}
