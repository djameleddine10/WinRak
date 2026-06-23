import { I18nManager } from 'react-native'
import { useSettingsStore, type Language } from '../store/settingsStore'
import { useUserStore } from '../store/userStore'
import { useDriverStore } from '../store/driverStore'
import { currentUser } from '../mock/passengers'
import { mockDrivers } from '../mock/drivers'

// Arabic is the only right-to-left language; French and English are left-to-right.
export const isRTLLang = (lang: Language) => lang === 'ar'

// Persist the native RTL flag so the next cold start has the right direction.
// No reload needed — all layouts use useIsRTL() which is Zustand-reactive and
// updates every component instantly without a bundle restart.
export function syncDirection(lang: Language): void {
  const shouldBeRTL = lang === 'ar'
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.forceRTL(shouldBeRTL)
  }
}

// Reactive hook: true when the active language is Arabic.
// Used by Txt and Input instead of the static I18nManager.isRTL so that switching
// languages updates text direction instantly without a native reload.
export function useIsRTL(): boolean {
  return useSettingsStore((s) => s.language === 'ar')
}

// Direction-aware icon names and flex direction, reactive to the active language.
// Import and call this once per component; destructure what you need.
export function useRTL() {
  const isRTL = useIsRTL()
  return {
    isRTL,
    // Back / dismiss arrows (TopBar, OTP screen, search)
    backIcon:    isRTL ? 'arrow-right'   : 'arrow-left',
    // Forward / continue arrows (Continue buttons)
    forwardIcon: isRTL ? 'arrow-left'    : 'arrow-right',
    // List-row disclosure chevrons
    chevron:     isRTL ? 'chevron-left'  : 'chevron-right',
    // Flex row direction for row-based layouts
    row:         isRTL ? 'row-reverse'   : 'row',
  } as const
}

// True when the string contains Arabic-script characters.
const hasArabic = (s: string) => /[؀-ۿ]/.test(s)

// The user's display name, localized: Arabic script in Arabic, Latin in fr/en.
// On driver screens: reads the trip passenger's name from incomingRide/activeRide.
// On passenger screens: reads the logged-in user's real profile name.
export function usePassengerName(): string {
  const lang         = useSettingsStore((s) => s.language)
  const incomingRide = useDriverStore((s) => s.incomingRide)
  const activeRide   = useDriverStore((s) => s.activeRide)
  const profile      = useUserStore((s) => s.profile)
  // Driver context: return the trip passenger's name (real or mock)
  const tripName = (incomingRide ?? activeRide)?.passenger?.name
  if (tripName) return tripName
  // Passenger context: respect the active language — use Latin fallback if profile is in Arabic but UI is not
  if (profile?.full_name) {
    if (lang !== 'ar' && hasArabic(profile.full_name)) return currentUser.nameLatin
    return profile.full_name
  }
  return lang === 'ar' ? currentUser.name : currentUser.nameLatin
}

// Driver display name, localized: Arabic in Arabic mode, Latin in fr/en.
// Reads from the logged-in user's real profile when available.
export function useDriverName(): string {
  const lang    = useSettingsStore((s) => s.language)
  const profile = useUserStore((s) => s.profile)
  const driver  = mockDrivers[0]
  if (profile?.full_name) {
    if (lang !== 'ar' && hasArabic(profile.full_name)) return driver.nameLatin ?? driver.name
    return profile.full_name
  }
  return lang === 'ar' ? driver.name : (driver.nameLatin ?? driver.name)
}

// Algerian wilaya / place names — Arabic kept as-is, Latin transliterations for fr/en.
const CITY: Record<string, { fr: string; en: string }> = {
  'الجزائر': { fr: 'Alger', en: 'Algiers' },
  'الجزائر العاصمة': { fr: 'Alger', en: 'Algiers' },
  'وهران': { fr: 'Oran', en: 'Oran' },
  'قسنطينة': { fr: 'Constantine', en: 'Constantine' },
  'عنابة': { fr: 'Annaba', en: 'Annaba' },
  'سطيف': { fr: 'Sétif', en: 'Setif' },
  'بجاية': { fr: 'Béjaïa', en: 'Bejaia' },
  'عين مليلة': { fr: "Aïn M'lila", en: "Ain M'lila" },
  'سكيكدة': { fr: 'Skikda', en: 'Skikda' },
}

export function localizeCity(name: string, lang: Language): string {
  if (lang === 'ar') return name
  return CITY[name]?.[lang] ?? name
}

// Hook form: returns a localizer bound to the active language.
export function useLocalizeCity(): (name: string) => string {
  const lang = useSettingsStore((s) => s.language)
  return (name: string) => localizeCity(name, lang)
}
