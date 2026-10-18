# XProHub — Design System Reference

> For Claude Design, design tools, and new contributors.
> Source of truth: `constants/theme.ts`. This document explains the
> intent behind the tokens, not just the values.
>
> **2026-10-18 palette:** mid grey + gold (current). Changed from the same-day light-grey
> palette: background `#A6A6A6`, card `#B6B6B6`, border `#808080`, gold `#F5E663`, text `#111111` /
> `#383838` / `#5A5A5A`, green `#1C412D`, blue `#133E5D`, purple `#471998`, red `#770F0F`,
> amber `#F2A93B` + amberText `#513305`, errorFill `#CCC3C3` — which itself replaced Dark Gold
> (bg `#0E0E0F`, card `#171719`, gold `#C9A84C`).

## Brand

**Mission:** "Real Work. Fair Pay. For Everyone."
**Aesthetic:** Dark Gold — luxury meets labor. The app should feel
premium without feeling exclusive. Every visual choice reinforces that
real people do real work here and are treated with dignity.

---

## Color Palette

| Token | Hex | Use (ratio on background / card) |
|---|---|---|
| Background | `#4A4A4D` | All screens — mid grey |
| Card | `#555558` | All cards and surfaces (1.2:1 vs background) |
| Border | `#7C7C80` | Card borders, dividers |
| Gold | `#F0D48A` | Big numbers, prices, names, eyebrows, links, active states, CTAs (6.1:1 bg / 5.1:1 card) |
| Text Primary | `#FFFFFF` | All headings and body text (8.8:1 / 7.4:1) |
| Text Secondary | `#D0D0D4` | Supporting text, metadata (5.7:1 / 4.8:1) |
| Text Tertiary | `#A8A8AE` | Non-text only — dots, separators (3.1:1 card) |
| Green | `#88DDB0` | Success, completions (5.5:1 / 4.6:1) |
| Blue | `#9ED2F7` | Trust, verification, info (5.5:1 / 4.6:1) |
| Purple | `#D8C2FC` | XP, growth (5.5:1 / 4.6:1) |
| Red | `#FFBBBB` | Urgent, alerts, cancel (5.5:1 / 4.6:1) |
| Amber | `#FFBF87` | In-progress, soft warnings — text and fills (5.5:1 / 4.6:1). The amberText split is gone |
| Ink | `#111111` | Text and icons on gold / amber / status-color fills (11.7–13:1) |
| On Dark | `#FFFFFF` | Text on photos and black scrims |
| Error Fill | `#5E3B3E` | Error-box background behind red text + red border (red text 6.0:1) |
| Cream | `#FFFFFF` | Legacy editorial-accent token — same as Text Primary |

### Gold as text

Gold text only at fontSize ≥ 18, or bold at ≥ 14 (big numbers, prices, names, eyebrows
that are large enough, links, active states, the back arrow, the active tab). Smaller
text stays `textPrimary` or `textSecondary`.

### Active/Selected State Pattern

