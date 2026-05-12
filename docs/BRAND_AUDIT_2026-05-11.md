# Brand Audit — Visual System Snapshot

**Date:** 2026-05-11 (end of Task 5)
**Status:** Baseline reference for future visual design work
**Related:** Locked Decision (parked) — visual design direction revisited closer to launch (see HANDOFF.md line 81)

> This audit captures what XProHub looks like today: design tokens, screen-by-screen brand surface, voice signals, and aspirational labels not yet implemented. It is a baseline for future exploration, not a commitment to the current direction.

---

## Section A — Top Screens by Brand Surface

### 1. Welcome — `app/(onboarding)/welcome.tsx`
**Why high-value:** First thing every new user sees. Only screen with editorial typography (Playfair Display, Oswald), custom SVG icons, and the yin-yang dual-role metaphor. Maximum brand surface area.

**Current state:** Fully built, ~500 lines. Masthead with newspaper-style "THE / XProHub" nameplate, gold ticker bar, animated yin-yang boxes ("HELP WANTED?" / "HAVE SKILLS?"), trust strip with lock/star/bolt icons, "BUILT FOR TRUST" banner, "GET STARTED" CTA.

**Elements:** Masthead, ticker, tagline, hero animation (two tappable boxes + yin-yang), trust icons row, budget/rate boxes, primary CTA, sign-in link.

### 2. Home — `app/(tabs)/index.tsx` (Category Grid)
**Why high-value:** Primary hub screen, returned to constantly. 20-category grid is the core navigation spine. Two top CTA buttons ("HELP WANTED" / "START EARNING") anchor the dual-role concept.

**Current state:** Built and wired to Supabase. 2-column grid of category cards with emoji icons, tier badges (EVERYDAY gold-filled / PRO gold-outlined), price ranges, difficulty labels.

**Elements:** App title, two CTA buttons, 20 category cards (emoji, name, price range, difficulty, tier badge), sign-out button.

### 3. Live Market — `app/(tabs)/market.tsx`
**Why high-value:** Highest daily-use screen. Two-feed toggle, filtering, card-based content. Most complex visual surface.

**Current state:** Built, 837 lines. Jobs Feed + Workers Feed toggle, category filter strip with gold accent bar, FlatList of cards, empty states with 88px icon rings.

**Elements:** Feed toggle, filter strip, job cards (title, category, budget, timing, status), worker cards (name, avatar, skills, belt), empty states, FAB ("+ Post a Job").

### 4. Stripe Connect — `app/(tabs)/stripe-connect.tsx`
**Why high-value:** Best example of state-driven screen with polish. Four visual states, progress dots, status badges, contextual CTAs. Represents the "trust" brand pillar.

**Current state:** Built, 365 lines. Card-based layout with progress dots (3-dot, filled/outlined/green), eyebrow + heading + body per state, gold glow on State 1, green accents on States 3–4, contextual CTA buttons.

**Elements:** Progress dots, state card (eyebrow, heading, body, badge), primary/outline CTAs, error states, loading states.

### 5. Apply — `app/(tabs)/apply.tsx`
**Why high-value:** Core worker action flow. Gate cards → form → submit. Shows both the gate UX pattern and the bid submission form. Smart templates demonstrate voice.

**Current state:** Built, ~450 lines. Two gate cards (ID gate, Stripe gate) with glyph + heading + body + CTA pattern. Form with job context header, three message template buttons, custom text input, proposed price, budget warning.

**Elements:** Gate cards (glyph, heading, body, CTA, secondary link), job header, message mode selector, text input, price input, budget hint/warning, submit button.

---

## Section B — Current Visual System

### Color Palette
**Source of truth:** `constants/theme.ts:5-16`

| Token | Hex | Use |
|---|---|---|
| background | #0E0E0F | All screens |
| gold | #C9A84C | CTAs, highlights, borders |
| card | #171719 | Cards, surfaces |
| border | #2E2E33 | Dividers |
| textPrimary | #FFFFFF | Headings, body |
| textSecondary | #888890 | Metadata |
| green | #4CAF7A | Success, verified |
| blue | #4A9EDB | Trust, info |
| purple | #9B6EE8 | XP, growth |
| red | #E05252 | Urgent, errors |

**Welcome-only extras:** `#F5EEDC` (paper cream), `#E8DCC0` (warm cream), `#1A0F00` (ink brown) — welcome.tsx:25-29

**Consistency:** All production screens import from Colors — zero hardcoded hex deviations found outside welcome.tsx.

### Typography
**Source of truth:** `constants/theme.ts:18-21`

- **Heading:** SpaceGrotesk_700Bold — all screen headings
- **Body:** Inter — all body text
- **Serif accent:** PlayfairDisplay_700Bold + PlayfairDisplay_700Bold_Italic — welcome.tsx only
- **Editorial:** Oswald_600SemiBold + Oswald_700Bold — welcome.tsx kickers/ticker only

**Common sizes across screens:**
- Title: 28–34px, bold, gold, letterSpacing 2–4
- Eyebrow: 11px, weight 700, letterSpacing 3, gold
- Body: 14–15px, textSecondary, lineHeight 20–22
- Button text: 13–16px, weight 800, letterSpacing 1.5

