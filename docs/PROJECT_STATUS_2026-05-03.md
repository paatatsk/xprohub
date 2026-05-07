# XProHub — Project Status

**As of:** 2026-05-06
**Founder:** Paata Tskhadiashvili (paatatsk on GitHub), non-technical solo founder, NYC
**Mission:** Real Work. Fair Pay. For Everyone. — A hub for X (various) professionals.

---

## Active Task Blueprint

**Working principle:** Define a task with clear scope. Complete it fully —
including loose ends, deploys, and tests — before starting the next. No
parking findings to "deal with later." Intermediate commits within a task are
checkpoints, not parked work.

### COMPLETED: C-4a IMPLEMENTATION — Stripe Connect onboarding feature

Closed 2026-05-06, commit `2a8b947`.

**Items completed:**
1. ✅ Stage 1 — `hooks/useStripeStatus.ts` → commit `0da1f19`
2. ✅ Stage 2 — `app/(tabs)/stripe-connect.tsx` → commit `1f8d256`
3. ✅ Stage 3 — `app/stripe-return.tsx` + `app/stripe-refresh.tsx` → commit `739c1ec`
4. ✅ Stage 4 — `app/(tabs)/_layout.tsx` + `app/_layout.tsx` → commit `c6cfa3d`
5. ✅ Task 2 — 24 pre-existing tsc errors resolved → commit `f385ad0`
6. ✅ Item 9 — Edge Functions deployed (create-stripe-account v2, create-onboarding-link v3, stripe-redirect v1)
7. ✅ Item 9b — Stripe SDK apiVersion bug fixed → commit `02e5036`
8. ✅ Item 9c — Stripe URL scheme bug fixed (stripe-redirect proxy) → commit `02e5036`
9. ✅ Item 10 — Migration `20260503000001_accept_bid_set_agreed_price.sql` applied to remote and verified (has_agreed_price = true)
10. ✅ Item 11 — All 4 states visually verified on iPhone. States 1–2 in prior sessions, States 3–4 verified 2026-05-06 via temporary debug button on Home screen (since reverted). State 4 screenshot confirmed: PAYMENT ACCOUNT eyebrow, "YOU'RE ALL SET" heading, all 3 green dots, VERIFIED badge.
11. ✅ Path 2 — Stripe-only gate wired in apply.tsx → commit `c36ddb6`
12. ✅ C-6 — account.updated webhook handler + stripe-webhook deployed (ACTIVE v1) → commit `2a8b947`
13. ✅ Item 13 — this doc sync

**Known issues from C-4a:**
- stripe-redirect proxy is non-functional. Supabase CSP strips HTML rendering on unauthenticated Edge Functions. The function deploys, returns the right body, but the browser receives `text/plain` with `default-src 'none'; sandbox` CSP. Five architectural alternatives identified, future task. Not blocking C-4a — webhook → DB → gate path works fine; only post-onboarding return-to-app UX is affected.

### CURRENT TASK: Task 1 — Doc reconciliation cleanup batch

Twelve pending findings from the 2026-05-03 reconciliation pass —
deprecate `NEW_CHAT_PROMPT.md`, refresh `SESSION_HANDOUT.md` build state
section (delete stale 60-line Step 13 Investigation Brief, replace with
2-line pointer to design docs), update POLISH_PASS.md, plus cosmetic
findings. Definition of done: all 12 closed, single coordinated commit,
this blueprint updated.

### NEXT TASKS (ordered):

**Task 3 — Set up Deno tooling for Edge Functions.** When ready: install
Deno CLI, create `supabase/functions/deno.json` with compiler config and
ESM import map matching Supabase's standard pattern, run `deno check`
to verify it works, integrate into deploy workflow when CI is built.
Until then, Edge Functions are excluded from app tsc and rely on
Supabase's runtime checks at deploy time.

**Task 4 — Complete C-4b (ID gate).** Stripe gate is wired (Path 2).
Remaining: photo + skill count check before Stripe gate fires. Per
design CHUNK_C_DESIGN.md:616-643 the gate is two-component: Check 1
(ID) + Check 2 (Stripe). Only Check 2 is wired.

---

## What's Built and Working

### Foundation (Milestones 1–2)
Splash → welcome → signup → login → profile setup → home → Live Market (Jobs + Workers feeds) → Post a Job → Apply → My Applications → Earnings (stub) → Profile (stub).

