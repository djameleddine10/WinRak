import { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { TopBar } from '../../components/layout/TopBar'
import { useT } from '../../hooks/useT'
import { useIsRTL } from '../../i18n/locale'
import { type TranslationKey } from '../../i18n/translations'

type AccentColor = 'gold' | 'danger' | 'success'

interface SectionConfig {
  icon: string
  accent: AccentColor
  titleKey: TranslationKey
  leadKey: TranslationKey
  bullets?: TranslationKey[]
  steps?: { icon: string; textKey: TranslationKey }[]
}

const SECTIONS: Record<string, SectionConfig> = {
  g1: {
    icon: 'shield-check',
    accent: 'gold',
    titleKey: 'security.g1',
    leadKey: 'security.d.g1.lead',
    bullets: ['security.d.g1.b1', 'security.d.g1.b2', 'security.d.g1.b3'],
  },
  g2: {
    icon: 'card-account-details',
    accent: 'gold',
    titleKey: 'security.g2',
    leadKey: 'security.d.g2.lead',
    bullets: ['security.d.g2.b1', 'security.d.g2.b2', 'security.d.g2.b3'],
  },
  g3: {
    icon: 'phone-lock',
    accent: 'gold',
    titleKey: 'security.g3',
    leadKey: 'security.d.g3.lead',
    bullets: ['security.d.g3.b1', 'security.d.g3.b2', 'security.d.g3.b3'],
  },
  g4: {
    icon: 'lock',
    accent: 'gold',
    titleKey: 'security.g4',
    leadKey: 'security.d.g4.lead',
    bullets: ['security.d.g4.b1', 'security.d.g4.b2', 'security.d.g4.b3'],
  },
  incidents: {
    icon: 'alert-circle',
    accent: 'danger',
    titleKey: 'security.d.incidents.title',
    leadKey: 'security.d.incidents.lead',
    steps: [
      { icon: 'emoticon-cool-outline',  textKey: 'security.d.incidents.s1' },
      { icon: 'shield-alert',           textKey: 'security.d.incidents.s2' },
      { icon: 'phone',                  textKey: 'security.d.incidents.s3' },
      { icon: 'map-marker-outline',     textKey: 'security.d.incidents.s4' },
      { icon: 'lightbulb-outline',      textKey: 'security.d.incidents.s5' },
    ],
  },
}

export default function SecurityDetail() {
  const { detailKey } = useLocalSearchParams<{ detailKey: string }>()
  const Colors = useColors()
  const isRTL = useIsRTL()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const t = useT()

  const section = SECTIONS[detailKey ?? 'g1']
  if (!section) return null

  const accentColor = {
    gold:    Colors.gold,
    danger:  Colors.danger,
    success: Colors.success,
  }[section.accent]

  const accentBg = {
    gold:    Colors.goldAlpha10,
    danger:  Colors.dangerAlpha10,
    success: Colors.successAlpha15,
  }[section.accent]

  return (
    <View style={styles.container}>
      <TopBar title={t(section.titleKey)} showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero icon */}
        <View style={[styles.heroIcon, { backgroundColor: accentBg }]}>
          <Icon name={section.icon} size={48} color={accentColor} />
        </View>

        {/* Lead paragraph */}
        <Txt size={15} color={Colors.muted} style={styles.lead}>
          {t(section.leadKey)}
        </Txt>

        {/* Bullet list for informational sections */}
        {section.bullets && (
          <View style={styles.bulletList}>
            {section.bullets.map((bk, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: accentColor }]} />
                <Txt size={14} style={styles.bulletText}>{t(bk)}</Txt>
              </View>
            ))}
          </View>
        )}

        {/* Step cards for incidents */}
        {section.steps && (
          <View style={styles.stepList}>
            {section.steps.map((s, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={[styles.stepNum, { backgroundColor: accentColor }]}>
                  <Txt weight="bold" size={13} color={Colors.pureWhite}>{i + 1}</Txt>
                </View>
                <View style={[styles.stepIconWrap, { backgroundColor: accentBg }]}>
                  <Icon name={s.icon} size={22} color={accentColor} />
                </View>
                <Txt size={14} style={styles.stepText}>{t(s.textKey)}</Txt>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: {
      padding: Spacing.screenPadding,
      gap: Spacing.lg,
      paddingBottom: Spacing.xxxl,
    },
    heroIcon: {
      alignSelf: 'center',
      width: 100,
      height: 100,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    lead: {
      textAlign: isRTL ? 'right' : 'left',
      lineHeight: 22,
    },
    bulletList: {
      gap: Spacing.md,
    },
    bulletRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: Colors.dark3,
      borderRadius: 12,
      padding: Spacing.md,
    },
    bulletDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      flexShrink: 0,
    },
    bulletText: {
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    stepList: {
      gap: Spacing.md,
    },
    stepCard: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: Colors.dark3,
      borderRadius: 14,
      padding: Spacing.md,
    },
    stepNum: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    stepIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    stepText: {
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
  })
}
