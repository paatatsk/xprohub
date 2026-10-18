// XProHub Design System — Neutral Grey + Highlighter Gold (2026-10-18)
// Single source of truth for all colors, fonts, and spacing.
// Never hardcode these values in screen files — always import from here.
//
// Palette: neutral mid-grey surfaces (R=G=B), near-black text, and light
// highlighter gold / amber used only as fills, borders and accents — never as
// text. Green / blue / purple / red are dark enough to pass 4.5:1 as text;
// text on those fills uses onDark. Surface fills use whiteAlpha() / blackAlpha().
// (Replaced the Dark Gold palette on 2026-10-18.)

export const Colors = {
  background:     '#A6A6A6',  // All screens — neutral grey (was #1C1C1E)
  gold:           '#F5E663',  // Highlighter yellow — solid fills, borders, accents only, never text (was #BFA356)
  card:           '#B6B6B6',  // All cards and surfaces (was #262629)
  border:         '#808080',  // Card borders, dividers (was #3B3B40)
  textPrimary:    '#111111',  // All headings and body text (was #FFFFFF)
  textSecondary:  '#383838',  // Supporting text, metadata (was #96969E)
  textTertiary:   '#5A5A5A',  // Offline status, fine separators — non-text only (was #727278)
  cream:          '#111111',  // Editorial accent, meta-row emphasis — now same as textPrimary (was #F5EEDC)
  green:          '#1C412D',  // Success, completions, Worker mode — darkened for text (was #4CAF7A)
  blue:           '#133E5D',  // Trust, verification, info — darkened for text (was #4A9EDB)
  purple:         '#471998',  // XP, growth — darkened for text (was #A178E9)
  red:            '#770F0F',  // Urgent, live, alerts, cancel — darkened for text (was #EC6868)
  amber:          '#F2A93B',  // In-progress, soft warnings — light fill only, never text (was #D28D2D)
  amberText:      '#513305',  // In-progress / warning TEXT — dark amber that passes 4.5:1
  ink:            '#111111',  // Text and icons on gold / amber / light fills
  onDark:         '#FFFFFF',  // Text on dark fills (green, blue, purple, red), photos and black scrims
  errorFill:      '#CCC3C3',  // Error-box background — light red-grey behind red text + red border
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
  bodyMed:  'Inter_500Medium',                 // Body medium weight
  serif:    'PlayfairDisplay_700Bold_Italic',   // Serif accent — names, editorial quotes
  display:  'Oswald_600SemiBold',              // Editorial labels, eyebrows, credential headers
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
