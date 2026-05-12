# XProHub — Project Status

**As of:** 2026-05-12
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
- stripe-redirect proxy is non-functional. Supabase CSP strips HTML rendering on unauthenticated Edge Functions. The function deploys, returns the right body, but the browser receives `text/plain` with `default-src 'none'; sandbox` CSP. Five architectural alternatives analyzed in `docs/STRIPE_REDIRECT_OPTIONS.md`. Not blocking C-4a — webhook → DB → gate path works fine; only post-onboarding return-to-app UX is affected.

### COMPLETED: Task 1 — Doc reconciliation cleanup batch

Closed 2026-05-07. All 22 reconciliation findings resolved. Files updated:
CLAUDE.md (Step 13 status, Belt System opt-in, platform fee qualifier),
SESSION_HANDOUT.md (build state rewrite, Investigation Brief deleted, font fix),
POLISH_PASS.md (Worker Dignity B trigger, font item, Direct Hire entry),
NEW_CHAT_PROMPT.md (deprecated with banner).

### COMPLETED: Task 3 — Set up Deno tooling for Edge Functions

Closed 2026-05-07. Deno CLI installed locally (2.7.14). Subpath mapping
(`@supabase/functions-js/` → `jsr:/@supabase/functions-js@^2/`) added to
all 4 per-function deno.json files. Root `deno.json` created for dev/CI
`deno check` from project root (see Locked Decision 11). `deno.lock`
gitignored (Deno used for type-checking only, not deploy). All 4 Edge
Functions pass `deno check` from project root. CI integration deferred
to when CI pipeline is built.

### COMPLETED: Task 4 — Complete C-4b (ID gate)

Closed 2026-05-08. Two-component apply gate fully wired per design spec
(CHUNK_C_DESIGN.md:616-643). Check 1 (photo + skills) and Check 2 (Stripe)
both fire as load-time render-path guards before the apply form loads.

Commits:
- `3aa6fcb` Task 4: apply.tsx gate logic (load-time guards, Promise.all
  skill count query, loading gate widened, handleSubmit gate deleted)
  + id.tsx returnTo support
- `d40d58b` Task 4b: id.tsx photo step. Identified during Task 4
  iPhone testing — id.tsx originally only handled skills, leaving
  users without photo in an infinite gate loop. 4-step setup: photo
  → categories → tasks → superpowers. Photo upload to avatars
  bucket, pre-population of existing avatar, error handling.
  Discovered and fixed adjacent infrastructure gap: avatars bucket
  did not exist in the Supabase project (profile-setup.tsx had been
  silently failing on upload since Milestone 1).

Empirically verified on iPhone (2026-05-08 / 2026-05-09):
States A–D tested, both gate cards verified, returnTo round-trips for
id.tsx and stripe-connect confirmed, end-to-end APPLICATION SENT.

Known follow-ups tracked in POLISH_PASS.md:
- id.tsx status bar overlap on all steps
- profile-setup.tsx silent-fail upload error handling

### Task 5 — iOS Universal Links for Stripe redirect ✅ COMPLETED 2026-05-11

Replaces the broken Supabase Function HTML proxy with iOS
Universal Link routing via Apple App Site Association file
hosted on xprohub.com.

Empirical validation on Paata's iPhone (UDID
00008120-001A2C161ED2201E) confirmed Universal Link routing in
both warm-start (app in background) and cold-start (app closed)
cases. Both land on (tabs)/stripe-connect screen without error.

Code changes:
- app.json — added ios.associatedDomains: ["applinks:xprohub.com"]
- supabase/functions/create-onboarding-link/index.ts — hardcoded
  return URLs to https://xprohub.com/stripe-return and
  /stripe-refresh
- app/stripe-return.tsx — replaced imperative router.replace()
  with declarative <Redirect> (fixes cold-start race)
- app/stripe-refresh.tsx — same Redirect pattern for symmetry
- supabase/functions/stripe-redirect/ — deleted (obsolete HTML
  proxy)

Infrastructure changes outside the repo:
- Cloudflare account created (paatatskhadiashvili@gmail.com)
- xprohub.com nameservers migrated GoDaddy → Cloudflare
  (jermaine.ns.cloudflare.com, tani.ns.cloudflare.com)
- Cloudflare Pages project "xprohub" created, deploys from /web
  folder (committed earlier in 319e62f)
- xprohub.com custom domain attached to Pages, SSL auto-provisioned
- Apple Developer App ID com.paatatsk.xprohubv3 — Associated
  Domains capability enabled in App ID configuration
- EAS Provisioning Profile regenerated to include Associated
  Domains entitlement (forced via `eas credentials` deletion +
  fresh build)