### Step 13 — Payments (in progress)
- ✅ **Chunk A** — Database migration. Five Stripe columns on `profiles`: `stripe_account_id`, `stripe_charges_enabled`, `stripe_payouts_enabled`, `stripe_onboarding_completed_at`, `stripe_customer_id`. **Verified present in Supabase 2026-05-02.**
- ✅ **Chunk B** — Infrastructure. Stripe RN SDK, Edge Function scaffold, shared `stripe-client.ts`, webhook handler with HMAC verification, setup runbook. **B-8 manual setup not yet executed.**
- 🟡 **Chunk C** — Worker Stripe Connect onboarding:
  - ✅ C-1 design (dual-role, Q1–Q4 resolved)
  - ✅ C-2 `create-stripe-account` Edge Function (commit `865278b`)
  - ✅ C-3 `create-onboarding-link` Edge Function (commit `2cddce8`)
  - ✅ C-4a design doc, 909 lines (commit `76ce55e`)
  - ✅ C-4a implementation — closed 2026-05-06 (commit `2a8b947`)
  - 🟡 C-4b apply.tsx Stripe gate — Stripe check wired (commit `c36ddb6`), ID gate (photo + skill) pending (Task 4)
  - ✅ C-5 deep link return — `stripe-return.tsx` + `stripe-refresh.tsx` + `stripe-redirect` proxy
  - ✅ C-6 `account.updated` webhook handler (commit `2a8b947`)
  - ⏳ C-7 end-to-end test — deferred to post-C-4b (ID gate must be wired first for full gate coverage)
- ⏳ Chunks D, E, F (customer payment, payouts, UI polish)

---

## Locked Architectural Decisions (do not re-debate)

1. **Dual-role from day one.** Every user is both customer and worker. No fork at signup.
2. **Gate philosophy.** Gates fire at moment of action only. No persistent banners or nags.
3. **Gate triggers.** Apply (worker) requires photo + ≥1 skill + Stripe Express. Post (customer) requires Stripe payment method. Browse, message, build ID — all free.
4. **Hire = Charge moment.** Funds escrowed before work begins. Worker Dignity, non-negotiable.
5. **ID = Business Card.** `become-worker.tsx` → `id.tsx` rename pending. Lives within Profile tab. Five tabs unchanged.
6. **Mission framing.** XProHub = hub for X (various) professionals.
7. **Levels framing.** Levels 1/2/3 are user lifecycle narrative, NOT gate enforcement. Code stays parallel-gates-on-action.
8. **Direct Hire pathway** parked as future feature (POLISH_PASS).
9. **Stripe redirect proxy.** Stripe rejects custom URL schemes; production pattern is an HTTPS-served HTML page that bridges to the deep link. Initial implementation as `stripe-redirect` Edge Function (`verify_jwt = false`) does NOT work: Supabase's gateway applies a strict Content-Security-Policy (`default-src 'none'; sandbox`) and overrides Content-Type to `text/plain` on unauthenticated Edge Functions as XSS mitigation. The browser receives raw text, not rendered HTML — neither auto-redirect nor manual button can fire. Architectural rework required. Five options under consideration: JWT endpoint (doesn't fit), external HTML hosting (GitHub Pages, Vercel, Supabase Storage), Stripe return_url to owned domain, iOS Universal Links, or HTTP 302 redirect from Edge Function. Tracked as a future task — not blocking C-4a (apply gate works via webhook → DB → gate read; the broken redirect UX only affects polish of the post-onboarding return-to-app flow).
10. **Secrets handling.** Stripe secrets and other sensitive credentials are set by Paata directly, not by Claude Code. Especially critical for live-mode keys in production.

---

## Working Pattern — "Meticulous Mode"

Two-AI workflow: chat-Claude (strategist) writes prompts FOR Claude Code (terminal executor). Paata is founder, runs git, tests on iPhone, gives "approved" before any save or commit.

**Core protocol:**
- Investigate before propose
- Propose before save (show OLD/NEW verbatim)
- Verify uniqueness with `grep -n` before any `str_replace`
- Show actual file content, not summaries (display artifacts have fooled us)
- Pause between prerequisites — don't chain work
- One step at a time, explicit "approved" before save or commit
- Bare git commands, never `cd && git ...`, never compound with `&&`
- Investigation phase first, propose, approve, save, verify, commit

---

