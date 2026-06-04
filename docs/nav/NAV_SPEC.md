# XProHub — Navigation IA (NAV_SPEC)

**Status:** Binding build spec. Resolves `docs/NAVIGATION_IA_PROPOSAL_2026-05-28.md` (LOCKED) into pixels.
**Reconciled with shipped code 2026-06-04.** Supersedes the pre-Doctrine compose-FAB / Payout-History / YOUR-PASS / mode-badge concepts.
**Date:** 2026-05-31 (original); reconciled 2026-06-04 · **For:** Claude Code · **Author:** Claude Design
**Owner notes:** Print Shop / PR 3 (`my-card.tsx`) is shipped. Nav restructure is shipped (Slices A + B + D). Final tab icons are Paata's, swapped over placeholders later — **no build dependency on icon craft.**

> Read this with the HTML open. Where prose and mockup disagree, the mockup wins; flag it back to Design rather than guessing.

---

## 0. Tokens (no new ones)

Everything below uses existing tokens from `colors_and_type.css` / `constants/theme.ts`. **Do not introduce new colors, radii, or fonts.**

| Use | Token |
|---|---|
| Ground | `--bg #0E0E0F` |
| Card / elevated | `--card #171719` |
| Border / hairline | `--border #2E2E33` |
| Accent (active, big numbers) | `--gold #C9A84C` |
| Selected row fill | `--gold-tint-10 rgba(201,168,76,0.094)` |
| Worker / taken / credit | `--green #4CAF7A` |
| Posted / awaiting | `--amber #E5901A` |
| Applied / waiting | `--blue #4A9EDB` |
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

No badge counts on the bar at v1. The "what needs you" signal is carried by Home's launchpad rows, not a tab pip. (Revisit only if usage demands.)

Routes:
```
app/(tabs)/_layout.tsx   -> 4 screens
  index      -> Home
  market     -> Market     [existing]
  desk       -> Desk       [section 3]
  account    -> Account
my-card.tsx  -> routable, NOT tab-registered  (reached from Home "Edit my card" row)
```

---

## 2. Posting a job — anchored compose (Deliverable 3)

Posting a job is an **action, not a place.** There is no Post tab. Nothing floats.

**Home:** Row 1 of the YOUR DESK launchpad card — "Post a job" with a gold "+" lead. Taps through to `post.tsx` via the explorer trust gate. No category context (Home has no category filter). This is the customer's primary initiate action on the launchpad.

**Market:** A full-width anchored `+ POST A JOB` bar in the sticky chrome, positioned between the JOBS/TALENT toggle row and the category filter strip. Solid --gold fill, --bg ink text, Space Grotesk 700 caps, letter-spacing 1.5, ~44pt tall, Radius.full. No glow, no shadow (flat anchored chrome, not a float). Present on BOTH feeds (jobs and talent). Carries the active `category_id` into the post flow when a category filter is set; no param when unfiltered. Explorer trust gate preserved.

**Desk:** No compose affordance. Desk is the destination of compose (posted jobs land in ACTIVE), not an entry point.

**Account:** No compose affordance.

Behavior:
1. Tap raises the Post a Job flow (`post.tsx`).
2. On publish, the job appears in Desk -> ACTIVE as a posted-by-you, awaiting bids row (amber tag).
3. Market is not reduced to browse-only — it keeps browse + its own entry to post. The anchored bar is the faster path, preventing a "browse here, post there" split.

---

## 3. The Desk tab — first screen (Deliverable 2)

Desk = my workspace: where work happens and where the books are kept. This is the only tab whose voice is the ledger (IBM Plex Mono for all dates, amounts, statuses). Order is fixed top to bottom:

```
TOP BAR        XPROHUB wmark / gear
MASTHEAD       eyebrow "DESK . YOUR WORKSPACE" (Oswald, gold)
               title "Your desk." (Playfair 30px)
               edition line (mono): "FRI 31 MAY 2026 . 2 ACTIVE . LEDGER OPEN"
---
1 . ACTIVE . BOTH ROLES   <- highest priority, always first
2 . EARNINGS . THIS WEEK  <- gold big-number hero
3 . JOB HISTORY           <- mono ledger, each row -> Receipt
[tab bar — DESK active]   (no compose affordance)
```

### 3.1 Active - both roles
A single stack mixing the user's two sides (plus pending applications). Each row is a --card / --border / radius-12 card, 12-14pt padding, 8pt gap. All cards are tappable to their dedicated screens.

Three role states:
- `TAKEN . IN PROGRESS` -> --green (worker side, job taken by you) -> taps to job-chat
- `POSTED . AWAITING BIDS` -> --amber (hiring side, posted by you) -> taps to job-bids
- `APPLIED . AWAITING DECISION` -> --blue (worker side, pending application) -> taps to job-detail