- Edge Function create-onboarding-link redeployed (v5)
- stripe-redirect Edge Function deleted from Supabase runtime

Locked Decision #9 (Stripe redirect proxy Option D — Universal
Links / App Links) implemented in full for iOS. Android side
deferred to Task 6.

### Task 6 — Android App Links + first EAS Android build [PARTIAL]

Mirror of Task 5 for Android. Implements Locked Decision #9
Path B (Android side, deferred from Task 5).

Step 1 complete (2026-05-11): android.package set to
com.paatatsk.xprohubv3 in app.json. Commit fbee972.

Remaining steps (parked — require Android test device):
- First EAS Android build (generates keystore — auto-managed
  by EAS)
- Extract SHA256 fingerprint from generated keystore
- Host /web/.well-known/assetlinks.json on Cloudflare Pages
  with package name + SHA256 fingerprint
- Add android.intentFilters config to app.json
- EAS Android rebuild
- Empirical test on Android device

Parked because: Paata does not currently have access to an
Android device. Remaining steps complete in one focused
session once a device is borrowable.

### Chunk D — Customer payment method gate [DESIGN COMPLETE]

Design doc committed 2026-05-11 (commit 3e235ff):
docs/CHUNK_D_DESIGN.md, 224 lines.

Scope: customer-side payment gate. When a user taps Submit on
Post a Job, check stripe_payment_method_added on profiles. If
false, route to a new payment-setup screen with returnTo
continuity. PaymentSheet handles card entry in-app.

Locked decisions:
- Gate fires at Submit (not Load) — preserves draft, respects time
- Gate flag: stripe_payment_method_added boolean on profiles
- Payment UX: Stripe PaymentSheet (in-app SDK, no Universal Link)
- Dual-role aware: separate from worker-side stripe_charges_enabled

Build sequence (8 steps):
- D-1: Migration — add stripe_payment_method_added column
- D-2: Edge Function — create-setup-intent
- D-3: Webhook amendment — setup_intent.succeeded
- D-4: New screen — app/(tabs)/payment-setup.tsx
- D-5: Gate in post.tsx — replace TODO at handleSubmit
- D-6: Register new screen in (tabs)/_layout.tsx
- D-7: Deploy Edge Functions + register webhook event
- D-8: End-to-end test on iPhone (both accounts)

Live DB pre-verified: stripe_customer_id column already exists
(original schema, pre-migration). stripe_payment_method_added
is the only new column required.

### Future Task — Bundle ID rename (com.paatatsk.xprohubv3 → com.paatatsk.xprohub)

Currently using xprohubv3 due to v1/v2 history on Apple
Developer account. Visible only in technical surfaces (Xcode,
EAS dashboard, Apple Developer Console) — never to end users.

When: Before App Store submission, after MVP feature freeze.
Why deferred: Apple bundle ID changes lock in at App Store
submission. We're far from that. Touching it now triples Task
scope.

Coordinated atomic change across:
- app.json (ios.bundleIdentifier)
- web/.well-known/apple-app-site-association (appIDs)
- web/.well-known/assetlinks.json (when added in Task 6)
- EAS rebuild
- Apple Developer Portal new App ID registration (if v3 hasn't
  aged out — VERIFY com.paatatsk.xprohub availability BEFORE
  making any changes)
- New provisioning profile

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
  - ✅ C-4b apply.tsx gate — Stripe check (commit `c36ddb6`) and ID gate (commits `3aa6fcb`, `d40d58b`) both wired. Task 4 closed 2026-05-08.
  - ✅ C-5 deep link return — `stripe-return.tsx` + `stripe-refresh.tsx` + `stripe-redirect` proxy
  - ✅ C-6 `account.updated` webhook handler (commit `2a8b947`)
  - ⏳ C-7 end-to-end test — deferred. C-4b complete, but C-7 can roll into Chunk D end-to-end testing rather than running in isolation.
- 🟡 Chunk D — design complete (docs/CHUNK_D_DESIGN.md, commit `3e235ff`). Build pending.
- ⏳ Chunks E, F — payouts, UI polish (not yet designed)

---

## Locked Architectural Decisions (do not re-debate)

