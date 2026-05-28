// XProHub Design System — Dark Gold (Locked)
// Single source of truth for all colors, fonts, and spacing.
// Never hardcode these values in screen files — always import from here.

export const Colors = {
  background:     '#0E0E0F',  // All screens — never changes
  gold:           '#C9A84C',  // CTAs, highlights, big numbers, borders
  card:           '#171719',  // All cards and surfaces
  border:         '#2E2E33',  // Card borders, dividers
  textPrimary:    '#FFFFFF',  // All headings and body text
  textSecondary:  '#888890',  // Supporting text, metadata
  textTertiary:   '#555558',  // Offline status, fine separators
  cream:          '#F5EEDC',  // Editorial accent, meta-row emphasis
  green:          '#4CAF7A',  // Success, completions, Worker mode
  blue:           '#4A9EDB',  // Trust, verification, info
  purple:         '#9B6EE8',  // XP, growth, Royal theme
  red:            '#E05252',  // Urgent, live, alerts, cancel
  amber:          '#E5901A',  // In-progress, soft warnings
};

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
