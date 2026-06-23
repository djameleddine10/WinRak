import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type ThemeMode = 'light' | 'dark' | 'system'
export type DistanceUnit = 'km' | 'mi'
export type Language = 'ar' | 'fr' | 'en'

interface SettingsStore {
  themeMode:       ThemeMode
  distanceUnit:    DistanceUnit
  language:        Language
  setThemeMode:    (mode: ThemeMode) => void
  setDistanceUnit: (unit: DistanceUnit) => void
  setLanguage:     (lang: Language) => void
}

// App preferences. Theme default follows the device ('system'). Persisted across
// restarts via async-storage (only the three preference values are stored).
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      themeMode:       'system',
      distanceUnit:    'km',
      language:        'ar',
      setThemeMode:    (themeMode) => set({ themeMode }),
      setDistanceUnit: (distanceUnit) => set({ distanceUnit }),
      setLanguage:     (language) => set({ language }),
    }),
    {
      name:    'winrak-settings',
      version: 2,
      // v2 migration: reset language to Arabic for all existing users.
      // WinRak is an Algerian app — Arabic is the primary language.
      migrate: (old: any) => ({
        themeMode:    old.themeMode    ?? 'system',
        distanceUnit: old.distanceUnit ?? 'km',
        language:     'ar',
      }),
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        themeMode:    s.themeMode,
        distanceUnit: s.distanceUnit,
        language:     s.language,
      }),
    },
  ),
)
