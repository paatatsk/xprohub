# XProHub — Session Handoff

**Last updated:** 2026-06-08 (Photo system COMPLETE — all 3 stages shipped)
**Most recent commit:** `cac3371` — feat(receipt): after-photo as a visual reminder on the receipt (photo stage 3)
**Status:** Nav restructure COMPLETE. Home restructure SHIPPED. Photo system COMPLETE (all 3 stages: listing, evidence, receipt). Pre-submission audit fixes shipped (atomic job RPC, webhook logging, string fallbacks). Compose thread CLOSED. Star review system REMOVED (Ruling 01 sealed). Child/Elder Care EXCLUDED (safety). Dead code cleaned. Dormant belt/XP schema documented. Self-view in Live Market SHIPPED (both Talent + Jobs feeds). Redundant Home gear icon + dead DEV receipt button REMOVED.

---

## How to use this doc

This is the single onboarding artifact for the next chat session. Read it first. The Maestro role (chat-Claude) reads this to reconstruct state; Code reads it to know what's shipped and what's pending; future Paata reads it to remember where things stand.

**Read first:** `docs/XPROHUB_DOCTRINE.md` — the binding north star. Four entries, one spine, the Placement Law. Every NAV_SPEC section, design ruling, and layout decision answers to it.

**Then:** `docs/TAXONOMY_SPEC.md` — subordinate to the Doctrine. Protects the category system as core infrastructure (three-level Category→Task→Skill, the matching substrate). Tier is classification-not-gate; verification columns are reserved/unenforced.

**Then:** `docs/FINANCIAL_DATA_PRINCIPLE.md` — subordinate to the Doctrine. Governs every money surface (Receipt, Desk, future financial screens). Stripe is the system of record; XProHub holds only the transaction record (amounts, fees, payouts, dates, in/out), never bank/card/routing/balance. Link to Stripe when sensitive detail is needed.

**Then:** `docs/RULING_01_ENDORSE_ONLY.md` — Ruling 01: endorse-only, no stars. Star system removed `9f5fb71`. Do not reintroduce stars without reading the record.

**Then:** `docs/SAFETY_SPEC_EXCLUDED_CATEGORIES.md` — Child/Elder Care excluded from v1 (safety). Must not be re-enabled without the verification path in the spec (identity + background check + manual vetting).

The doc has four sections:
1. **State of build threads** — what's in flight, what's queued, with commit hashes
2. **Locked architectural commitments** — decisions that must NOT drift across sessions
3. **Polish/cleanup queue** — known debt and refinements, prioritized
4. **Process learnings** — operational rules the orchestra has discovered

---

## 1. State of build threads

### Closed arc: Nav restructure — COMPLETE

Four-tab IA shipped across slices A → B → D (C resolved as compose thread closed). Spec at `docs/nav/NAV_SPEC.md`.

- **Slice A — Tab bar infrastructure** · `804bcf7` + fix `394c512` · **SHIPPED**
- **Slice C — Compose thread** · **FULLY CLOSED**
  - Home: anchored "Post a job" launchpad row (Slice B).
  - Market: anchored "+ POST A JOB" bar in sticky chrome (`e7b30ee`). Floating ComposeFAB deleted.
  - No floating compose anywhere in the app.
- **Slice B — Home as launchpad** · `90da734` · **SHIPPED**
- **Slice D — Desk first screen** · `e39fee1` · **SHIPPED**
  - Three sections: Active · Both Roles (TAKEN green + POSTED amber + APPLIED blue), Earnings · This Week (gold hero), Job History (both roles, RECEIPT links). No Payout History (FINANCIAL_DATA_PRINCIPLE). No mode badge (Doctrine §2).
- **Desk Active: APPLIED state + tappable cards** · `b328dd8` · **SHIPPED**
  - All three in-flight states tappable: POSTED→job-bids, TAKEN→job-chat, APPLIED→job-detail.
- **job-detail focus fix** · `c0d8040` · **SHIPPED**
  - useEffect→useFocusEffect so bid-check re-runs on screen reuse (stale APPLY button fix).

### Shipped this session