When a card or option is selected:
- Border changes from `border` (#7C7C80) to solid `gold` (#F0D48A)
- Background gets a neutral dark fill: `blackAlpha(0.2)` — never a gold tint
- Text may turn gold if it meets the size rule above

### Surfaces

`background` (#4A4A4D) is the base; `card` (#555558) sits slightly lighter. Selected and
subtle fills use `blackAlpha()`. White appears only as text.

---

## Typography

| Role | Font Family | Weight | Usage |
|---|---|---|---|
| Headings | Space Grotesk | 700 Bold | Screen titles, section headings, card titles |
| Body | Inter | 400 Regular | All body text, form inputs, descriptions |
| Serif accent | Playfair Display | 700 Bold Italic | Taglines, editorial quotes (Welcome screen only) |

### Text Hierarchy

| Element | Size | Color | Weight | Spacing |
|---|---|---|---|---|
| Eyebrow | 11px | `gold` | 700 | letterSpacing: 3 |
| Screen heading | 22-34px | `textPrimary` | Bold | letterSpacing: 0.5-2 |
| Card title | 16px | `textPrimary` | Bold | — |
| Body text | 14px | `textSecondary` | Regular | lineHeight: 20 |
| Button text | 13-16px | varies | Bold | letterSpacing: 1.5 |
| Badge/chip text | 10-11px | varies | 700 | letterSpacing: 1-1.5 |

---

## Spacing Scale

| Token | Value | Common usage |
|---|---|---|
| `xs` | 4px | Tight gaps, badge padding |
| `sm` | 8px | Between related elements |
| `md` | 16px | Card padding, standard gap |
| `lg` | 24px | Section spacing, screen padding |
| `xl` | 32px | Major section breaks |
| `xxl` | 48px | Screen-level vertical padding |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `sm` | 8px | Small chips, error banners |
| `md` | 12px | Cards, buttons, inputs |
| `lg` | 16px | Large cards, modals |
| `full` | 999px | Pill buttons, avatar circles, badges |

---

## Component Patterns

### Cards

The fundamental surface. Used everywhere — job listings, worker
profiles, settings rows, fee panels, lifecycle banners.

```
Background: #555558 (card)
Border: 1px solid #7C7C80 (border)
Border radius: 12px (Radius.md)
Padding: 16px (Spacing.md)
```

### Buttons

**Primary CTA (gold):**
```
Background: #F0D48A (gold)
Text: #111111 (ink) — dark text on gold
Border radius: 12px (Radius.md)
Height: 52-54px
Font: Bold, 15-16px, letterSpacing 1.5
```

**Outline/Secondary:**
```
Background: transparent
Border: 1.5px solid #F0D48A (gold)
Text: #F0D48A (gold)
Border radius: 999px (Radius.full) — pill shape
```

**Destructive:**
```
Background: transparent
Border: 1.5px solid #FFBBBB (red)
Text: #FFBBBB (red)
```

### Status Badges

Small pill-shaped indicators showing state:
```
Border: 1.5px solid {status color}
Border radius: 999px (full)
Padding: 3px horizontal, 9px vertical
Text: 10-11px, bold, letterSpacing 1.5
```

Status colors: gold (open/pending), green (accepted/completed),
amber #FFBF87 (in-progress/awaiting), red (declined/disputed),
grey (expired/withdrawn).

### Form Inputs

```
Background: #555558 (card)
Border: 1px solid #7C7C80 (border)
Border radius: 12px (Radius.md)
Text color: #FFFFFF (textPrimary)
Placeholder color: #D0D0D4 (textSecondary)
Height: 52px (single line)
Padding: 16px horizontal
```

### Overflow Menu ("⋯" button)

Used on worker cards, job detail, chat for Report/Block actions:
```
Position: absolute, top-right of parent
Size: 44x44px (Apple HIG minimum)
Icon: "⋯" character, 18px, #D0D0D4 (textSecondary)
Trigger: ActionSheetIOS (native iOS sheet)
```

---

## Icons

**Current:** Emoji icons for the 20 task categories:

| Category | Icon | Category | Icon |
|---|---|---|---|
| Home Cleaning | 🧹 | Electrical | ⚡ |
| Errands & Delivery | 📦 | Plumbing | 🔧 |
| Pet Care | 🐾 | Painting | 🎨 |
| Child Care | 👶 | Carpentry | 🪚 |
| Elder Care | 🧓 | IT & Tech | 💻 |
| Moving & Labor | 🚚 | HVAC | ❄️ |
| Tutoring | 📚 | Events | 🎉 |
| Coaching | 🏆 | Trash/Recycling | ♻️ |
| Personal Assistance | 🗂️ | Gardening | 🌿 |
| Vehicle Care | 🚗 | Handyman | 🔨 |

**Future direction (post-launch):** Gold Forge custom duotone icon
system — dark base + gold accent highlight, one gold light-source
catch per icon. Replaces emoji with custom-designed icons that
match the Dark Gold aesthetic.

---

## Screen Structure

Every screen follows this hierarchy:
1. `SafeAreaView` with `backgroundColor: #4A4A4D`
2. Header (either system-provided Dark Gold header or custom)
3. Content area (ScrollView or FlatList)
4. Optional: fixed bottom element (composer, CTA bar)

### Dark Gold Header (most screens)

```
Background: #4A4A4D (background)
Title: white, bold
Left: gold "‹" back button (TouchableOpacity)
Shadow: none (headerShadowVisible: false)
```

---

## Interaction Patterns

- **Confirmations:** Native `Alert.alert` with Cancel + action buttons.
  Destructive actions use `style: 'destructive'` (red text on iOS).
- **Action sheets:** `ActionSheetIOS` with `userInterfaceStyle: 'dark'`
  for overflow menus (Report/Block).
- **Loading states:** `ActivityIndicator` in gold or contextual color.
  Buttons show spinner + disabled opacity (0.5).
- **Error states:** Red text (#FFBBBB) centered above the action button.
  Error banners use red border + a red tint background (`redAlpha(0.12)`).

---

## Platform

- **Framework:** React Native + Expo SDK 54
- **Navigation:** Expo Router (file-based, tab bar hidden)
- **State:** React hooks only (useState, useCallback, useEffect, useFocusEffect)
- **Backend:** Supabase (Postgres + Auth + Edge Functions)
- **Payments:** Stripe Connect (Express accounts for workers, PaymentSheet for customers)
- **Target:** iOS first, Android planned