1. **Dual-role from day one.** Every user is both customer and worker. No fork at signup.
2. **Gate philosophy.** Gates fire at moment of action only. No persistent banners or nags.
3. **Gate triggers.** Apply (worker) requires photo + ≥1 skill + Stripe Express. Post (customer) requires Stripe payment method. Browse, message, build ID — all free.
4. **Hire = Charge moment.** Funds escrowed before work begins. Worker Dignity, non-negotiable.
5. **ID = Business Card.** Professional identity setup (photo + skills) at `app/(onboarding)/id.tsx`. Accessed via Profile tab. Five tabs unchanged.
6. **Mission framing.** XProHub = hub for X (various) professionals.
7. **Levels framing.** Levels 1/2/3 are user lifecycle narrative, NOT gate enforcement. Code stays parallel-gates-on-action.
8. **Direct Hire pathway** parked as future feature (POLISH_PASS).
9. **Stripe redirect proxy — Option D (Universal Links / App Links) — iOS shipped, Android pending.** Custom URL schemes rejected for production payments flow (any malicious app can register `xprohub://` and intercept the Stripe return). Option E (302 redirect) was empirically confirmed to work but rejected for the same custom-scheme security concern. Option D (Universal Links + App Links via owned domain) is the locked production solution. iOS shipped 2026-05-11 (Task 5, commit `dc8f55c`) — apple-app-site-association live on xprohub.com, EAS provisioning profile regenerated with Associated Domains entitlement, empirically verified on iPhone in both warm-start and cold-start. Android side pending (Task 6 partial, awaiting test device). stripe-redirect Edge Function deleted from Supabase runtime as part of Task 5 closure. See `docs/STRIPE_REDIRECT_OPTIONS.md` for full decision audit trail.
10. **Secrets handling.** Stripe secrets and other sensitive credentials are set by Paata directly, not by Claude Code. Especially critical for live-mode keys in production.
11. **Deno dual-config.** Root `deno.json` is the dev/CI config (`deno check` from project root). Per-function `deno.json` files in `supabase/functions/<name>/` are deploy configs (referenced by `config.toml` `import_map`). The two configs serve different audiences and Deno does not auto-merge them — when adding a new import to any function, update both the per-function file (for deploy) and root `deno.json` (for dev/CI), or `deno check` and `supabase functions deploy` will disagree.

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

**Fixed (22 of 22) — reconciliation pass complete:**
- Findings #1–5, #9, #11, #16, #18, #21 — CLAUDE.md reconciled (commits `397cc3b`, `93b5c47`, `7fd0820`, `1ea262d`)
- Findings #6–8, #10, #12 — CLAUDE.md screen table verified accurate (resolved by #4 fix in `93b5c47`)
- Finding #17 — CLAUDE.md Step 13 status updated to reflect C-4a complete (Task 1, 2026-05-07)
- Finding #13 — SESSION_HANDOUT.md: build state rewritten, Investigation Brief deleted, font fixed (Task 1, 2026-05-07)
- Finding #14 — NEW_CHAT_PROMPT.md deprecated with banner (Task 1, 2026-05-07)
- Finding #15 — POLISH_PASS.md: Worker Dignity B trigger updated, font item marked partial, Direct Hire entry added (Task 1, 2026-05-07)
- Findings #19–20, #22 — cosmetic items resolved as part of Task 1 doc sweep (2026-05-07)
- Project rename Phase 1 (deep link scheme `xprohub://`) → commit `3b96a86`
- Project rename Phase 3 partial (GitHub repo `xprohub-v3` → `xprohub`) → commit `b1631ee`
- Supabase project display renamed "Production"

---

## Decisions Made in Chat But Never Documented

**All items resolved as of Task 1 (2026-05-07):**
- ~~CLAUDE.md six-change update~~ — executed in commits `397cc3b`, `93b5c47`
- ~~Direct Hire pathway~~ — POLISH_PASS entry saved (Task 1, 2026-05-07)
- ~~Belt System is opt-in~~ — qualifier added to CLAUDE.md Belt System section (Task 1, 2026-05-07)
- ~~10% platform fee~~ — CLAUDE.md updated to "~10% platform fee — exact rate TBD before launch" (Task 1, 2026-05-07)
- ~~SESSION_HANDOUT.md update~~ — build state rewritten, Investigation Brief deleted (Task 1, 2026-05-07)

---

## Deploy Status

**Completed:**
- ✅ Deploy `create-stripe-account` Edge Function — ACTIVE v2
- ✅ Deploy `create-onboarding-link` Edge Function — ACTIVE v3
- 🗑️ `stripe-redirect` Edge Function — DELETED 2026-05-11 (Task 5 closure). Replaced by iOS Universal Links via xprohub.com AASA file.
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
- Latest commit: `d5cecd2`

---

## Next Concrete Step

C-4a complete. Tasks 1–5 complete. Task 6 partial (android.package set 2026-05-11, App Links pending Android device). Chunk D design complete (docs/CHUNK_D_DESIGN.md). Working patterns codified in docs/WORKING_GUIDELINES.md. Next: Chunk D-1 (migration to add stripe_payment_method_added column to profiles).
