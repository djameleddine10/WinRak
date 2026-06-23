import { useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { translations, type TranslationKey } from '../i18n/translations'

export type TFunction = (key: TranslationKey, vars?: Record<string, string | number>) => string

// Returns the translate function `t` bound to the active language (settingsStore.language).
// Components re-render on language change because they subscribe to that slice here.
// Falls back to Arabic, then to the raw key, if a translation is missing.
export function useT(): TFunction {
  const lang = useSettingsStore((s) => s.language)
  return useCallback<TFunction>(
    (key, vars) => {
      let str = translations[lang]?.[key] ?? translations.ar[key] ?? key
      if (vars) {
        for (const name in vars) str = str.replace(`{${name}}`, String(vars[name]))
      }
      return str
    },
    [lang],
  )
}
