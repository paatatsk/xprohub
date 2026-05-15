# XProHub — Polish Pass Parking Lot

> Good UX ideas and refinements captured during the build, to be
> addressed in a dedicated polish pass AFTER core functionality
> is complete (all of Milestone 2 done).
>
> Do not attempt these during feature building. They wait.

## UX Refinements

- **Budget sliders on Post a Job** — replace typed MIN/MAX inputs
  with dual-handle slider. Needs: max value cap (logarithmic?),
  tick marks, haptic feedback. Captured 2026-04-19.

- ~~**Step 12 chat-screen review-state race**~~ — `userHasReviewed` is read once on
  initial load; after submitting a review and navigating back, the state is stale
  and "LEAVE A REVIEW" stays visible. Tapping it triggers a duplicate INSERT that
  hits the `reviews` unique constraint and surfaces an error the user shouldn't see.
  **Fix:** Add `useFocusEffect` to `job-chat.tsx` to re-run the existing-review
  SELECT (filtered by `job_id` + `reviewer_id`) every time the screen regains focus.
  Short, isolated — hotfix-eligible between any major step. Captured 2026-04-30.
  **Resolved 2026-05-15 (commit `0af9e9a`).** useFocusEffect added to job-chat.tsx.

- ~~**id.tsx Step 1 header hidden behind iOS status bar**~~ — the eyebrow
  ("STEP 1 OF 4") and heading partially render behind the iOS status bar
  at the top of the screen. Affects all steps (photo, categories, tasks,
  superpowers) since they share the same layout. Likely fix: add `'top'`
  to `SafeAreaView edges` (currently `edges={['bottom']}` only). Captured
  2026-05-08, observed during Task 4 iPhone testing.
  **Resolved 2026-05-15 (commit `0af9e9a`).** All four SafeAreaView edges changed to `['top', 'bottom']`.

- ~~**profile-setup.tsx silently swallows avatar upload errors**~~ — line 70
  checks `if (!uploadError)` and proceeds to set the public URL, but the
  else branch is empty. If the upload fails (network error, bucket missing,
  RLS denial), the profile UPDATE runs without `avatar_url`, leaving the
  user with no photo and no error message. Surfaced by Task 4b investigation
  (commit `d40d58b`) when the avatars Storage bucket was discovered to not
  exist. **Fix:** mirror id.tsx's pattern — display error, return early.
  Captured 2026-05-09.
  **Resolved 2026-05-15 (commit `0af9e9a`).** Inverted to fail-fast: setError + setLoading(false) + return.

- **job-bids.tsx stale bid list after successful hire** — after Paata
  hired Khatuna via hire-and-charge, Paata's view of My Jobs →
  Applications still showed the bid as pending with Accept/Decline
  buttons visible. Tapping Accept again triggered an Edge Function
  error (correct DB-level rejection — bid no longer pending) but the
  UI didn't refresh to reflect the accepted state. Surfaced during
  E-12 Test 1. **Fix:** after successful hire-and-charge in
  handleAccept, either refetch the bid list before navigating to
  chat, or navigate immediately (current behavior) and ensure the
  bids screen refetches on focus when the user returns. The
  navigation-to-chat path works (user lands in the right place),
  so this is a cosmetic stale-state issue on the bids screen if
  the user navigates back. Captured 2026-05-15.

---

## Semantic Category Color System