- **Photo system Stage 3 — after-photo on Receipt (completes the photo system)**:
  - `cac3371` — Wire the Receipt's HeroPhoto to the job's latest after-photo (job_photos, photo_type='after', most recent `created_at`). Shown as a single calm image in the existing hero treatment with the AFTER stamp. Gallery cruft removed (thumbnail strip, photo counter, upload hint). **Conceptual decision:** the Receipt photo is deliberately ONE after-photo as a memory anchor/keepsake — not a before/after pair. Evidence lives in the chat thread (Stage 2). The before/after pair was considered and rejected as too much for the lighthouse. Empty state preserved for jobs with no after-photo. **Photo system is now COMPLETE across all 3 stages.**
- **Photo system Stage 2 — worker before/after evidence (2 slices, Slice C dropped)**:
  - `fd3f2d9` — Slice A: camera affordance in the chat composer (worker only, visible during `in_progress` + `pending_confirmation`). Explicit BEFORE/AFTER type choice via inline picker. Uploads via `uploadJobPhoto` + inserts `job_photos` rows. Soft cap of 10 evidence photos per job. Non-blocking, optional — completion flow and payment RPCs untouched.
  - `dd2eb2d` — Slice B: before/after photos render as full-width evidence cards in the chat timeline, interleaved with messages by `created_at`. BEFORE label (neutral/secondary), AFTER label (green). "Added by {worker}" attribution. Both parties see them. No schema change to `messages` — photos are fetched from `job_photos` and merged client-side.
  - **Slice C (evidence summary) — DROPPED:** A compact evidence count ("📷 N before · M after / Scroll up to review") above the customer's CONFIRM/RAISE CONCERN buttons was designed and built but dropped before commit. The before/after photo cards already render in the thread right by the confirm buttons, making a separate summary redundant. The confirm banner intentionally has no evidence summary — this is a deliberate product decision.
- **Photo system Stage 1 — customer listing photos (foundation + 4 slices)**:
  - `9071c16` — Foundation: `job_photos` table (party-scoped immutable RLS, indexed on job_id + (job_id, photo_type)) + `lib/photos.ts` `uploadJobPhoto` helper. Migration `20260607000001`. **CRITICAL — manual dashboard state not in migrations:** the `job-photos` Supabase Storage bucket (Public) and its Storage INSERT policy (authenticated, bucket_id = 'job-photos') were both created manually in the dashboard. Without them, photo uploads fail with "new row violates row-level security policy." A fresh Supabase project rebuild MUST recreate both.
  - `a1acd5b` — Slice A: Post-a-Job form restructured into 3 clear visual sections (Describe Your Job / Select Tasks / Details) with dividers and section labels. Task selector replaced: wrapped chips → contained card with full-width checkbox rows. Heading enlarged (28→34px).
  - `2a5b496` — Smart-form: auto-fill title, description, and budget from selected tasks. Per-field tracking — auto-fill stops the moment the user edits that field (typed input always wins). Form resets to clean slate on leave + after successful post.
  - `ccb4a3b` — Slice B: photo picker in the Describe Your Job section. Up to 3 listing photos via expo-image-picker (4:3, quality 0.75). Photos upload to job-photos bucket after job creation via `uploadJobPhoto`, then insert `job_photos` rows (photo_type='listing'). Non-blocking — job posts regardless of photo success.
  - `343608c` — Slice C: listing photos display on job cards in the Live Market feed. First listing photo batch-fetched from `job_photos` and shown as a 140px cover banner. Cards without photos render cleanly with no placeholder. Title enlarged (16→19px), budget enlarged (22→24px). Corner stamp decoupled to overflow-visible outer wrapper.
