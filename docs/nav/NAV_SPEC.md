# XProHub — Navigation IA (NAV_SPEC)

**Status:** Binding build spec. Resolves `docs/NAVIGATION_IA_PROPOSAL_2026-05-28.md` (LOCKED) into pixels.
**Visual reference:** `nav/nav_visual_spec.html` (annotated mockup — the source of truth for layout).
**Date:** 2026-05-31 · **For:** Claude Code · **Author:** Claude Design
**Owner notes:** Print Shop / PR 3 (`my-card.tsx`) is shipped. The nav work lands next. Final tab icons are Paata's, swapped over placeholders later — **no build dependency on icon craft.**

> Read this with the HTML open. Where prose and mockup disagree, the mockup wins; flag it back to Design rather than guessing.

---

## 0. Tokens (no new ones)

Everything below uses existing tokens from `colors_and_type.css` / `constants/theme.ts`. **Do not introduce new colors, radii, or fonts.**

| Use | Token |
|---|---|
| Ground | `--bg #0E0E0F` |
| Card / elevated | `--card #171719` |
| Border / hairline | `--border #2E2E33` |
| Accent (active, big numbers, FAB) | `--gold #C9A84C` |
| Selected row fill | `--gold-tint-10 rgba(201,168,76,0.094)` |
| Worker / taken / credit | `--green #4CAF7A` |
| Posted / awaiting | `--amber #E5901A` |
| Config (Account money line) | `--blue #4A9EDB` |
| Heading / number font | Space Grotesk (`--font-heading`) |
| Body | Inter (`--font-body`) |
| **Ledger voice** (dates, amounts, status) | IBM Plex Mono (`--f-mono`) |
| Eyebrows / tab labels case | Oswald eyebrows; tab labels Space Grotesk caps |

Elevation rule holds: **no drop shadows.** Elevation = gold border + soft outer glow (`--glow-gold` / `--glow-gold-soft`).

---

## 1. The tab bar (Deliverable 1)

Four **peer** tabs. Replaces any prior bottom-nav assumption. Nesting Desk under Account is explicitly rejected.

Layout:
- Container: position pinned bottom, height 84pt, --bg ground, 1px --border top hairline, no shadow. Respect bottom safe-area inset (content sits in the top ~60pt; safe-area pads below).
- 4 equal columns (flex: 1 each). Each tab: glyph block (18pt) + label (Space Grotesk 600, 9px, letter-spacing 1.5px, uppercase), 5pt gap, center-aligned.

States — color swap only:
- Active: glyph + label both --gold.
- Inactive: glyph + label both --fg-secondary #888890.
- No selection fill, no pill, no top indicator bar, no scale/weight change. The gold-tint-10 fill stays reserved for selected list rows, never chrome. activeOpacity only on press; disabled never applies here.

Icons (placeholders, swap-ready):
- Ship with Unicode glyphs as 18pt stand-ins: Home, Market, Desk, Account.
- Paata supplies the final set later. When it lands it must match the Welcome Lock/Star/Bolt language: gold 1.6px stroke, 24x24, single geometry, no fill, no shading. No icon-library imports (no Lucide / Ionicons / Heroicons).
- Wire icons as a swappable map so replacement is a one-file change.

No badge counts on the bar at v1. The "what needs you" signal is carried by Home's summary card, not a tab pip. (Revisit only if usage demands.)

Routes:
```
app/(tabs)/_layout.tsx   -> 4 screens
  index      -> Home
  market     -> Market     [existing]
  desk       -> Desk       [new — section 3]
  account    -> Account
my-card.tsx  -> routable, NOT tab-registered  (reached from YOUR PASS card -> section 4)
```

---

## 2. The global compose + (Deliverable 3)

Posting a job is an action, not a place. There is no Post tab.

Affordance:
- A single gold pill FAB, 52pt, glyph + (Space Grotesk 700, ~28px, optically centered).
- Fill --gold, label color --bg. Elevation = --glow-gold (gold border + soft outer glow). No drop shadow.
- Position: bottom-right, 18pt from the right edge, clear above the 84pt tab bar (approx 100pt from screen bottom). Identical placement on Home and Market — muscle memory must transfer.

Presence:
- Visible on Home and Market only. Not on Desk (Desk is the output) and not on Account.

Behavior:
1. Tap raises the Post a Job composer sheet (existing post flow / post.tsx content, presented as the compose target).
2. On publish, the job appears in Desk -> ACTIVE as a posted-by-you, awaiting bids row (amber tag). See section 3.
3. Market is not reduced to browse-only — it keeps browse + its own entry to post. The + is an additional, faster path, preventing a "browse here, post there" split.

---

## 3. The Desk tab — first screen (Deliverable 2)

Desk = my workspace: where work happens and where the books are kept. This is the only tab whose voice is the ledger (IBM Plex Mono for all dates, amounts, statuses). Order is fixed top to bottom:

```
TOP BAR        XPROHUB wmark / mode badge (EARNING) / gear
MASTHEAD       eyebrow "DESK . YOUR WORKSPACE" (Oswald, gold)
               title "Your desk." (Playfair 30px)
               edition line (mono): "FRI 31 MAY 2026 . 2 ACTIVE . LEDGER OPEN"
---
1 . ACTIVE . BOTH ROLES   <- highest priority, always first
2 . EARNINGS . THIS WEEK  <- gold big-number hero
3 . JOB HISTORY           <- mono ledger, each row -> Receipt
4 . PAYOUT HISTORY        <- mono ledger, Stripe deposits
[tab bar — DESK active]   (no FAB)
```

