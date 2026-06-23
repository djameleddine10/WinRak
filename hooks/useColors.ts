import { useColorScheme } from 'react-native'
import { darkColors, lightColors, type Palette } from '../constants/colors'
import { useSettingsStore } from '../store/settingsStore'

// Resolves the user's theme preference to a concrete scheme. When the mode is
// 'system', it follows the device color scheme reactively.
export function useResolvedScheme(): 'light' | 'dark' {
  const mode = useSettingsStore((s) => s.themeMode)
  const scheme = useColorScheme()
  if (mode !== 'system') return mode
  return scheme === 'light' ? 'light' : 'dark'
}

// Active palette for the resolved scheme. Re-renders when the device scheme or
// the user's preference changes.
export function useColors(): Palette {
  return useResolvedScheme() === 'light' ? lightColors : darkColors
}

// Convenience for screens that need the raw preference (e.g. the appearance picker).
export function useThemeMode() {
  return useSettingsStore((s) => s.themeMode)
}