- **Home restructure (4 slices)** — per HOME_RESTRUCTURE_SPEC, Claude Design's binding build spec:
  - `f831ba8` — Renamed YOUR DESK flow-rows: "Posts awaiting my review" → "My posts", "Applications I'm waiting on" → "My applications". Sentence case to match existing rows.
  - `b6c1eee` — Slice 1: replaced 2-up category grid with single-column compact rows (emoji + uppercase name + mono difficulty + gold tabular price + PRO on tier-2). Added end-cap footer with real category count.
  - `deb9823` — Slice 2: masthead redesign. XPROHUB wordmark + live-count chip (real open-jobs count, own posts + blocked users excluded, "JOBS OPEN NOW" label, singular/zero-state). Greeting with real `profiles.first_name` in Playfair italic gold + device-clock time bucket. Mono date line. No weather (no source).
  - `b00094b` — Slice 3: heterogeneous single-column FlatList. Masthead scrolls away; YOUR DESK is the sole sticky element (`stickyHeaderIndices={[1]}`). Opaque deskWrapper masks content scrolling underneath. Fixed array structure so sticky index is stable across auth state.
  - `401ff06` — Slice 4: YOUR DESK style refinements (12px corner radius, 12/14 inner padding, top-border row dividers, 44px tap targets). **§6 deviation:** the spec's gold pin-glow + hairline (border glow + gold shadow + gradient hairline on pin) was built, tested on device across two tuning rounds, and REMOVED at Paata's preference — the glow competed with desk row labels. The shipped pinned state uses the plain `--border`. The sticky-pin behavior itself (§1 scroll model) shipped exactly as specced; only the glow decoration was dropped. This is a deliberate product decision, not a bug or oversight.
- `d01dbae` — Self-view in Live Market. Workers see own ID Card in Talent feed (credential stripe "· YOU", HIRE→EDIT CARD → my-card) and own job posts in Jobs feed (gold "YOUR POST" eyebrow, tap → job-bids). Self-exclusion removed from both feeds; blocked-user filtering preserved. Independent self-hire guard added to direct-hire.tsx. No mode concept — self-view always-on; natural sort, no pinning. Component-only change.
- `09156bd` — Removed redundant Home gear icon (Account tab is always visible) + dead `__DEV__` "VIEW RECEIPT" button from Account (Receipt now reachable via Desk + Home last-receipt link).
- `6b72fc5` — Structured logging for `payment_intent.payment_failed` webhook (ops observability, no state change — client handles 3DS failure synchronously).
- `2d94758` — Atomic `create_job_with_tasks` SECURITY DEFINER RPC. post.tsx + direct-hire.tsx now use one RPC; taskless jobs structurally impossible. Migration `20260604000001`.
- `0903e91` — Defensive `??` fallbacks for empty-state strings in market.tsx.

### Shipped earlier (code + docs)

- `e7b30ee` — Market anchored post bar (replaces floating ComposeFAB). Compose thread fully closed.
- `3219167` — Child/Elder Care excluded from v1 (safety). Migration + is_active filter on all 5 category queries.
- `3bd5b96` — Removed 5 orphaned files (HomeBeacon, GoldenDollar, TaskCard, useJobs, useIsWorker).
- `9f5fb71` — Removed 5-star review system (Ruling 01). Deleted review.tsx, reviews table, rating_avg + trigger, dead rating fields. job-chat CTA → VIEW RECEIPT. ~500 net lines deleted.
- `b024669` — Sealed Ruling 01 decision record (RULING_01_ENDORSE_ONLY.md).
- `c6cb170` — Documented dormant belt/XP/badges schema as unused (CLAUDE.md pointer).
- `17fcbee` — Reconciled NAV_SPEC.md with shipped code.

### Shipped earlier sessions (docs — spec stack)

- `ea75f9b` — XPROHUB_DOCTRINE.md (binding north star)
- `c191c59` — TAXONOMY_SPEC.md (category system as core infrastructure)
- `d7d434e` — FINANCIAL_DATA_PRINCIPLE.md (Stripe = system of record)

**Spec stack (read-first, in order):** XPROHUB_DOCTRINE → TAXONOMY_SPEC → FINANCIAL_DATA_PRINCIPLE → RULING_01_ENDORSE_ONLY → SAFETY_SPEC_EXCLUDED_CATEGORIES.

### Closed arc: review.tsx cleanup → DONE

Star review system fully removed at `9f5fb71`. Migration `20260603000001` applied. Ruling 01 sealed at `b024669`. Endorse/concern on Receipt is the single feedback path. No star screen, table, trigger, or field remains in code or DB.

### Closed arc: Print Shop

All four slices shipped and verified. Locked invariants enforced.

- Slice 1 (photo) — `a4547bf` + fixes through `ef8e232`
- Slice 2 (bio) — `2e7bd9b`
- Slice 3 (roster add/remove) — `11f6d1f` + `1542356` + post-session bugfix `a20746d`
- Slice 4 (superpowers) — `043934f`
- Docs + Brand Audit D.5 — `5afac44`