Row layout:
- Top: role tag (Oswald 700, 8.5px, 2px tracking, colored per state).
- Title: Inter 600, 14px, --fg.
- Foot row (baseline space-between): left = mono meta (timing for taken, bid count + post age for posted, application age for applied), right = price in Space Grotesk 600 tabular --gold.
- Status accents carry role, never decoration.

Active count feeds the masthead edition line (e.g. "2 ACTIVE"). If zero active, the "{N} ACTIVE" clause drops from the edition line.

### 3.2 Earnings - this week
The loudest element on the screen (locked "big numbers in gold" rule).
- Card; left = this-week total, Space Grotesk 600, 38px, tabular, --gold.
- Right (right-aligned): label {N} JOBS . MON-SUN (Oswald 9px --fg2).
- Zero state: "$0.00" + "0 JOBS . MON-SUN" renders cleanly.

### 3.3 Job history
Both roles — earned (worker side) and spent (customer side). Mono-dated ledger rows. Grid: [date 58pt] [desc 1fr] [value auto], 11pt vertical padding, 1px --border divider (none on last).
- Date: mono 9.5px --fg2 (28 MAY).
- Desc: Inter 13px --fg; below it a RECEIPT link (Oswald 600, 8.5px, gold) -> opens the full Receipt screen for that job. History is how receipts are reached; do not duplicate the Receipt surface inside Desk.
- Value: Space Grotesk 600, 13.5px, tabular, right-aligned. Earned = --green with "+" prefix and "EARNED" tag. Spent = --gold (neutral) with "PAID" tag. Spending is not red — it is not an error.

### 3.4 No compose on Desk
Desk is the destination of compose, not an entry point. No post affordance here.

---

## 4. Home — the launchpad (Deliverable 4)

Per `XPROHUB_DOCTRINE.md` §6: Home is a launchpad, not a dashboard. It links into the flow; it does not render full lists or earnings showcases.

**Masthead:** XPROHUB wordmark + gear icon -> Account. No weather, no greeting, no mode badge.

**YOUR DESK card** — one card with four flow-rows:

1. **Post a job** [INITIATE / customer] — gold "+" lead, sentence-case label. Routes to `post.tsx` through the explorer trust gate. No chevron (it initiates, doesn't navigate).
2. **Edit my card** [INITIATE / worker] — gold lead, chevron -> `my-card.tsx`. Publish-state signal: green dot "LIVE" when `worker_status === 'available'`, amber dot "DRAFT" otherwise.
3. **Posts awaiting my review** [IN-FLOW / customer] — amber lead, live bid count (e.g. "3 BIDS"), chevron -> `my-jobs`. The full list is owned by Desk; Home is the fast entry.
4. **Applications I'm waiting on** [IN-FLOW / worker] — green lead, live open-application count (e.g. "2 OPEN"), chevron -> `my-applications`. Owned by Desk; Home links in.

Gold marks initiate (rows 1-2); role-tint marks awaiting-decision (rows 3-4).

**Category grid** — retained below the YOUR DESK card as the post on-ramp. The taxonomy/matching substrate (per `TAXONOMY_SPEC.md`), not a browse-the-catalogue surface. Taps route to Market with `category_id`.

---

## 5. Boundaries (draw on purpose)

Boundary 1 — money / config line.
- Money is governed by `FINANCIAL_DATA_PRINCIPLE.md`: XProHub stores/shows only the transaction record (amounts, fees, payouts, dates), never bank/card/routing/balance.
- Payout **destination** (which bank/card receives money — Stripe Connect) -> Account.
- The Desk shows earnings totals and job-history amounts — transaction record only.

Boundary 2 — active jobs.
- Desk owns the full active-jobs list (all three role states) + history.
- Home links: four flow-rows with live counts that tap into the Desk-owned lists or their dedicated screens. Home never renders the full list. Standard launchpad -> detail.

---

## 6. Out of scope / deferred

- Final tab icons — Paata, swapped over placeholders later. No build dependency.
- Account tab interior — only its existence + the payout-destination boundary are specified here.
- Tab badge counts — none at v1.

---

## 7. Build checklist

- [x] _layout.tsx registers exactly four tabs: Home / Market / Desk / Account (peer, not nested).
- [x] Tab active state is color swap only (gold) — no fill, pill, or indicator bar.
- [x] Tab icons wired as a swappable map; placeholder glyphs in place; no icon-library import.
- [x] Home "Post a job" row routes to post.tsx through explorer gate; Market has anchored "+ POST A JOB" bar in sticky chrome between toggle and filter strip.
- [x] Published job lands in Desk ACTIVE as posted/awaiting (amber).
- [x] Desk first screen renders in order: Active (both roles, three states) -> Earnings -> Job History.
- [x] All Desk dates/amounts/statuses in IBM Plex Mono; this-week earnings is the loudest gold mass.
- [x] Job-history rows expose RECEIPT -> existing Receipt screen. Earned (green) vs paid (neutral) direction.
- [x] Home YOUR DESK card has four flow-rows with live counts; category grid retained as post on-ramp.
- [x] No new tokens introduced; no drop shadows anywhere.
