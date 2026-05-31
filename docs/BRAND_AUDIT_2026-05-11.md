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

---

## D. Brand Rulings (appended 2026-05-27, PR 2)

### D.1 Playfair Italic — Brand Invariant

Worker names render in `PlayfairDisplay_700Bold_Italic` wherever they appear:
Receipt screen (locked editorial moment), WorkerCard credential nameplate,
and any future worker-facing surface. This is a brand-register choice, not a
typographic preference — italic Playfair signals *reverence for the worker*.
Non-italic Playfair is reserved for taglines and editorial quotes (Welcome screen).

### D.2 Star Ratings Banned Platform-Wide

XProHub does not display star ratings on any user-facing surface. The platform
uses binary endorsements (ENDORSE THIS WORK / Raise a concern) as the trust
signal. `profiles.rating_avg` exists in the schema for internal analytics but
must never be rendered to users. Star ratings create hierarchies that conflict
with the platform's dignity-first design principle.

### D.3 Per-Card Menus — Safety Actions Only, Styled to Recede

Per-card overflow menus (Report User, Block User) are required for App Store
compliance (Chunk G-4/G-5). They are NOT a general-purpose feature surface.

**Current state (PR 2):** The `···` trigger lives inline in the WorkerCard's
gold credential stripe, styled as meta text (`#1A0F00` at 0.55 opacity) rather
than as a button. This is a deliberate visual choice — the safety action
recedes into the credential register and does not compete with the card's
primary content hierarchy.

**Migration path (post-Milestone 5):** When a standalone worker detail view
ships, migrate Report/Block actions to that view's overflow menu. At that point,
remove the per-card `···` entirely — the card becomes a pure display surface
and the detail view owns all actions. Until then, the per-card menu stays.

### D.4 The NEW stamp — shared word, split treatment

**Decision:** The word "NEW" is shared by JobCard and WorkerCard.
The treatment is not. Solid gold fill that overhangs the card edge
is reserved for JobCard (urgency / ephemeral). The WorkerCard "NEW"
is a hollow gold outline tucked inside the frame (provenance / standing).

**Source:** Stamp Differentiation ruling, 2026-05-29. Cross-refs:
- JobCard stamp spec — `pr2_build_spec.md` "Corner stamp"
- WorkerCard stamp origin — `pr2_rulings.md` Ruling 01

**Threshold drift (why this differentiation exists):** Ruling 01's
worker-stamp threshold shifted from `endorsement_count === 0` (momentary)
to `jobs_completed < 10` (tenure band) during implementation. The shift
made shared-treatment over-promise, which this ruling resolves.

**Rule:**
- **Word:** "NEW" on both. Never fork the lexicon (no FRESH / NEW HERE / ROOKIE).
- **JobCard:** solid `--gold` fill, `--ink` text, `top: -1px` (overhangs),
  radius `0 0 4 4`. Oswald 700, 8.5px, ls 2px. *(unchanged)*
- **WorkerCard:** transparent fill, 1.5px `--gold` stroke, `--gold` text,
  `top: 14px` (tucked inside), radius 3. Same Oswald 700 / 8.5px / ls 2px.
- **Grammar basis:** solid gold = primary/urgent (CTA family);
  outline gold = quiet credential (HIRE pill + avatar-ring family).
- Disambiguation lives in `accessibilityLabel`, not visible copy.
  No red, no desaturation, no warning caption on the worker variant —
  early tenure is welcomed, not flagged (dignity rule).

**Why this matters:** Solid urgency-gold on an unproven worker
reads as "featured/premium" and over-promises — the customer taps in
to 0–9 jobs and the credential under-delivers. Outline + tuck keeps the
shared "newly arrived" meaning while removing the false desirability claim.

### D.5 The Print Shop — Edit Affordances (All Four Zones)

**Decision:** The worker's credential on `my-card.tsx` is editable
across four lifetime zones — **photo, bio, roster, superpowers** —
each speaking the same four-word grammar. Daily dials (status,
today_skills, rate, radius) remain inline with the atomic publish
bar. Lifetime fields commit independently with their own UNDO and
never touch `worker_status`.

**Source:** Print Shop spec Rev 01 (2026-05-30), shipped across
Slices 1-4. Cross-refs:
- `PRINT_SHOP_SPEC.md` — binding spec
- `docs/print-shop/copy.md` — authoritative `myCard.*` strings

**The four-word grammar:**

| Word | Form | Used on |
|---|---|---|
| **HANDLE** | Solid `--gold` pill, `--ink` text, state-aware `ADD`/`EDIT` | Photo, bio |
| **DOOR** | Gold outline `MANAGE` pill in a section row | Roster + superpowers |
| **STATE** | Solid gold = featured, outline gold = roster | Skill chips in the proof sheet |
| **COMMIT** | Press + brief UNDO; soft confirm only for destructive remove | All lifetime edits |

**Zone rules:**

- **Photo (Zone 1):** `onPhotoPress` prop on WorkerCard. Corner badge
  `ADD`/`EDIT` by `avatar_url` state. Routes to `/(onboarding)/id?step=photo`
  (photo-only wizard mode — writes only `profiles.avatar_url`, never
  touches `worker_skills`). Public card unchanged.
- **Bio (Zone 2):** `onBioPress` prop on WorkerCard. Corner-tucked
  badge at bottom-right of bio block (Rev 01: never participates in
  text layout). Opens proof sheet with live mini-proof, 90-char clamp,
  amber warn at 75, explicit SAVE LINE / CANCEL. Writes only
  `profiles.bio`.
- **Roster (Zone 3):** MANAGE row opens Roster & Superpowers proof
  sheet. Add skill: category -> task -> confirm mini-flow, ONE INSERT
  to `worker_skills`. Remove skill: EDIT mode + native `Alert.alert`
  confirm (iOS), ONE DELETE from `worker_skills`. Each action is
  single-row; never read-modify-rewrite.
- **Superpowers (Zone 4):** Tap roster chip to feature (promote), tap
  featured chip to unfeature (demote). ONE UPDATE to
  `worker_skills.is_featured` per tap. Cap 3 with visual disable +
  amber cap line. Drag-reorder deferred to v1.1; featured order =
  insertion order.

**Data-safety contract (non-negotiable):**
- Add = ONE INSERT. Remove = ONE DELETE. Feature/unfeature = ONE UPDATE.
- Never batch upsert, never read-modify-rewrite `worker_skills`.
- Lifetime edits never touch `worker_status`, `today_skills`,
  `today_rate_*`, `today_radius_mi`, or `avatar_url` (except Zone 1).
- The daily today_skills picker's set-rewrite model stays out of the
  lifetime path (structural boundary per Rev 01).

**Deferred items (v1.1):**
- Drag-reorder for superpowers (PanResponder cost; <=3 items makes
  ordering a weak launch need)
- Custom destructive dialog for remove (currently native Alert.alert;
  custom Modal caused iOS responder chain issues — revisit with
  non-Modal approach)

**Why this matters:** The print-shop principle says the card is the
worker's to compose. Before the Print Shop arc, workers could only
set up their credential through onboarding gates — no proactive edit
surface existed. The four-zone system gives workers direct authorship
of their commercial presentation while maintaining brand consistency
(content-only customization, never visual treatment).