---

## 2. Locked architectural commitments

These decisions must survive across sessions. Re-litigating them mid-flight is the failure mode to prevent.

### Print Shop principle

- **My Account** = government-issued identity document. Legal name, email, phone, identity photo, payout (Stripe), license/insurance, verification flags. **NOT in scope for visual customization.**
- **My ID Card** = print shop / business card. Photo, bio, verified roster, superpowers + daily dials. Content customization only, no visual decoration in v1.
- **Visual Customization Canvas** (decorated cards, color accents, graphic decoration) — parked for v1.1+ post-launch. Empirical signal required before scoping.

### Four-word grammar (Print Shop edit affordances)

- **HANDLE** — corner badge for direct edit (photo, bio)
- **DOOR** — MANAGE pill for multi-item zones (roster, superpowers)
- **STATE** — solid=featured, outline=roster, hairline=pending
- **COMMIT** — press + UNDO, single hard stop for skill removal

### Data-safety contract

Each lifetime edit operation is exactly ONE INSERT, UPDATE, or DELETE. Never read-modify-rewrite. Lifetime edits NEVER touch `worker_status`, `today_*` columns, or daily dial state. Daily edits NEVER touch `worker_skills.is_featured` or other lifetime fields. The boundary is structural (separate code paths), not enforced by discipline.

Current implementation: parallel-implemented pickers (daily today_skills and lifetime add-skill each have their own picker copy). Flagged for post-launch refactor to a shared presentational child + thin parent pattern, but acceptable for v1.

Job creation is atomic: `create_job_with_tasks` SECURITY DEFINER RPC (migration `20260604000001`) inserts the job + task links in one transaction. A taskless job is structurally impossible.

### Ruling 01 — Binary endorse/concern pattern

- No star ratings anywhere. Receipt's ENDORSE THIS WORK + quiet "raise a concern" link is the locked vocabulary.
- Endorsements unique per (job, endorser, direction). One job = one endorse moment per direction. No undo, no re-endorse.
- Post-endorse terminal state: gold-filled "✓ ENDORSED · {date}" rendered on Receipt load. The screen is a persistent artifact.
- review.tsx was eliminated at `9f5fb71`; customer→worker endorse + worker→customer endorse both live on Receipt.

### Receipt is the brand lighthouse

Worker payout = hero number. Platform fee = visible line item (3% Stripe + 7% ops = 10% flat). Binary endorse only. Mono ledger voice. This is the dignity-of-the-paystub thesis. Everything else aligns to it.

### Nav IA — four peer tabs

- HOME (present tense) · MARKET (the platform) · DESK (past tense + money) · ACCOUNT (identity + config)
- Separated by tense, not topic — makes location predictable.
- Desk is peer, not nested. Posting is action (anchored rows/bars), not a tab or a float.
- YOUR DESK card is the launchpad (flow-rows: Post a job / Edit my card / My posts / My applications). Sticky-pinned; masthead with greeting + live job-count scrolls away above it. No rename to YOUR PASS (never built).
- Account tab interior intentionally OUT OF SCOPE until identity-edit features become an active build thread.

### profiles.worker_status — NOT NULL, default 'offline'

Migration `20260530000001` shipped. Going forward, NULL is structurally impossible. Older rows backfilled.

### Brand invariants (carry forward always)

- 10% flat platform fee (3% Stripe + 7% ops)
- Dark Gold design: bg `#0E0E0F`, gold `#C9A84C`, ink `#1A0F00`, cream `#F5EEDC`, green `#4CAF7A`, amber `#E5901A`
- Fonts: Space Grotesk (headings/numbers), Inter (body), Playfair Display 700 italic (worker names), Oswald (eyebrows), IBM Plex Mono (ledger voice)
- Bundle: `com.paatatsk.xprohub`

### Key project IDs

- Supabase project ref: `ygnpjmldabewzogyrjbb`
- Stripe account: `acct_1TTVpS20OAk9WAsX` (FULLY_VERIFIED — cannot retest onboarding)
- Apple Developer Team ID: `67NL4S6Y9P`
- Repo: `github.com/paatatsk/xprohub`
- Local: `C:\Users\sophi\Documents\xprohub-v3`
- Test user: Paata kvamli@yahoo.com · user_id `6c3cd796-3a26-4be9-91b0-735642520ff5`

