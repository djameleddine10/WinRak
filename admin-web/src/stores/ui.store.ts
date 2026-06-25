import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light'
export type Lang  = 'fr'   | 'ar'

interface UIState {
  theme: Theme
  lang:  Lang
  setTheme: (t: Theme) => void
  setLang:  (l: Lang)  => void
}

export function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  } else {
    document.documentElement.classList.remove('light')
    document.documentElement.classList.add('dark')
  }
}

export function applyLang(lang: Lang) {
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      lang:  'fr',
      setTheme: (theme) => { applyTheme(theme); set({ theme }) },
      setLang:  (lang)  => { applyLang(lang);   set({ lang  }) },
    }),
    { name: 'winrak-ui' }
  )
)