**Captured:** 2026-04-25 (Paata's idea during week 2 build, locked Dark Gold era)

**Concept:** Accent colors applied to category tiles based on difficulty/risk tier. Color becomes *information*, not decoration — a glance tells users how serious a category is.

**Color Spectrum:**
- **Green / teal** → easy, low-stakes categories
  - Home Cleaning, Errands & Delivery, Pet Care (basics), Personal Assistance, Trash & Recycling
- **Amber / gold** → moderate skill
  - Moving & Labor, Tutoring & Education, Personal Training & Coaching, Gardening, Vehicle Care, Events
- **Orange / red** → skilled, regulated, or high-responsibility
  - Electrical, Plumbing, HVAC, Carpentry, IT/Tech, Child Care, Elder Care

**Design Rules:**
- Use color as **subtle accent only** — 3–4px left edge bar on tile, OR border on tier badge. Not tile background.
- **Dark Gold stays the hero color.** Semantic colors are supporting cast.
- Applies to category grid on Home screen, category filter strip on Live Market, and worker card belt/skill display.

**Data Source (no new schema needed):**
Derive tier from existing fields:
- `task_categories.tier` (1 = standard, 2 = skilled/premium)
- `task_categories.requires_background_check` (boolean)
- `task_library.difficulty` (easy / medium / skilled) — aggregate the category's tasks

**Implementation Sketch:**
1. Add a helper function `getCategoryAccent(tier, requiresBgCheck)` returning a hex color
2. Apply to the left edge of each category tile component
3. Accessibility check: make sure the accent is redundant (emoji + name still communicate everything), so colorblind users lose no info

**Why This Is a Design Upgrade, Not Decoration:**
Currently categories distinguish by emoji alone. Adding semantic color adds a second dimension: *how serious it is*. Reinforces the Belt System, difficulty tiers, and Level 2 Gate logic already in the schema. The color *is* the business logic made visual.

---

## Marketplace Health — Application Caps (Phase 2)

**Captured:** 2026-04-26 (Paata's idea during Step 6 planning)

**Problem:** Without caps, two failure modes emerge at scale:
- Customer posts a job → 20+ workers apply → customer paralyzed, ghosts the thread, trust in platform drops
- Workers blast every job without intent → spam behavior → customer feed becomes noise
- Winning worker is isolated; 19 others feel rejected, platform sentiment tanks

**Why not now:** With current test data (2 users, 2 jobs), caps are meaningless. We need real usage volume to calibrate numbers. Also requires belt + review data that doesn't exist yet.

**Four Approaches (combine as needed):**

### Approach A — Job Application Cap (top priority when implemented)
Cap applications per job at **5–7**.
- Once cap hit, job displays "FULL — Customer reviewing. Check back if not matched."
- Apply button disabled with clear messaging
- Job remains visible but un-applyable
- Mirrors real hiring — nobody reviews 47 applicants for a cleaning job

### Approach B — Worker Active Application Cap
Cap simultaneous active applications per worker at **3**.
- Worker must wait for decision or withdraw old application before applying to new jobs
- Prevents spam-apply behavior, forces intention, protects customers from low-effort bidders

### Approach C — Both Caps Together (recommended combination)
Implement A + B simultaneously. 5-application job cap + 3-application worker cap.

### Approach D — Belt-Tiered Worker Caps
Scale the Worker Active Application Cap by Belt Level:
- Newcomer / White Belt: 1 active application
- Yellow Belt: 2
- Orange+: 3
- Blue+: 4
- Black/Red: 5

Creates meaningful progression — earning belts unlocks real throughput.

**Implementation Notes (when ready):**
- New column on `jobs`: `application_count` (or count live from bids table)
- New RLS check on `bids.insert`: count existing bids for this job, reject if >= cap
- New RLS check on `bids.insert`: count worker's active (status='pending') bids, reject if >= their tier cap
- UI: Apply button shows `{n}/{cap} applied` as visual hint before hitting cap
- UI: if cap hit, show clear messaging with timing estimate

**Rollout Sequence:**
1. Launch without caps, collect data for 1-2 months
2. Analyze actual application-per-job distribution
3. Set cap at 90th percentile
4. Add worker cap with Belt tiering once Belt System is live
5. Monitor and adjust

**Related Considerations:**
- Withdraw flow — UI for worker to cancel an active bid
- Expiry — auto-expire unaccepted bids after N days to free slots
- Customer's "no thanks" button — clears a bid politely, frees the slot

---

## Direct Hire Pathway (Parked)

**Captured:** 2026-05-01 | **Area:** Product — navigation model | **Severity:** Future feature

Workers Feed currently shows worker business cards. The Direct Hire
flow (`direct-hire.tsx`) exists with full job form parity to Post a Job,
targeted at a specific worker. However, there is no production navigation
path that connects browsing a worker card to initiating a Direct Hire.

This is parked as a future feature. The current flow (Post a Job → workers
apply via Live Market) is the MVP path. Direct Hire adds a customer-initiated
alternative that bypasses the public job listing. Design and gate integration
(customer payment method required) are deferred to a future milestone.

**Build this when:** After Chunk D (customer payment method) lands and the
core marketplace loop has real usage data.

---

## Worker Dignity — Notifications, Closure Language, "While You Wait"

**Captured:** 2026-04-26 (synthesized from Paata's conversation with Grok + review with Claude)

**Philosophy:** "Closure is a form of respect." Most gig platforms ghost workers — applications disappear into a void with no resolution. XProHub commits to the opposite: clear, fast, system-oriented closure paired with immediate next opportunities. Treat workers' time as a valuable resource, not an infinite commodity.

**Already living in the product (no work needed):**
- `accept_bid()` Postgres function auto-declines all other pending bids atomically — no worker hangs in pending limbo
- Smart templates reduce application investment so rejection has lower emotional cost
- Explicit decline button lets customers close out individual workers cleanly
- Bids carry status (pending/accepted/declined) with visual states

**Important UX principle: live the philosophy, don't market it.**
Don't add UI copy that says "We commit to Worker Dignity™" or "We never ghost." Naming a value to users feels like virtue-signaling. The good experience IS the message. Save "Worker Dignity" as internal language for documentation, team onboarding, and investor pitch — not for the app's UI copy.

### Implementation A — Worker Notifications System (LARGE, future milestone)

**Scope:** When customer accepts/declines a bid, write a row to the existing `notifications` table. Build a Notifications screen for workers showing recent activity. Optionally add badge counts on Home and push notifications.

**Why park:** Full milestone, not a polish item. Requires trigger functions on bid status change, new Notifications screen UI, badge counts, eventually push notifications.

**Build this when:** ready to invest in a notification milestone (Milestone 4+).

### ~~Implementation B — "Released" / "Project Closed" copy~~ (SMALL, depends on Worker Dashboard)

**Scope:** When workers view their own bid history, declined bids should display as "Released" or "Project Closed" — not "Declined." System-oriented language reframes rejection as the project's status, not the worker's failure. Customer's view stays "Declined" (technically accurate from their action).

**Resolved 2026-05-15 (commit `4d5fc51`).** bidStatusLabel in my-applications.tsx now maps `declined` → `RELEASED`. Customer's view (job-bids.tsx) keeps `DECLINED` — intentional asymmetry preserved.

### Implementation C — "While You Wait" cards on apply-success (MEDIUM, ready to build)

**Scope:** Add 2-3 task-matched job cards to the bottom of `apply-success.tsx`. Replaces dead-space below the "APPLICATION SENT" confirmation with momentum-preserving recommendations.

**Spec:**
- Section label: "WHILE YOU WAIT" (small caps, gold eyebrow)
- 2-3 vertically stacked JobCards (reuse component from market.tsx)
- Filter: same category as the job just applied to, status = 'open', excluding the job just applied to, excluding jobs the worker already bid on
- If no matches: hide section gracefully (no empty state)
- Existing CTA buttons stay below

**Build this when:** Next polish session, or whenever apply-success.tsx feels worth iterating on.

### What NOT to Build (rejected during review)

- **Pre-application banner** ("This project typically receives multiple strong applications") — risks discouraging working-class workers and triggering imposter syndrome.
- **"Worker Dignity" labeled UI copy** — virtue-signaling. Show, don't tell.
- **"You may or may not be selected" hedging on success screens** — undercuts the worker's win-moment of submitting.

---

## Trust & Safety

~~**Customer-side ID/photo requirement for post-job**~~
**Captured:** 2026-05-01 | **Area:** Trust & Safety — gate architecture | **Severity:** Resolved 2026-05-15 (commit `d1ab011`)

Mission tension: anonymous customers (with only a payment method) could
hire workers who must show full identity. Workers face physical risk
when entering customer homes, financial risk when customers can dispute
charges, and dignity risk when a fully-verified worker is matched with
an anonymous booking.

**Resolved 2026-05-15 (commit `d1ab011`).** Customer identity gate
fires at Submit on post.tsx: checks full_name + avatar_url before the
payment-method gate (D-5). Routes to profile-setup.tsx in mode=gate
with returnTo continuity. Photo required in gate mode, name
pre-populated from existing profile. Graduated from POLISH_PASS to
shipped code as a prerequisite for Chunk E dispute path.

---

## Hybrid Matching Exploration — Milestone 4+ (with honest critique)

**Captured:** 2026-04-26 (synthesized from Paata's research conversation + review with Claude)

**The proposal:** A two-mode matching ecosystem combining instant-dispatch (fast match, standardized tasks) with selection-based bidding (Showcase, complex projects). Customer and worker each pick which mode they want.

**Status:** Mostly NOT for XProHub right now. Some real ideas underneath worth keeping. Treat as a Milestone 4+ exploration, not a polish item.

### What's Actually Worth Keeping

**Insight 1 — Standardized tasks could use instant-book UX.**
For predictable services (basic cleaning, dog walking, errands), customers don't need to review 5 applications. They need someone reliable, available now, at a fair fixed price. This is a real product space.

**Why park, don't build:** Instant dispatch requires real-time availability state, geolocation, queue ordering, push notifications, response SLAs, and standardized fixed pricing — basically Uber's entire dispatch infrastructure. Multi-month milestone, not a feature.

**Insight 2 — Market density should influence UX.**
On low-supply days, surface "pending jobs needing workers" prominently. On high-demand days, surface "open opportunities" prominently.

**Why park, don't build:** Requires real usage data to detect "low" vs "high" density. Not meaningful at current scale. Revisit when XProHub has 50+ active jobs/day.

### What NOT to Build (rejected during review)

**1. Mode-toggle UI for customers.** Forcing customers to pick a mode before picking a worker adds cognitive load. Customers want to describe what they need and have it solved. If we ever build instant-book, the platform should choose contextually, not ask the user.

**2. "Premium" tier access tied to ratings.** Locking new workers (immigrants, returning parents, formerly incarcerated) out of the platform's fastest-earning channel on day one is the trap most gig platforms fall into. "Earn your way to fairness" is not the same as fairness.

**3. Consultant-speak naming.** "Direct Dispatch," "Showcase," "Project Discovery Mode" — not how customers think. Use plain English: "Quick Hire" vs "Browse Workers" if ever built.

### What's Already Doing This Work

The Belt System already addresses the "newbie problem" — workers progress visibly through completed jobs (White → Yellow → Orange → ...). More egalitarian than gating queue access by rating.

The Apply flow already protects worker dignity through atomic auto-decline on bid acceptance.

Don't replace these with a new system. Deepen them.

### When to Revisit

Three concrete signals:
1. **Volume:** 50+ active jobs/day, 100+ active workers
2. **Customer feedback:** Repeated requests for "I just need someone NOW"
3. **Worker feedback:** Repeated requests for "I want instant work" with willingness to commit to SLAs

Without all three, instant-dispatch is solving an imagined problem.

---

## Operational Tracking

Not feature work — calendar-style reminders for infrastructure maintenance.
Park here so they don't get lost between sessions.

**SUPABASE_ACCESS_TOKEN security hygiene**
**Captured:** 2026-04-30 | **Area:** Security / Step 13 Chunk B-3 | **Severity:** Latent — depends on laptop physical security

The Personal Access Token used for `supabase` CLI auth is set as a Windows User
environment variable (`SUPABASE_ACCESS_TOKEN`) with NO expiration date. Trade-off:
no rotation hassle, but the token stays valid until manually revoked.

**Fix when needed:** If laptop is lost, stolen, sold, OR if any chat history
containing the token is ever leaked, immediately revoke from Supabase dashboard
(Account → Access Tokens → Delete the "xprohub-cli-local" token). Then generate
a replacement and update the `SUPABASE_ACCESS_TOKEN` env var.

**Check when:** On laptop change or suspected compromise. No scheduled rotation needed.

---

**@xmldom/xmldom high-severity vulnerability in Expo toolchain**
**Captured:** 2026-04-30 | **Area:** Operational / Security tracking | **Severity:** High (build-time only, not runtime)

`npm audit` reports a high-severity vulnerability in `@xmldom/xmldom <=0.8.12`,
transitively pulled in via Expo's `@expo/config-plugins` build toolchain. NOT
introduced by Stripe or any project code. NOT present in shipped app code — affects
build-time tooling only.

The "fix" suggested by `npm audit fix --force` would downgrade Expo to 49 and break
the entire project. Wait for upstream Expo patch.

**Fix:** Re-run `npm audit` after every Expo SDK upgrade. When the `@xmldom/xmldom`
finding clears, the vulnerability is resolved.

**Check when:** Each Expo SDK upgrade.

---

**Supabase migration tracking backfilled 2026-05-12**
**Captured:** 2026-05-12 | **Area:** Schema / migration history | **Severity:** Resolved (historical note)

Prior to 2026-05-12, the supabase_migrations.schema_migrations
table on the linked Supabase project was empty — all 9 existing
migrations had been applied via the Supabase SQL Editor in the
dashboard, not via `supabase db push`. The local migrations
folder and the remote DB state were both correct, but the CLI's
tracking table was out of sync with reality.

This was discovered during Chunk D-1 when `supabase migration
list --linked` showed all migrations as pending despite their
schema changes being live.

Fix applied 2026-05-12: ran `supabase migration repair <version>
--status applied --linked` for each of the 9 existing migrations,
then applied the new D-1 migration cleanly via `supabase db push`.

All 10 migrations now show matching Local and Remote versions.
Future migrations can use `db push` normally.

**No action needed going forward.** This entry exists so that
future-Claude doesn't get confused if they see `supabase migration
repair` in git history (it isn't, but they might search for it)
or if they wonder why the schema_migrations table state changed
suddenly between commits 9172c98 and 85ff667.

---

**Supabase Data API: explicit GRANTs required for new tables**
**Captured:** 2026-05-13 | **Area:** Schema / Data API security | **Severity:** Latent — deadline October 30, 2026

Supabase announced on 2026-05-12 that the implicit grant from the
Data API (supabase-js, REST, GraphQL) to tables in public schema
is being removed. Starting October 30, 2026, every new table in
public requires explicit GRANT statements or supabase-js calls
return 42501 errors.

Existing tables on project ygnpjmldabewzogyrjbb keep their current
grants — confirmed by the announcement language and by the fact
that the app currently works without errors. The change only
affects new tables created after the rollout.

Chunk D is unaffected (D-1 already shipped its column addition;
D-3 through D-8 are code-only).

**Fix when needed:** When creating any new table in a future
migration, include three blocks in the migration:

  GRANT SELECT ON new_table TO anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON new_table TO authenticated;
  GRANT ALL ON new_table TO service_role;
  ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
  -- then RLS policies as usual

Adjust per-role permissions to match the table's access pattern.

**Audit check (optional, before October 30):** To confirm all
13 existing tables have proper grants, run in the Supabase SQL
Editor:

  SELECT grantee, table_name, privilege_type
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee IN ('anon', 'authenticated', 'service_role')
  ORDER BY table_name, grantee;

**Related:** One-line flag added to CLAUDE.md Development
Conventions section pointing back to this entry.

---

**Supabase dashboard Edge Function editor: implicit deploy risk**
**Captured:** 2026-05-13 | **Area:** Workflow / Edge Function deploys | **Severity:** Latent — depends on dashboard interactions

The Supabase dashboard's Edge Function detail page has a Code tab
showing the deployed source. The editor is treated as live-editable
by default — any keystroke or cursor activity inside the code area
can trigger an "unsaved changes" state that surfaces a "Deploy
updates" button. Clicking that button would push the in-browser
edited content live, bypassing git entirely and creating drift
between repo and production.

This was almost triggered accidentally during D-3 verification
(2026-05-13). Caught by chat-Claude flagging the deploy dialog
before Paata clicked anything. Cancel + navigate-away exited
cleanly without deploying.

**Fix / discipline:**

- Treat the dashboard Code tab as READ-ONLY for verification only
- Never edit Edge Function source via the dashboard
- All deploys go through: edit locally → commit → push →
  `npx supabase functions deploy <name> --project-ref ...`
- If the "Deploy updates" button appears, ALWAYS cancel and
  navigate away from the page (clicking "Edge Functions"
  breadcrumb is safest). If prompted "you have unsaved changes,"
  discard them.

**Why it matters:** Bypassing git for deploys means commit history
no longer reflects what's running in production. Same family of
problem as the migration_tracking_table backfill we fixed earlier
this week — except harder to detect because there's no equivalent
of `supabase migration list` for Edge Functions.

**Optional follow-up:** Investigate whether Supabase dashboard has
a setting to disable in-browser editing of Edge Functions for our
project. If yes, enable it.

---

**Apple App Store compliance audit — pre-launch blockers identified**
**Captured:** 2026-05-14 | **Area:** Compliance / App Store submission | **Severity:** Latent — pre-launch blocker

Full Apple App Store compliance audit conducted 2026-05-14 via
Claude Code consultation. Checked Apple Review Guidelines (Sections
3.1.3(e), 5.1.1, 1.2, 4.0), Stripe iOS guidance, and codebase
against requirements.

**Key finding: business model is compliant.** Apple Guideline
3.1.3(e) requires third-party payments (not IAP) for real-world
services consumed outside the app. Stripe Connect for gig
marketplace is the correct architecture. Zero StoreKit/IAP imports
confirmed in codebase.

### Already fixed (same batch)

1. **NSPhotoLibraryUsageDescription** — app uses expo-image-picker
   in profile-setup.tsx and id.tsx but had no iOS permission string
   declared. Added to app.json expo.ios.infoPlist.

2. **Privacy manifests (PrivacyInfo.xcprivacy)** — Apple requires
   Required Reason API declarations for TestFlight/App Store upload.
   Added expo.ios.privacyManifests to app.json with 4 API categories:
   UserDefaults (CA92.1), FileTimestamp (C617.1, 3B52.1),
   SystemBootTime (35F9.1), DiskSpace (E174.1). Derived from
   inspection of node_modules PrivacyInfo.xcprivacy files across
   React Native core, expo-constants, expo-file-system, and Stripe
   iOS SDK. Both items take effect at next EAS iOS build.

### Deferred — pre-launch blockers (Chunk G)

3. **Account deletion** (Apple Guideline 5.1.1(v)) — mandatory for
   all apps with account creation. No UI, no backend logic, no
   migration exists. Requires: settings screen with Delete Account
   option, Edge Function for cascading delete (Supabase auth user +
   profiles row + Stripe Customer/Connected Account cleanup).
   **Severity: Critical — guaranteed rejection without it.**

4. **Privacy Policy + Terms of Service** (Apple Guideline 5.1.1(i))
   — must exist as hosted URLs AND be linked in-app (signup screen +
   settings). Legal copy written by Paata, not generated by AI.
   Technical work: host on xprohub.com, add links to signup.tsx and
   a settings/legal screen, add Privacy Policy URL to App Store
   Connect metadata. **Severity: Critical — guaranteed rejection
   without it.**

5. **Content moderation + user reporting** (Apple Guideline 1.2) —
   apps with user-generated content (job posts, chat, reviews,
   profiles) must provide: report mechanism, block mechanism,
   published contact info, content filtering method. Currently none
   exist. **Severity: Critical — guaranteed rejection without it.**

6. **Stub screen cleanup** (Apple Guideline 4.0 — Design minimum
   functionality) — six tab screens are stubs (~22 lines each):
   match.tsx, chat.tsx, payment.tsx, belt.tsx, earnings.tsx,
   notifications.tsx. Apple reviewers navigate every visible screen
   and reject for "incomplete functionality." Fix: hide from tab
   bar or give meaningful "coming soon" states. **Severity: High
   — likely rejection.**

### Not needed (confirmed by audit)

- **Sign in with Apple** — not required; only email/password auth,
  no social login triggers Apple's mandate.
- **NSCameraUsageDescription** — photo library picker only, no
  direct camera access.
- **NSLocationWhenInUseUsageDescription** — PostGIS is server-side
  only, no device GPS.
- **App Tracking Transparency** — no cross-app tracking.

**Full build plan:** docs/CHUNK_G_COMPLIANCE_DESIGN.md

---

**D-8 production bug: webhook secret mismatch — found and fixed during live iPhone test**
**Captured:** 2026-05-14 | **Area:** Operational / Stripe webhook secrets | **Severity:** Resolved — operational learning, no code change needed

During D-8 iPhone end-to-end testing, Test 1 (happy path) hit
the polling timeout fallback unexpectedly. PaymentSheet completed
successfully, Stripe captured `setup_intent.succeeded`
(evt_1TWoVc...), but both delivery attempts returned HTTP 400
with body "Webhook signature verification failed."

**Root cause:** `STRIPE_WEBHOOK_SECRET_PLATFORM` stored in
Supabase secrets did not match the actual signing secret of the
D-3 Stripe endpoint. The value was likely mangled when originally
set via Windows PowerShell CLI on 2026-05-13 (special characters,
quoting, or trailing newline in the `whsec_...` string).

**Diagnosis path:** Edge Function logs showed the dual-secret
fallback working correctly:
1. `[stripe-webhook] Primary secret failed, trying platform secret`
   — expected, because `setup_intent.succeeded` comes from the
   "Your account" endpoint, not Connected accounts
2. `[stripe-webhook] Signature verification failed` — platform
   secret also failed, confirming the value was wrong

The code was correct. The crypto was correct. The architecture
was correct. Only the stored secret value was wrong.

**Fix:** Re-revealed the signing secret from Stripe dashboard
for the D-3 endpoint, then set the correct value via Supabase
dashboard UI (Method A — bypasses shell encoding entirely).
Verified via Stripe's "Resend" button on the failed event.
Result: 200 OK delivery, "Recovered" status in Stripe dashboard,
`stripe_payment_method_added` flipped to `true` in profiles table.

**Discipline going forward:** Prefer Supabase dashboard UI over
CLI for setting webhook secrets (`whsec_...` values contain
characters that Windows PowerShell can mangle). CLI is fine for
non-sensitive secrets; webhook signing secrets should use the
dashboard's Environment Variables editor. This refines (does not
replace) Locked Decision 10 in PROJECT_STATUS — Paata still sets
all secrets directly; this just specifies the preferred input
method for webhook signing secrets specifically.

**Outcome:** Full Chunk D chain proven on production traffic:
PaymentSheet → create-setup-intent → SetupIntent → webhook →
dual-secret verification → DB flag flip → gate passes → job posts.
The D-3 deferred synthetic test was fulfilled organically — the
bug actually made it a better test because it exercised both the
failure path and the recovery path.

---

## Deployment & Dev Environment

Deployment prep and local dev config items. None block current development;
all relevant before first production build or local Supabase dev setup.

**iOS / Android bundle identifiers in app.json**
**Captured:** 2026-04-30 | **Area:** Deployment prep | **Severity:** Blocks App Store / Play Store submission

EAS dev build flow set the iOS bundle identifier to `com.paatatsk.xprohubv3` during
`eas build` setup. However, `app.json` may not have explicit `ios.bundleIdentifier`
and `android.package` fields. Auto-derivation works for EAS dev builds but stable
identifiers are required for production store submission.

**Fix:** Add explicit fields to `app.json`:
- `ios.bundleIdentifier`: `com.paatatsk.xprohubv3`
- `android.package`: `com.paatatsk.xprohubv3`

**Build this when:** Before first EAS production build for store submission. Also
useful before any Stripe production-mode testing.

---

**Redundant supabase/.temp/ entry in root .gitignore**
**Captured:** 2026-04-30 | **Area:** Tidiness | **Severity:** Resolved 2026-05-15 (commit `7dc8112`)

After `supabase init` in B-3, `supabase/.gitignore` was auto-created and already
ignores `.temp`. The earlier entry in the root `.gitignore` (`supabase/.temp/`) is
therefore redundant. Both work, no conflict, but duplicate coverage.

Removed the comment header and redundant line from root `.gitignore`.

---

**config.toml [db] major_version mismatch with remote**
**Captured:** 2026-04-30 | **Area:** Local dev compatibility | **Severity:** Latent — only triggers if local Supabase dev is ever set up

`supabase init` set `[db] major_version = 17` in `supabase/config.toml`. Remote
Supabase project may be on Postgres 15. Mismatch only affects local Supabase dev
(`supabase start` with Docker). Does NOT affect Edge Function deployment or any
remote operations.

**Fix:** Verify remote Postgres version (Supabase dashboard → Project Settings →
Database). Update `major_version` in `config.toml` to match.

**Build this when:** Only if local Supabase dev is ever set up. Ignore if always
working against remote.

---

**config.toml [db.seed] sql_paths points to non-existent file**
**Captured:** 2026-04-30 | **Area:** Local dev compatibility | **Severity:** Latent — only triggers on local `supabase db reset`

Default `[db.seed] sql_paths = ["./seed.sql"]` expects `supabase/seed.sql` to exist.
Actual seed file lives at `supabase/seed/XProHub_TaskLibrary_Seed_v1.1.sql`.

**Fix:** Update `sql_paths` in `config.toml`:
```toml
sql_paths = ["./seed/XProHub_TaskLibrary_Seed_v1.1.sql"]
```

**Build this when:** Only if local Supabase dev is ever set up.

---

## Documentation Hygiene

**Reconcile font references across docs**
**Captured:** 2026-05-02 | **Severity:** Resolved 2026-05-15 (commit `7dc8112`)

`CLAUDE.md` fixed (commit `397cc3b`). `SESSION_HANDOUT.md` fixed
(2026-05-07 Task 1). `docs/CHUNK_C_DESIGN.md` two Oswald references
corrected to Space Grotesk (commit `7dc8112`). All font references
now consistent across all docs.

---

**Project rename: xprohubv3 → xprohub**
**Captured:** 2026-05-02 | **Severity:** Low (cosmetic / brand)

The bundle ID, GitHub repo, local folder, and various
display names carry "xprohubv3" as a development-time identifier.
The brand is "XProHub" — the v3 is internal-only.

Scope of full rename (~3-4 hours, single dedicated session):
- Apple Developer App ID + new bundle (com.paatatsk.xprohub)
- New provisioning profiles + distribution cert
- New EAS dev build with new bundle
- app.json scheme (xprohubv3:// → xprohub://) ✅ DONE 2026-05-02 (Phase 1)
- Edge Function constants (RETURN_URL, REFRESH_URL in
  create-onboarding-link) ✅ DONE 2026-05-02 (Phase 1)
- GitHub repo rename (xprohub-v3 → xprohub) ✅ DONE 2026-05-02 (Phase 3 partial)
- Local folder rename (C:\Users\sophi\Documents\xprohub-v3 → ...\xprohub)
- Expo project slug in app.json ("slug": "xprohub-v3") — affects EAS project
  identity, treat as Phase 2 alongside bundle ID
- Expo project name in app.json ("name": "xprohub-v3")
- npm package name in package.json + auto-update package-lock.json
- Supabase CLI project_id in supabase/config.toml — verify CLI link survives
  the change before committing
- Supabase project display name (cosmetic, dashboard only)
- Stripe Connect business name (cosmetic)
- Code grep for any xprohubv3 references
- Doc updates (CLAUDE.md path refs, design docs scheme refs, etc.)

**Resolve when:** Before NYC test launch, ideally as a single
focused session with fresh capacity. Not blocking C-4 through C-7
work.

**Decision context:** Discussed and deferred 2026-05-02. Considered
rebuild-as-v4 alternative — rejected as significantly higher cost
than the rename.

---

## Task 5 closure additions (2026-05-11)

### Expo SDK 54.0 patch updates (4 packages)
Surfaced by `expo doctor` warning in EAS build log (build URL
1b91e6d3-d21f-4849-8a9e-26d412d1d593).

Packages out of date (patch versions only):
- expo: 54.0.33 → 54.0.34
- expo-image-picker: 17.0.10 → 17.0.11
- expo-linking: 8.0.11 → 8.0.12
- expo-web-browser: 15.0.10 → 15.0.11

Fix: Run `npx expo install --check`, accept updates. Requires
EAS rebuild to pick up new versions in iOS bundle.

### Cloudflare Email Routing for hello@xprohub.com
Placeholder index.html references mailto:hello@xprohub.com but
the address doesn't route. Set up forwarding via Cloudflare
Email Routing → Paata's Gmail.

### Workers subdomain stub cleanup
Audit logs showed "Create Subdomain workers 13m ago" when we
accidentally went through the Workers wizard before finding
Pages. Likely created an empty Workers subdomain. Investigate
if it's safe to delete (probably yes, but verify doesn't break
Pages routing).