---

## 3. Polish / cleanup queue

Prioritized. Open polish doc at `docs/POLISH_PASS_QUEUE_2026-06-01.md` for the full canonical list. Highlights:

### Higher priority

1. **NEW stamp threshold drift documentation** — Ruling 01 originally pinned NEW to `endorsement_count === 0`; what shipped is `jobs_completed < 10`. Formally document the drift in Ruling 01 Brand Audit entry (~5 min).
2. **Native Alert → custom destructive dialog** in Slice 3 remove flow. Functionally works, visually off-brand. Replace `Alert.alert` with custom Modal matching Print Shop spec destructive register.
3. **Strings inlining cleanup** — accessibility labels from earlier slices are literal strings; should pull from `constants/strings.ts`.

### Lower priority

5. **"PHOTO" stamp redundancy** — when `avatar_url` is set, both the rendered image AND the PHOTO stamp text overlay show. Hide stamp when image renders.
6. **PHOTO badge legibility** on 72×88 portrait — 7px Space Grotesk 700 is hard to read at arm's length. Bump to 9-10px.

### Deferred to v1.1+

7. **Drag-reorder for superpowers** — featured order = insertion order in v1. Revisit on empirical signal from real workers.
8. **Visual Customization Canvas** — decorated cards, post-launch.
9. **Dollar Sign brand asymmetry concept** — `$` as both worker earnings + customer savings. Requires `useMode` hook + persistence infrastructure.
10. **Icon language explorations** — chalkboard/sketched, figurative line drawings, letterpress/vintage stamp. All break v1 locked invariants.

### Pending Design rulings

12. **Account tab interior** — when identity edits (legal name, payout destination, verification) become an active build thread.

### Operational items

13. Supabase Pro plan upgrade (Leaked Password Protection).
14. Worker classification legal review.
15. Job photos — **COMPLETE** (all 3 stages shipped). Stage 1: listing photos (post + card display). Stage 2: worker before/after evidence (chat upload + thread cards). Stage 3: after-photo on Receipt (latest after-photo as a calm memory anchor — deliberately not a before/after pair; evidence lives in chat).
16. Worker orientation arc (post-launch retention feature).

---

## 4. Process learnings

These have been hard-won. Honor them or rediscover them painfully.

### Maestro / Code / Design orchestra

- **Chat-Claude (Maestro)** strategizes, briefs, routes, and validates. Does not write code or design.
- **Claude Code** implements with empirical hardware verification. Investigates before building when scope warrants. Confirms scope before destructive operations.
- **Claude Design** rules visual treatment, copy, and brand interpretation. Delivers via HTML mockups + binding MD specs.
- All flows through Paata. Honest pushback is the norm in all directions.

### Separate workspaces

- Design has NO access to the code repo. Binding documents must be **pasted verbatim** to Design in chat, not referenced by filename. This bit us once when the nav brief never reached Design — fix is in process now.
- Code reads the repo natively. Same docs that live in `docs/` are visible to Code automatically.

### Investigation-before-build

- For slices larger than ~150 lines, route an investigation pass first. Code maps the blast radius (writes, reads, triggers, routing, schema) and proposes a slice plan. Then Maestro routes the actual build.
- Saved us hours on the review.tsx cleanup by enumerating the cascade BEFORE proposing the migration.

### Empirical verification

- Every slice ships with a hardware verification checklist. Test on device + Supabase SQL Editor.
- The data-safety contract is verified via cross-table SQL after each lifetime edit. After Slice 2 we verified that bio writes didn't touch worker_skills. After Slice 4 we verified that featured toggles wrote ONLY to is_featured, not to bio or avatar_url. The architecture only stays real if we keep proving it.

### Hooks before early returns

- Slice 3's freeze taught us: ANY hook introduced going forward must be placed before all early returns in a React component. React's "Rules of Hooks" require identical hook order across renders.
- Place every `useState`, `useRef`, `useCallback`, `useMemo`, `useEffect`, `useFocusEffect` BEFORE any conditional `return` statement. Even debug instrumentation hooks.

