# XProHub — Design System Reference

> For Claude Design, design tools, and new contributors.
> Source of truth: `constants/theme.ts`. This document explains the
> intent behind the tokens, not just the values.
>
> **2026-10-18 retheme:** Dark Gold replaced by neutral grey + highlighter gold.
> Changed from: background `#0E0E0F`, card `#171719`, border `#2E2E33`, gold `#C9A84C`,
> text `#FFFFFF` / `#888890` / `#555558`, green `#4CAF7A`, blue `#4A9EDB`, purple `#9B6EE8`,
> red `#E05252`, amber `#E5901A`. Gold is now a fill/border color only — never text.

## Brand

**Mission:** "Real Work. Fair Pay. For Everyone."
**Aesthetic:** Dark Gold — luxury meets labor. The app should feel
premium without feeling exclusive. Every visual choice reinforces that
real people do real work here and are treated with dignity.

---

## Color Palette

| Token | Hex | Usage | When to use |
|---|---|---|---|
| `background` | `#A6A6A6` | All screens | Neutral mid-grey (R=G=B). The only background color. |
| `card` | `#B6B6B6` | All cards and surfaces | Every card, every panel, every elevated surface |
| `border` | `#808080` | Card borders, dividers | Cards have 1px border in this color — it carries the card/background separation |
| `gold` | `#F5E663` | Fills, borders, accents | Primary buttons, active tab, selected-state borders. **Never text** (1.9:1 on background) |
| `amber` | `#F2A93B` | In-progress fills | Amber buttons/badges with `ink` text. Never text |
| `amberText` | `#513305` | In-progress text + dots | "IN PROGRESS" / "AWAITING" / "BOOKED" labels and status dots |
| `textPrimary` | `#111111` | Headings, body, former gold accents | 7.8:1 on background, 9.3:1 on card |
| `textSecondary` | `#383838` | Supporting text, metadata | Timestamps, hints, placeholders. 4.8:1 / 5.8:1 |
| `textTertiary` | `#5A5A5A` | Dots, separators | Non-text only — below 4.5:1 |
| `ink` | `#111111` | Text on gold / amber / light fills | Button labels, active tab |
| `onDark` | `#FFFFFF` | Text on dark fills | Green/red/blue/purple fills, photos, black scrims |
| `green` | `#1C412D` | Success, completions | Darkened to pass 4.5:1 as text; fills carry `onDark` text |
| `blue` | `#133E5D` | Trust, verification, info | Same |
| `purple` | `#471998` | XP, growth | Same |
| `red` | `#770F0F` | Urgent, alerts, destructive | Error text, DELETE ACCOUNT (fill + `onDark` text) |
| `errorFill` | `#CCC3C3` | Error boxes | Background behind red error text, with red border |
| `cream` | `#111111` | Legacy accent | Now identical to `textPrimary` |

### Active/Selected State Pattern

When a card or option is selected:
- Border changes from `border` (#808080) to solid `gold` (#F5E663)
- Background gets a neutral raise: `whiteAlpha(0.3–0.45)` — never a gold tint
- Text stays `textPrimary` (gold is never a text color)

### Surfaces

The darkest surface is `background` (#A6A6A6), the lightest is `card` (#B6B6B6);
raised/selected fills use `whiteAlpha()`. Pure white appears only as `onDark` text.

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
Background: #B6B6B6 (card)
Border: 1px solid #808080 (border)
Border radius: 12px (Radius.md)
Padding: 16px (Spacing.md)
```

### Buttons

**Primary CTA (gold):**
```
Background: #F5E663 (gold)
Text: #111111 (ink) — dark text on gold
Border radius: 12px (Radius.md)
Height: 52-54px
Font: Bold, 15-16px, letterSpacing 1.5
```

**Outline/Secondary:**
```
Background: transparent
Border: 1.5px solid #F5E663 (gold)
Text: #111111 (textPrimary)
Border radius: 999px (Radius.full) — pill shape
```

**Destructive:**
```
Background: transparent
Border: 1.5px solid #770F0F (red)
Text: #770F0F (red)
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
amberText #513305 (in-progress/awaiting), red (declined/disputed),
grey (expired/withdrawn).

### Form Inputs

```
Background: #B6B6B6 (card)
Border: 1px solid #808080 (border)
Border radius: 12px (Radius.md)
Text color: #111111 (textPrimary)
Placeholder color: #383838 (textSecondary)
Height: 52px (single line)
Padding: 16px horizontal
```

### Overflow Menu ("⋯" button)

Used on worker cards, job detail, chat for Report/Block actions:
```
Position: absolute, top-right of parent
Size: 44x44px (Apple HIG minimum)
Icon: "⋯" character, 18px, #383838 (textSecondary)
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
1. `SafeAreaView` with `backgroundColor: #A6A6A6`
2. Header (either system-provided Dark Gold header or custom)
3. Content area (ScrollView or FlatList)
4. Optional: fixed bottom element (composer, CTA bar)

### Dark Gold Header (most screens)

```
Background: #A6A6A6 (background)
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
- **Error states:** Red text (#770F0F) centered above the action button.
  Error banners use red border + a red tint background (`redAlpha(0.12)`).

---

## Platform

- **Framework:** React Native + Expo SDK 54
- **Navigation:** Expo Router (file-based, tab bar hidden)
- **State:** React hooks only (useState, useCallback, useEffect, useFocusEffect)
- **Backend:** Supabase (Postgres + Auth + Edge Functions)
- **Payments:** Stripe Connect (Express accounts for workers, PaymentSheet for customers)
- **Target:** iOS first, Android planned
