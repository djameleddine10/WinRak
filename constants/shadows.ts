import { type ViewStyle } from 'react-native'

// Unified elevation system for the whole app.
// Three neutral (black) tiers so depth reads identically on iOS and Android —
// Android's `elevation` ignores shadow color, so colored glows are avoided here
// on purpose; colored accents live only on dedicated CTAs (e.g. the nav home button).
//
//   sm → resting surfaces (cards, inputs)
//   md → interactive / lifted elements (service cards, floating action buttons, dropdowns)
//   lg → surfaces floating above the map or screen (bottom nav, sheets, dialogs)
//
// Note: a view with `overflow: 'hidden'` clips its own iOS shadow; on Android the
// elevation shadow still renders. Keep that in mind when adding to clipped cards.
export const Shadows: Record<'sm' | 'md' | 'lg', ViewStyle> = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 18,
    elevation: 12,
  },
}