## Doc Reconciliation Pass (Current Phase)

22 discrepancies found 2026-05-03 between docs and codebase. Status:

**Fixed (10 of 22):**
- Finding #2 — Font system (Space Grotesk per Blueprint) → commit `7fd0820`
- Finding #11 — `accept_bid()` populates `agreed_price` → commit `1ea262d`
- Findings #1 + #3 — Milestone 3 "Built" / "Not Built" sections rewritten → commit `397cc3b`
- Finding #5 — Oswald → Space Grotesk font references → commit `397cc3b`
- Finding #21 — Trust System line replaced with progressive gates → commit `397cc3b`
- Finding #4 — Production Screens table corrected → commit `93b5c47`
- Finding #9 — Migrations list completed → commit `93b5c47`
- Finding #16 — RLS state note corrected → commit `93b5c47`
- Finding #18 — Stale Code Rule deleted + PROJECT_STATUS rule ref updated → commit `93b5c47`
- Project rename Phase 1 (deep link scheme `xprohub://`) → commit `3b96a86`
- Project rename Phase 3 partial (GitHub repo `xprohub-v3` → `xprohub`) → commit `b1631ee`
- Supabase project display renamed "Production"

**Pending (12 of 22):**
- Findings #6–8, #10, #12, #17 — CLAUDE.md remaining items
- Findings #13–15 — SESSION_HANDOUT.md, NEW_CHAT_PROMPT.md, POLISH_PASS small updates
- Findings #19–20, #22 — cosmetic batch

---

## Decisions Made in Chat But Never Documented

Remaining items that need to land in CLAUDE.md or POLISH_PASS (Task 1 scope):

1. **Direct Hire pathway** — drafted POLISH_PASS entry never saved.
2. **Belt System is opt-in** (not structural matching). Currently described as if structural in CLAUDE.md.
3. **10% platform fee is not actually locked** — assumed into CLAUDE.md, never explicitly decided.

**Resolved (removed from tracking):**
- ~~CLAUDE.md six-change update~~ — substantially executed in commits `397cc3b` and `93b5c47`. Residual items covered by 12 remaining reconciliation findings.
- ~~SESSION_HANDOUT.md update~~ — tracked in Doc Reconciliation section pending findings — will be addressed in Task 1.

---

## Deploy Status

**Completed:**
- ✅ Deploy `create-stripe-account` Edge Function — ACTIVE v2
- ✅ Deploy `create-onboarding-link` Edge Function — ACTIVE v3
- ✅ Deploy `stripe-redirect` Edge Function — ACTIVE v1 (`verify_jwt = false`)
- ✅ Deploy `stripe-webhook` Edge Function — ACTIVE v1 (`verify_jwt = false`), deployed 2026-05-06
- ✅ Set `STRIPE_SECRET_KEY` in Supabase secrets
- ✅ Set `STRIPE_WEBHOOK_SECRET` in Supabase secrets (set 2026-05-06; one-time exception — Claude Code ran the command. Protocol going forward per Locked Decision 10 is user-run only.)
- ✅ Register Stripe webhook endpoint in Stripe dashboard (XProHub sandbox, `account.updated` event only)

**Pending:**
- (none — all deploys complete)

---

## Stripe Sandbox Situation (Parked)

User has TWO sandbox accounts: `XProHub` (dashboard display name corrected — `acct_1TRNSu08l7Que01i`, all dev work wired here, `STRIPE_SECRET_KEY` sourced from this account) and a second empty duplicate (`acct_1TSoj1DlB111ylOV`). The empty one couldn't be deleted. Decision: park it. Sandbox naming has zero customer impact. Live production Stripe is what matters for NYC launch. Note: Stripe Connect platform branding still shows "XRroHub sandbox" in worker-facing onboarding — cosmetic, separate future task.

---

## Critical File Locations

- Repo: `https://github.com/paatatsk/xprohub.git` (renamed from `xprohub-v3`)
- Local: `C:\Users\sophi\Documents\xprohub-v3` (folder rename pending — Phase 3)
- Supabase project ref: `ygnpjmldabewzogyrjbb` (display name: "Production")
- Latest commit: `2a8b947`

---

## Next Concrete Step

C-4a is complete. Next: Task 1 — doc reconciliation cleanup batch (12 pending findings). Then Task 3 (Deno tooling) and Task 4 (complete C-4b ID gate).
