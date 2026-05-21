# XProHub — Design System Reference

> For Claude Design, design tools, and new contributors.
> Source of truth: `constants/theme.ts`. This document explains the
> intent behind the tokens, not just the values.

## Brand

**Mission:** "Real Work. Fair Pay. For Everyone."
**Aesthetic:** Dark Gold — luxury meets labor. The app should feel
premium without feeling exclusive. Every visual choice reinforces that
real people do real work here and are treated with dignity.

---

## Color Palette

| Token | Hex | Usage | When to use |
|---|---|---|---|
| `background` | `#0E0E0F` | All screens | The only background color. Never white, never grey. |
| `gold` | `#C9A84C` | CTAs, highlights, accents, borders | Primary action buttons, active states, gold border glow on selected cards, big numbers, eyebrow text |
| `card` | `#171719` | All cards and surfaces | Every card, every panel, every elevated surface |
| `border` | `#2E2E33` | Card borders, dividers | Subtle separation. Cards have 1px border in this color. |
| `textPrimary` | `#FFFFFF` | Headings and body text | All readable text on dark backgrounds |
| `textSecondary` | `#888890` | Supporting text, metadata | Timestamps, hints, secondary labels, placeholder text |
| `green` | `#4CAF7A` | Success, completions | "CARD ADDED" badge, "ACCEPTED" status, "CONFIRM COMPLETION" button, Worker mode accents |
| `blue` | `#4A9EDB` | Trust, verification, info | Verification badges, informational states |
| `purple` | `#9B6EE8` | XP, growth | XP counters, belt progression, Royal theme accent |
| `red` | `#E05252` | Urgent, alerts, cancel, destructive | Error messages, "RAISE CONCERN" button, "DELETE ACCOUNT", "DECLINED" status, cancel actions |

### Active/Selected State Pattern

When a card or option is selected:
- Border color changes from `border` (#2E2E33) to `gold` (#C9A84C)
- Background gains a 10% gold tint: `gold + '18'` → rgba(201, 168, 76, 0.094)
- Text inside turns gold

### No Pure White Rule

Never use `#FFFFFF` as a background. The darkest element is `background`
(#0E0E0F), the lightest surface is `card` (#171719). White is reserved
for `textPrimary` only.

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
Background: #171719 (card)
Border: 1px solid #2E2E33 (border)
Border radius: 12px (Radius.md)
Padding: 16px (Spacing.md)
```

### Buttons

**Primary CTA (gold):**
```
Background: #C9A84C (gold)
Text: #0E0E0F (background) — dark text on gold
Border radius: 12px (Radius.md)
Height: 52-54px
Font: Bold, 15-16px, letterSpacing 1.5
```

**Outline/Secondary:**
```
Background: transparent
Border: 1.5px solid #C9A84C (gold)
Text: #C9A84C (gold)
Border radius: 999px (Radius.full) — pill shape
```

**Destructive:**
```
Background: transparent
Border: 1.5px solid #E05252 (red)
Text: #E05252 (red)
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
amber #E5901A (in-progress/awaiting), red (declined/disputed),
grey (expired/withdrawn).

### Form Inputs

```
Background: #171719 (card)
Border: 1px solid #2E2E33 (border)
Border radius: 12px (Radius.md)
Text color: #FFFFFF (textPrimary)
Placeholder color: #888890 (textSecondary)
Height: 52px (single line)
Padding: 16px horizontal
```

### Overflow Menu ("⋯" button)

Used on worker cards, job detail, chat for Report/Block actions:
```
Position: absolute, top-right of parent
Size: 44x44px (Apple HIG minimum)
Icon: "⋯" character, 18px, #888890 (textSecondary)
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
1. `SafeAreaView` with `backgroundColor: #0E0E0F`
2. Header (either system-provided Dark Gold header or custom)
3. Content area (ScrollView or FlatList)
4. Optional: fixed bottom element (composer, CTA bar)

### Dark Gold Header (most screens)

```
Background: #0E0E0F (background)
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
- **Error states:** Red text (#E05252) centered above the action button.
  Error banners use red border + dark red background (#2A1515).

---

## Platform

- **Framework:** React Native + Expo SDK 54
- **Navigation:** Expo Router (file-based, tab bar hidden)
- **State:** React hooks only (useState, useCallback, useEffect, useFocusEffect)
- **Backend:** Supabase (Postgres + Auth + Edge Functions)
- **Payments:** Stripe Connect (Express accounts for workers, PaymentSheet for customers)
- **Target:** iOS first, Android planned