### 3.1 Active - both roles
A single stack mixing the user's two sides. Each row is a --card / --border / radius-12 card, 12-14pt padding, 8pt gap.

- Row top: role tag, Oswald 700, 8.5px, 2px tracking:
  - TAKEN . IN PROGRESS -> --green (worker side, job taken by you)
  - POSTED . AWAITING BIDS -> --amber (hiring side, posted by you)
- Title: Inter 600, 14px, --fg.
- Foot row (baseline space-between): left = mono meta (TONIGHT 6:00 PM . 4 HR / 3 BIDS . POSTED 2 HR AGO), right = price in Space Grotesk 600 tabular --gold.
- Status accents carry role, never decoration.

### 3.2 Earnings - this week
The loudest element on the screen (locked "big numbers in gold" rule).
- Card; left = this-week total, Space Grotesk 600, 38px, tabular, --gold.
- Right (right-aligned): label 4 JOBS . MON-SUN (Oswald 9px --fg2); delta + $128 vs last week (mono 10px --green).

### 3.3 Job history
Mono-dated ledger rows. Grid: [date 58pt] [desc 1fr] [value auto], 11pt vertical padding, 1px --border divider (none on last).
- Date: mono 9.5px --fg2 (28 MAY).
- Desc: Inter 13px --paper; below it a RECEIPT link (Oswald 600, 8.5px, gold) -> opens the full Receipt screen for that job. History is how receipts are reached; do not duplicate the Receipt surface inside Desk.
- Value: Space Grotesk 600, 13.5px, tabular, --gold, right-aligned.

### 3.4 Payout history
Same ledger grid. Records only — not configuration.
- Date (mono) / Desc Stripe -> masked destination / Value +$412.00 in --green with a mono LANDED status beneath.
- This is the records half of the money line. Payout destination lives in Account (see section 5, Boundary 1).

### 3.5 No FAB on Desk
Desk is the destination of compose, not an entry point. Omit the + here.

---

## 4. The "YOUR PASS" card (Deliverable 4)

A rename only of the approved Home "YOUR DESK card." Resolves the word collision with the new Desk tab.

- Eyebrow: YOUR PASS (Oswald, gold). (Was YOUR DESK.)
- Routing unchanged: still previews the live WorkerCard preview and taps through to My ID Card (my-card.tsx). EDIT MY CARD is the explicit affordance in the foot.
- Visibility: worker-role users only.

Anatomy (radius-12 card, --card, --border, overflow hidden):
1. Gold credential stripe — gradient, ~6pt padding. Left XPROHUB . WORKER PASS (Oswald 700, 9px, 3px tracking, ink #1A0F00); right No. 00-2841 (mono 600, 9px, ink).
2. Body (flex, 13pt gap): passport portrait 54x66, 1.5px gold border, radius 6, Playfair-italic initials fallback; then info — name (Playfair 700, 18px, --fg) and track line.
3. Track line (Ruling 01): [N] endorsed . [city] . $[min]-[max]/hr — no star, no jobs count. Mono 9.5px --fg2, count in gold.
4. Foot (1px top border): left status LIVE TO MARKET (mono 9px, --green dot+text — mirrors publish state from My ID Card); right EDIT MY CARD (Oswald 600, 9px, gold).

---

## 5. Boundaries (draw on purpose)

Boundary 1 — money / config line.
- Payout history (what you earned, when it landed) -> Desk (section 3.4).
- Payout destination (which bank/card receives money — Stripe Connect) -> Account.
- If this lands by accident the two tabs overlap. Enforce it in IA and copy.

Boundary 2 — active jobs.
- Desk owns the full active-jobs list + history.
- Home glances: a single summary card ("2 active . $642 this week" -> OPEN DESK) that taps into Desk. Home never renders the full list. Standard dashboard -> detail.

---

## 6. Out of scope / deferred

- Final tab icons — Paata, swapped over placeholders later. No build dependency.
- Account tab interior — only its existence + the payout-destination boundary are specified here.
- Tab badge counts — none at v1.
- Build sequence — the nav work and my-card.tsx touch adjacent surfaces (YOUR PASS -> My ID Card). PR 3 is shipped, so nav can land next; final ordering is Maestro's call.

---

## 7. Build checklist

- [ ] _layout.tsx registers exactly four tabs: Home / Market / Desk / Account (peer, not nested).
- [ ] Tab active state is color swap only (gold) — no fill, pill, or indicator bar.
- [ ] Tab icons wired as a swappable map; placeholder glyphs in place; no icon-library import.
- [ ] Global + FAB on Home + Market only, bottom-right, gold pill, gold-glow elevation (no shadow).
- [ ] + opens Post a Job; published job lands in Desk ACTIVE as posted/awaiting (amber).
- [ ] Desk first screen renders in order: Active (both roles) -> Earnings -> Job History -> Payout History.
- [ ] All Desk dates/amounts/statuses in IBM Plex Mono; this-week earnings is the loudest gold mass.
- [ ] Job-history rows expose RECEIPT -> existing Receipt screen.
- [ ] Payout-history values in green with LANDED status; destination masked; no destination config on this screen.
- [ ] Home "YOUR DESK card" renamed to YOUR PASS; still routes to my-card.tsx; track line [N] endorsed / [city] / $[min]-[max]/hr (no star).
- [ ] No new tokens introduced; no drop shadows anywhere.
