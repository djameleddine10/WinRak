// Theme palettes. Keys are semantic across both themes:
//   dark1 = app background, dark2 = surface (cards/nav/sheets),
//   dark3 = elevated surface / input bg, dark4 = high elevation,
//   white = primary foreground (text/icons), muted = secondary foreground,
//   border = hairline separators, pureWhite = literal white (stays white in both).
// The dark/light names are historical; treat them as semantic slots.

export const darkColors = {
  gold:           '#ffbc07',
  dark1:          '#22272b',
  dark2:          '#222834',
  dark3:          '#2d343c',
  dark4:          '#353f54',
  white:          '#f0f2f5',
  muted:          '#8a95a3',
  danger:         '#e05555',
  success:        '#3ec97c',
  blue:           '#4a90e2',
  purple:         '#9b59b6',
  pink:           '#ec4899',
  driverGreen:    '#2d8a4e',
  overlay:        'rgba(0,0,0,0.5)',
  border:         'rgba(255,255,255,0.06)',
  goldAlpha10:    'rgba(255,188,7,0.10)',
  goldAlpha15:    'rgba(255,188,7,0.15)',
  goldAlpha20:    'rgba(255,188,7,0.20)',
  dangerAlpha10:  'rgba(224,85,85,0.10)',
  dangerAlpha30:  'rgba(224,85,85,0.30)',
  successAlpha15: 'rgba(62,201,124,0.15)',
  purpleAlpha15:  'rgba(155,89,182,0.15)',
  pinkAlpha15:    'rgba(236,72,153,0.15)',
  blueAlpha15:    'rgba(74,144,226,0.15)',
  pureWhite:      '#ffffff',
} as const

// Widened type: same keys, plain string values so both palettes are assignable.
export type Palette = { readonly [K in keyof typeof darkColors]: string }
export type ColorKey = keyof Palette

export const lightColors: Palette = {
  gold:           '#ffbc07',
  dark1:          '#f2f3f5',
  dark2:          '#ffffff',
  dark3:          '#eceef1',
  dark4:          '#d7dbe0',
  white:          '#16181b',
  muted:          '#687180',
  danger:         '#d93a3a',
  success:        '#1f9d57',
  blue:           '#2f73c4',
  purple:         '#8a45a8',
  pink:           '#db2777',
  driverGreen:    '#237a42',
  overlay:        'rgba(0,0,0,0.45)',
  border:         'rgba(0,0,0,0.08)',
  goldAlpha10:    'rgba(255,188,7,0.12)',
  goldAlpha15:    'rgba(255,188,7,0.18)',
  goldAlpha20:    'rgba(255,188,7,0.24)',
  dangerAlpha10:  'rgba(217,58,58,0.10)',
  dangerAlpha30:  'rgba(217,58,58,0.22)',
  successAlpha15: 'rgba(31,157,87,0.15)',
  purpleAlpha15:  'rgba(138,69,168,0.15)',
  pinkAlpha15:    'rgba(219,39,119,0.15)',
  blueAlpha15:    'rgba(47,115,196,0.15)',
  pureWhite:      '#ffffff',
}

// Backward-compatible default export: any module not yet migrated to the
// useColors() hook keeps importing this and stays on the dark palette.
export const Colors: Palette = darkColors
