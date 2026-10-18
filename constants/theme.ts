// XProHub Design System — Mid Grey + Gold (2026-10-18)
// Single source of truth for all colors, fonts, and spacing.
// Never hardcode these values in screen files — always import from here.
//
// Palette: mid-grey surfaces (R=G=B ± a touch of blue), white text, soft gold
// for big numbers, prices, names, eyebrows and active states. Gold as TEXT
// only at fontSize >= 18, or bold at >= 14; smaller text stays white or
// textSecondary. Status colors are light enough to pass 4.5:1 as text on both
// background and card; text on their fills uses ink. Surface fills use
// whiteAlpha() / blackAlpha() — never gold tints.
// (Replaced the light-grey palette on 2026-10-18, which replaced Dark Gold.)

export const Colors = {
  background:     '#4A4A4D',  // All screens (was #A6A6A6)
  gold:           '#F0D48A',  // Big numbers, prices, names, eyebrows, active states, CTAs (was #F5E663)
  card:           '#555558',  // All cards and surfaces (was #B6B6B6)
  border:         '#7C7C80',  // Card borders, dividers (was #808080)
  textPrimary:    '#FFFFFF',  // All headings and body text (was #111111)
  textSecondary:  '#D0D0D4',  // Supporting text, metadata (was #383838)
  textTertiary:   '#A8A8AE',  // Offline status, fine separators — non-text only (was #5A5A5A)
  cream:          '#FFFFFF',  // Legacy editorial-accent token — same as textPrimary (was #111111)
  green:          '#88DDB0',  // Success, completions (was #1C412D)
  blue:           '#9ED2F7',  // Trust, verification, info (was #133E5D)
  purple:         '#D8C2FC',  // XP, growth (was #471998)
  red:            '#FFBBBB',  // Urgent, alerts, cancel (was #770F0F)
  amber:          '#FFBF87',  // In-progress, soft warnings — text and fills (was #F2A93B; amberText #513305 merged in)
  ink:            '#111111',  // Text and icons on gold / amber / status-color fills
  onDark:         '#FFFFFF',  // Text on photos and black scrims
  errorFill:      '#5E3B3E',  // Error-box background — dark red tint behind red text + red border (was #CCC3C3)
};

function hexAlpha(color: string, alpha: number): string {
  const hex = color.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Gold at a given opacity, derived from Colors.gold — use for tints and
// translucent borders instead of hardcoding rgba() values.
export function goldAlpha(alpha: number): string {
  return hexAlpha(Colors.gold, alpha);
}

// Red at a given opacity, derived from Colors.red — use for error-box tints.
export function redAlpha(alpha: number): string {
  return hexAlpha(Colors.red, alpha);
}

// Neutral overlays — use for raised / selected surface fills instead of
// tinted (gold) fills, so surfaces stay neutral grey.
export function whiteAlpha(alpha: number): string {
  return hexAlpha('#FFFFFF', alpha);
}

export function blackAlpha(alpha: number): string {
  return hexAlpha('#000000', alpha);
}

// Background at a given opacity, derived from Colors.background — use for
// translucent backdrops (e.g. stamps over photos) instead of hardcoding rgba().
export function backgroundAlpha(alpha: number): string {
  return hexAlpha(Colors.background, alpha);
}

export const Fonts = {
  heading:  'SpaceGrotesk_700Bold',            // All headings — Space Grotesk Bold
  body:     'Inter_400Regular',                // All body text — Inter
  bodyMed:  'Inter_500Medium',                 // Body medium — secondary text (one step up for readability)
  bodySemi: 'Inter_600SemiBold',               // Body semibold — prices, names, status / button labels
  serif:    'PlayfairDisplay_700Bold_Italic',   // Serif accent — names, editorial quotes
  display:  'Oswald_700Bold',                  // Editorial labels, eyebrows, buttons — bold since gold no longer marks them (was Oswald_600SemiBold)
  displayB: 'Oswald_700Bold',                  // Display bold variant
  mono:     'IBMPlexMono_400Regular',          // Ledger voice — dates, trace IDs, money metadata
  monoMed:  'IBMPlexMono_500Medium',           // Mono medium — track records, ID numbers
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  full: 999,
};
