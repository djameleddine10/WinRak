import { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Spacing } from '../../constants/spacing'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useSettingsStore, type Language } from '../../store/settingsStore'
import { useT } from '../../hooks/useT'
import { Txt } from '../../components/ui/Txt'
import { TopBar } from '../../components/layout/TopBar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Mock legal copy (placeholder), localized per language. Replace with real text before launch.
const BODIES: Record<Language, Record<string, string[]>> = {
  ar: {
    terms: [
      'باستخدامك لتطبيق WinRak فإنك توافق على هذه الشروط. WinRak منصّة وساطة تربط الركّاب بالسائقين، والاتفاق على السعر يتم بين الطرفين.',
      'يلتزم المستخدم بتقديم معلومات صحيحة، واحترام السائقين والركّاب الآخرين، وعدم استخدام الخدمة لأي غرض غير قانوني.',
      'تحتفظ WinRak بحق تعليق أي حساب يخالف هذه الشروط دون إشعار مسبق.',
    ],
    privacy: [
      'نحترم خصوصيتك. نجمع فقط البيانات الضرورية لتشغيل الخدمة: الموقع أثناء الرحلة، رقم الهاتف، وبيانات الرحلات.',
      'لا نشارك بياناتك مع أطراف ثالثة لأغراض تسويقية. تُستعمل بيانات الموقع فقط لمطابقتك مع السائقين القريبين.',
      'يمكنك طلب حذف حسابك وبياناتك في أي وقت من إعدادات الحساب.',
    ],
    license: [
      'WinRak علامة تجارية مسجّلة. جميع الحقوق محفوظة © 2026.',
      'يستخدم التطبيق خرائط مفتوحة المصدر (Leaflet) وبلاطات CARTO وفق تراخيصها.',
      'خطوط Cairo مرخّصة تحت SIL Open Font License.',
    ],
  },
  fr: {
    terms: [
      'En utilisant l’application WinRak, vous acceptez ces conditions. WinRak est une plateforme d’intermédiation reliant passagers et chauffeurs ; le prix est convenu entre les deux parties.',
      'L’utilisateur s’engage à fournir des informations exactes, à respecter les chauffeurs et les autres passagers, et à ne pas utiliser le service à des fins illégales.',
      'WinRak se réserve le droit de suspendre tout compte enfreignant ces conditions, sans préavis.',
    ],
    privacy: [
      'Nous respectons votre vie privée. Nous ne collectons que les données nécessaires au service : la localisation pendant la course, le numéro de téléphone et les données des courses.',
      'Nous ne partageons pas vos données avec des tiers à des fins marketing. La localisation sert uniquement à vous associer aux chauffeurs proches.',
      'Vous pouvez demander la suppression de votre compte et de vos données à tout moment depuis les paramètres.',
    ],
    license: [
      'WinRak est une marque déposée. Tous droits réservés © 2026.',
      'L’application utilise des cartes open source (Leaflet) et des tuiles CARTO selon leurs licences.',
      'La police Cairo est sous licence SIL Open Font License.',
    ],
  },
  en: {
    terms: [
      'By using the WinRak app you agree to these terms. WinRak is an intermediary platform connecting passengers with drivers; the price is agreed between both parties.',
      'The user agrees to provide accurate information, respect drivers and other passengers, and not use the service for any unlawful purpose.',
      'WinRak reserves the right to suspend any account that violates these terms without prior notice.',
    ],
    privacy: [
      'We respect your privacy. We collect only the data needed to run the service: location during the ride, phone number, and ride data.',
      'We do not share your data with third parties for marketing. Location data is used only to match you with nearby drivers.',
      'You can request deletion of your account and data at any time from account settings.',
    ],
    license: [
      'WinRak is a registered trademark. All rights reserved © 2026.',
      'The app uses open-source maps (Leaflet) and CARTO tiles under their licenses.',
      'The Cairo font is licensed under the SIL Open Font License.',
    ],
  },
}

export default function LegalDoc() {
  const Colors = useColors()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const lang = useSettingsStore((s) => s.language)
  const t = useT()
  const { key, title } = useLocalSearchParams<{ key: string; title: string }>()
  const docs = BODIES[lang] ?? BODIES.ar
  const paragraphs = docs[key ?? 'terms'] ?? docs.terms

  return (
    <View style={styles.container}>
      <TopBar title={title ?? t('settings.legal')} showBack />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>
        {paragraphs.map((p, i) => (
          <Txt key={i} size={14} color={Colors.muted} style={styles.para}>{p}</Txt>
        ))}
      </ScrollView>
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    content: { padding: Spacing.screenPadding, gap: Spacing.md },
    para: { lineHeight: 24 },
  })
}
