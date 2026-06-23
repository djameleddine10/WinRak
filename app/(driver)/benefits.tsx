import { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Spacing } from '../../constants/spacing'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { Card } from '../../components/ui/Card'
import { TopBar } from '../../components/layout/TopBar'
import { useT } from '../../hooks/useT'
import { type TranslationKey } from '../../i18n/translations'
import { DirIcon } from '../../components/ui/DirIcon'

const LOCKED: { icon: string; titleKey: TranslationKey; subKey: TranslationKey }[] = [
  { icon: 'sort-ascending', titleKey: 'benefits.priorityTitle', subKey: 'benefits.prioritySub' },
  { icon: 'headset',        titleKey: 'benefits.supportTitle',  subKey: 'benefits.supportSub' },
  { icon: 'star',           titleKey: 'benefits.profileTitle',  subKey: 'benefits.profileSub' },
  { icon: 'ticket-percent', titleKey: 'benefits.rewardsTitle',  subKey: 'benefits.rewardsSub' },
]

export default function Benefits() {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const t = useT()
  return (
    <View style={styles.container}>
      <TopBar title={t('benefits.title')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Unlocked perk */}
        <Card radius={14} style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: Colors.blueAlpha15 }]}>
            <Icon name="percent" size={22} color={Colors.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight="bold" size={15}>{t('benefits.lowCommission')}</Txt>
            <Txt size={13} color={Colors.muted}>{t('benefits.lowCommissionSub')}</Txt>
          </View>
          <DirIcon name="chevron-right" size={20} color={Colors.muted} />
        </Card>

        <Txt weight="bold" size={20} style={{ marginVertical: Spacing.lg }}>{t('benefits.earnMore')}</Txt>

        {LOCKED.map((b) => (
          <Card key={b.titleKey} radius={14} style={styles.row}>
            <View style={styles.iconBox}>
              <Icon name={b.icon} size={22} color={Colors.muted} />
              <View style={styles.lockBadge}><Icon name="lock" size={11} color={Colors.dark1} /></View>
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={15} color={Colors.muted}>{t(b.titleKey)}</Txt>
              <Txt size={13} color={Colors.muted}>{t(b.subKey)}</Txt>
            </View>
            <DirIcon name="chevron-right" size={20} color={Colors.muted} />
          </Card>
        ))}

        <View style={styles.lockedCard}>
          <Icon name="lock" size={48} color={Colors.pureWhite} />
          <Txt weight="bold" size={15} color={Colors.pureWhite} center style={{ marginTop: Spacing.md }}>
            {t('benefits.unlockHint')}
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
    row: { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
    iconBox: { width: 48, height: 48, borderRadius: Spacing.radiusMd, backgroundColor: Colors.dark3, alignItems: 'center', justifyContent: 'center' },
    lockBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.muted, alignItems: 'center', justifyContent: 'center' },
    lockedCard: { backgroundColor: Colors.purple, borderRadius: Spacing.radiusLg, padding: Spacing.xxl, alignItems: 'center', marginTop: Spacing.lg },
  })
}