### Spacing & Layout
**Source of truth:** `constants/theme.ts:23-37`

- Spacing: xs=4, sm=8, md=16, lg=24, xl=32, xxl=48
- Radius: sm=8, md=12, lg=16, full=999
- Card pattern: borderRadius: 12, padding: 16, borderWidth: 1
- Button heights: 52–54px (primary), pill buttons use borderRadius: 999
- Consistent gap: 12 in flex layouts

### Iconography
No icon library in use. Custom SVG via `react-native-svg` in `welcome.tsx` only (YinYang, DollarSign, LockIcon, StarIcon, BoltIcon). Category display uses emoji strings via iconForSlug() maps in index.tsx:22-46 and post.tsx:40-64.

CLAUDE.md specifies "Gold Forge custom duotone system" as design direction but only welcome.tsx implements it currently.

### Component Patterns (ad-hoc, not extracted)
- **Primary button:** gold bg, dark text, Radius.md, paddingVertical: 16
- **Outline button:** transparent bg, gold 1.5px border, Radius.full, gold text
- **Card:** card bg, 1px border, Radius.md, Spacing.lg padding
- **Card glow variant:** gold border + Colors.gold + '1A' bg — stripe-connect.tsx:320
- **Gate card:** centered layout, glyph emoji (28–40px), heading, body, CTA + "GO BACK"
- **Progress dots:** 10×10, borderRadius: 5, borderWidth: 1.5, state-dependent fill
- **Status badge:** pill shape, 1.5px border, gold/green by state

---

## Section C — Brand Voice Signals

### 1. Newspaper/Editorial Register
The welcome screen channels a broadsheet newspaper: "THE / XProHub" nameplate, "All The Work That's Fit To Post" (Playfair italic), ticker bar with ◆ REAL WORK · FAIR PAY · FOR EVERYONE ◆. This is aspirational-editorial, not tech-startup.

### 2. Direct, Imperative CTAs
All caps, short, verb-first: GET STARTED, GET VERIFIED, SET UP PROFILE, SET UP PAYOUTS, SUBMIT APPLICATION, CONTINUE SETUP, POST A JOB. No soft language ("maybe try..." / "you might want to..."). The app tells you what to do next.

### 3. Worker Dignity / Respectful Gates
Gate copy treats barriers as enablement, not obstruction: *"To apply for jobs, add a photo and claim at least one skill. It takes about a minute — and customers are more likely to hire workers with a complete profile."* (apply.tsx:296-298). *"Connect your bank account and you're ready to earn on any job on XProHub. Takes about 2 minutes."* (stripe-connect.tsx:36).

### 4. Dual-Role Framing
The yin-yang boxes on welcome ("HELP WANTED?" / "HAVE SKILLS?"), the two top buttons on Home ("HELP WANTED" / "START EARNING"), and the mission ticker all reinforce: you're both sides. No role fork.

### 5. Confident Completion States
"YOU'RE ALL SET" (stripe-connect State 4), "APPLICATION SENT" (apply-success), "VERIFIED" badge. Short, declarative, celebratory without being twee.

---

## Section D — Aspirational Labels (Not Yet Implemented)

### "Gold Forge custom duotone system"
Named in CLAUDE.md as design direction. Only `welcome.tsx` implements it. The rest of the app uses the Dark Gold token system but not the duotone aesthetic.

### Five Feed Card Themes
CLAUDE.md line 90 mentions: **Broadsheet, Western, Gold Press, Dispatch, Chronicle**. These are named directions but none are implemented in code — zero references found in any .tsx file. They exist only as aspirational labels with no mockup files or design exploration documents in the repo.

These are opportunities for future visual exploration.

---

## Section E — Constraints for Design Work

### React Native, Not Web
The app is React Native + Expo Router. Visual design should be mobile-first at iPhone dimensions (~390×844pt). No desktop layouts, no hover states, no CSS grid. ScrollView + FlatList are the layout primitives.

### iPhone-First
Paata tests exclusively on iPhone. Safe area insets matter (notch, home indicator). All screens use SafeAreaView from `react-native-safe-area-context`.

### Fonts Loaded
Only SpaceGrotesk, Inter, Oswald, and Playfair Display are currently loaded. Other typefaces would require adding font packages — feasible but worth noting.

### Visual Direction Is Parked, Not Locked
HANDOFF.md line 81: "Visual design direction: explored Hall/Ledger/Ticket aesthetics in earlier sessions, currently using default styling. Not a formally locked decision — revisit closer to launch. Design tokens enable multi-theme switching later."

Exploration is welcome. The current Dark Gold + editorial direction is a starting point, not a constraint.

---

## How to Use This Document

**For visual exploration sessions:** This audit is the factual input for design prompts. Reference specific screens, tokens, and voice signals when framing what to explore.

**For future visual direction commitment:** When Paata moves from "exploring" to "deciding," this snapshot is the diff point — what we had before the decision was made.

**For new chat-Claude or Claude Code sessions doing visual work:** Read this first. It captures what's true now without making commitments.