### Spec voice

The brand has a house spec voice now. Editorial format with: Oswald eyebrow → Playfair italic title → italic Playfair lede → ornate rules → numbered annotations → WAS/IS tables → LOCKED stamps → FIN signoff. Print Shop, NEW stamp, nav, and review.tsx rulings all conform. New rulings should match.

### Supabase SQL Editor gotchas

- **Dollar-quoted function bodies** (`$$...$$`) silently no-op inside an explicit `BEGIN;...COMMIT;` block in the SQL Editor. Run the bare `CREATE OR REPLACE FUNCTION` without the wrapper.
- **The SQL Editor does NOT hold a transaction open across separate "Run" clicks** — a `BEGIN;` in one run and `COMMIT;` in another does nothing. Run mutations as a single block (the editor's implicit transaction makes it all-or-nothing) and verify in a separate run.

### When the orchestra hits trouble

- Three rounds of fix-without-diagnose loops cost us hours on Slice 3. The discipline is: ALWAYS gather empirical evidence (logs, Supabase counts, hardware reproduction) BEFORE proposing the fix. Two diagnostic checks save three wrong-fix rounds.
- When a session is dragging, call it. Stop-and-resume-with-fresh-energy let Slice 3 actually close.

---

## Deferred / open items (next session)

1. **RELEASE-PAYMENT CONSOLE.ERROR (job-chat.tsx ~388)** — INVESTIGATED and CONSCIOUSLY SKIPPED. The 72hr auto-release cron + transfer.created webhook backup fully cover this path. Money is never lost or stuck. The Edge Function already logs failures server-side. The client-side console.error is noise but harmless. Do NOT re-flag in future audits.
2. **DORMANT SCHEMA** — belt_level/XP/badges tables: documented as unused, no app code. Not urgent but a cleanup candidate if DB trimming is scoped.
3. **In-Account settings gear (v1.1)** — a settings gear inside the Account screen opening a Settings/Privacy sub-screen. Sound future idea but deferred. **Trigger:** add only when Account grows enough items to need sub-navigation (~8 flat items today; when it outgrows a single scroll, it's time).

### Closed this session

- **Self-view in market** — SHIPPED (`d01dbae`). Proposal `docs/SELF_VIEW_IN_MARKET_PROPOSAL_2026-05-31.md` marked SHIPPED. All 4 open Design questions resolved: (1) natural sort, no pinning; (2) HIRE→EDIT CARD pill → my-card; (3) "· YOU" on credential stripe + "YOUR POST" gold Oswald eyebrow; (4) customer-vs-worker mode MOOT — no mode concept exists, self-view always-on.
- **Redundant Home gear icon + DEV receipt button** — removed (`09156bd`). Gear was redundant with always-visible Account tab; DEV button was scaffolding from before Desk existed.
- WORKERS/TALENT label drift — confirmed TALENT renders correctly (strings.ts verified 06-04).
- Test data cleanup — 8 test jobs deleted via SQL Editor (jobs 28 → 20). No stale Child/Elder Care test jobs remain.
- Polish queue refreshed — 5 new resolved items added (webhook logging, atomic RPC, string fallbacks, release-payment skip, test-data cleanup).
- **Home restructure** — SHIPPED (`401ff06`, 4 slices). Single-column categories, greeting masthead with live job-count, sticky YOUR DESK, style refinements. §6 glow removed by preference.
- **Photo system Stage 1** — SHIPPED (`343608c`, foundation + 4 slices). Customer listing photos: job_photos table, job-photos bucket (manual), photo picker on Post-a-Job (up to 3), listing photos on job cards.
- **Photo system Stage 2** — SHIPPED (`dd2eb2d`, 2 slices, Slice C dropped). Worker before/after evidence: upload in chat composer + photo cards in thread. Confirm-banner evidence summary deliberately dropped (redundant).
- **Photo system Stage 3** — SHIPPED (`cac3371`). After-photo on Receipt as memory anchor. Photo system COMPLETE.

---

## End of handoff

When the next chat opens, Maestro reads this top-to-bottom, asks Paata which thread to pick up, and routes. The repo is the source of truth; this doc is the index.

— End
