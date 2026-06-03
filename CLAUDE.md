# XProHub — CLAUDE.md
> Single source of truth. Read this at the start of every session.

## Who I Am
**Paata** — non-technical founder, zero prior coding experience. Building with Claude AI session by session since March 2026. GitHub: `paatatskhadia`. My job is vision + product decisions; Claude writes the code.

## Project Overview
**XProHub** — platform for X (various) professionals. Every user is both customer and worker. No permanent role assignment.
- Mission: Economic empowerment for everyday people regardless of background
- Tagline: **"Real Work. Fair Pay. For Everyone."**
- Model: eBay buyer/seller dual-role (users freely switch Customer ↔ Worker)
- Repo: `github.com/paatatsk/xprohub` | Local: `C:\Users\sophi\Documents\xprohub-v3`
- Start: `npx expo start --clear` | Test: iPhone via EAS dev client

---
**Binding product tenet:** `docs/XPROHUB_DOCTRINE.md` — the north star. Four entries, one spine, the Placement Law. Every layout, feature, and polish decision is tested against it.
**Core infrastructure:** `docs/TAXONOMY_SPEC.md` — the category taxonomy (Category→Task→Skill) is the matching substrate; tier is classification-not-gate; `requires_background_check`/`requires_verification` are reserved safety columns (unenforced).
**Financial data:** `docs/FINANCIAL_DATA_PRINCIPLE.md` — XProHub stores/shows only transaction record (amounts, fees, payouts, dates, in/out), never bank/card/routing/balance; link to Stripe when sensitive detail is needed.
**Quality signal:** `docs/RULING_01_ENDORSE_ONLY.md` — binary endorse/concern only, no star ratings anywhere. Star system removed; do not reintroduce.
**Safety exclusion:** `docs/SAFETY_SPEC_EXCLUDED_CATEGORIES.md` — Child Care + Elder Care excluded from v1; is_active = false; must not re-enable without identity verification + background checks + manual vetting per the spec.

**See also (for full project orientation):**
- `SESSION_HANDOUT.md` — full chat-AI orientation, working preferences, philosophy
- `SESSION_PLAN_v2.md` — milestone roadmap and active build order
- `POLISH_PASS.md` — deferred items, parked explorations, v1.1 idea queue

For current commit state: `git log --oneline -10`
---

## The Load-Bearing Principle

The interface serves the person, not the other way around. Anyone capable of doing the work should be able to use the app without interface friction getting in the way.

Every design and engineering choice gets judged against one question: **Is this easier for the user, or harder?**

- Icons must be recognizable in 2 seconds
- Plain language outranks clever language
- Error messages get plain language at the source
- Empty states explain themselves
- Accessibility labels are mandatory on every interactive element
- Cognitive load matters more than tap count

Approved into operating norms 2026-05-24.

## Orchestra

Four players, one product. Paata mediates all communication.

| Role | Who | What they do |
|---|---|---|
| **Conductor / Founder** | Paata | Vision, product decisions, hardware verification, final calls on everything |
| **Strategist / Reviewer** | Maestro (chat-Claude) | Strategy, framing, prompt drafting, decision architecture, honest critique |
| **Builder** | Claude Code (terminal) | Engineering, full repo access, code reviews, builds, deploys |
| **Designer** | Claude Design (claude.ai/design) | UI/UX mockups, design system, copy contracts, handoff packages |

**Honest pushback norm**: Any player can push back on any other, including on Paata. The brief is provisional — "build something mature, not defend something half-formed."

## Operating Norms

- **No corners cut** on production code
- **Hardware verification mandatory** before commit — the device tells the truth
- **Subtractions before additions** on screen refinements
- **One screen at a time** in the refinement queue
- **Schema changes get migration design review** before SQL runs on Supabase
- **Cheap exploration first** (Paata + Grok/Gemini), expensive refinement second (Claude Design)
- **Work tiers for Claude Code**: A (fully autonomous), B (surface diff for review), C (Paata in loop at each step)

## Lighthouse Standard

What "lighthouse-quality" means for a screen:
- Real data from Supabase, no stubs
- Five-voice typography wired (Space Grotesk / Inter / Playfair / Oswald / IBM Plex Mono)
- User-tested copy (plain language, no jargon, dignified)
- Hardware-verified on iPhone in real conditions
- Dignified empty states (no raw nulls, no "undefined", editorial fallbacks)
- Editorial moments where they earn their place (e.g. worker name in Playfair italic on Receipt)
- Accessibility labels on all interactive elements
- Network errors wrapped with plain-language messages

**Screens at lighthouse standard:** Receipt, Home. All others are functional but unrefined.

---

## Platform Architecture (Locked)

### Dual-Role Model
Every user is both customer and worker. No role fork at sign-up. No permanent role assignment. The duality is the brand-layer story (Welcome, masthead, About) but NOT the UX-organizing principle for every screen. Most users live in one mode at a time.

Two Stripe objects serve the two transaction directions:
- **Stripe Express account** — for receiving payment after completing a job. Set up via `stripe-connect.tsx`.
- **Customer payment method** — for funding escrow when posting a job. Set up via `payment-setup.tsx`.

### Gate Philosophy
Gates fire at moment of action only. No persistent banners or nags.

### Gate Specifications

| Action | ID Gate | Stripe Gate | Notes |
|---|---|---|---|
| Sign up | — | Offered, skippable | Express account offered but not required |
| Browse Live Market | — | — | Fully open to all signed-in users |
| Post a job | — | Customer payment method | Checks payment method on file |
| Apply for a job | Required: photo + >=1 skill | Required: stripe_charges_enabled | ID check fires first; both must pass |
| Chat | — | — | Opens after hire; both parties already cleared |
| Hire / acceptance | — | — | Triggers charge; both sides verified |

### Action Continuity
Completing a gate returns the user to exactly the screen they came from. Never drop on Home.

### Hire Moment = Charge Moment
Customer is charged at hire. Funds held in escrow. Worker confirmed paid before work begins. **Worker Dignity** — non-negotiable.

### Professional Identity (`id.tsx`)
Photo + >=1 skill claim = the apply-gate minimum. 4-step wizard: photo, category picker, task selector, superpowers (top 3 featured skills).

---

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | React Native + Expo Router + TypeScript (SDK 54) |
| Backend | Supabase — PostgreSQL, Auth, Realtime, Storage, PostGIS |
| Payments | Stripe Connect (escrow model, 10% platform fee — locked) |
| Push | Expo Push Notifications (not implemented in v1) |
| Est. cost | $0/month until real traction |

## Design System — Dark Gold (Locked)

### Color Tokens
| Token | Value | Use |
|---|---|---|
| Background | `#0E0E0F` | All screens — never changes |
| Gold | `#C9A84C` | CTAs, highlights, big numbers, borders |
| Card | `#171719` | All cards and surfaces |
| Border | `#2E2E33` | Card borders, dividers |
| Text Primary | `#FFFFFF` | All headings and body text |
| Text Secondary | `#888890` | Supporting text, metadata |
| Green | `#4CAF7A` | Success, completions |
| Blue | `#4A9EDB` | Trust, verification, info |
| Purple | `#9B6EE8` | XP, growth |
| Red | `#E05252` | Urgent, alerts, cancel |
| Amber | `#E5901A` | In-progress, soft warnings |

### Five-Voice Typography System
| Voice | Font | Use |
|---|---|---|
| Headings | Space Grotesk (500/600/700) | Screen titles, hero numbers (tabular figures) |
| Body | Inter (400/500) | All body text, form inputs, descriptions |
| Serif accent | Playfair Display (700/700 italic) | Worker names on Receipt, editorial quotes |
| Editorial labels | Oswald (600/700) | Section labels, eyebrows, buttons (4px tracked) |
| Ledger voice | IBM Plex Mono (400/500) | Dates, trace IDs, money metadata — the accounting register |

- **Big numbers**: always gold — the loudest element on every screen
- **Cards**: dark background (`#171719`), 1px border, square corners on category tiles (editorial register), soft corners on content cards
- **Icons**: Currently native emoji. Gold Forge custom icon system under exploration (not shipped).

### Locked Editorial Moments
- Worker name in Playfair italic on Receipt — reverence, not decoration
- `completion_verb_phrase` per category — "Maria cleaned your home in Brooklyn"
- Binary endorsement (ENDORSE THIS WORK / Raise a concern) — no star ratings
- Reconciliation line on Receipt — "You paid $155.00 · Maria received $139.50"
- Footer ticker — "REAL WORK · FAIR PAY · FOR EVERYONE"

---

## Production Screens

### Reachable screens (registered in tab layout or routed to)
| Screen | File | Status |
|---|---|---|
| Splash | `app/splash.tsx` | Functional |
| Welcome | `app/(onboarding)/welcome.tsx` | Functional (editorial treatment, not yet lighthouse) |
| Sign Up | `app/(auth)/signup.tsx` | Functional — wired to Supabase Auth |
| Login | `app/(auth)/login.tsx` | Functional — Face ID support |
| Forgot Password | `app/(auth)/forgot-password.tsx` | Functional |
| Profile Setup | `app/(onboarding)/profile-setup.tsx` | Functional — captures full_name + first_name + photo |
| Worker ID Setup | `app/(onboarding)/id.tsx` | Functional — 4-step wizard (768 lines) |
| Verify Level 2 | `app/(onboarding)/verify-level-2.tsx` | Functional — trust level gate (real verification deferred) |
| Home | `app/(tabs)/index.tsx` | **Lighthouse** — YOUR DESK card, last receipt link, category grid |
| Live Market | `app/(tabs)/market.tsx` | Functional — Jobs Feed + Workers Feed (896 lines) |
| Post a Job | `app/(tabs)/post.tsx` | Functional — category picker + form (728 lines) |
| Job Detail | `app/(tabs)/job-detail.tsx` | Functional — full job info + apply CTA (525 lines) |
| Apply | `app/(tabs)/apply.tsx` | Functional — templates + price + gates (679 lines) |
| Apply Success | `app/(tabs)/apply-success.tsx` | Functional — forward-only confirmation |
| My Jobs | `app/(tabs)/my-jobs.tsx` | Functional — customer's posted jobs |
| My Applications | `app/(tabs)/my-applications.tsx` | Functional — worker's bid history |
| Job Bids | `app/(tabs)/job-bids.tsx` | Functional — accept/decline + hire-and-charge |
| Direct Hire | `app/(tabs)/direct-hire.tsx` | Functional — bypasses bidding |
| Job Chat | `app/(tabs)/job-chat.tsx` | Functional — Realtime + lifecycle CTAs (784 lines) |
| Review | `app/(tabs)/review.tsx` | Functional — bidirectional rating + comment |
| Report | `app/(tabs)/report.tsx` | Functional — multi-reason + optional block |
| Account | `app/(tabs)/account.tsx` | Functional — legal, blocked users, sign out, delete account |
| Payment Setup | `app/(tabs)/payment-setup.tsx` | Functional — Stripe PaymentSheet |
| Stripe Connect | `app/(tabs)/stripe-connect.tsx` | Functional — 4-state Express onboarding |
| Receipt | `app/job/[id]/receipt.tsx` | **Lighthouse** — real Supabase data, endorsements, five-voice typography |

### Unreachable stubs (files exist, not registered in tab layout)
`chat.tsx`, `earnings.tsx`, `profile.tsx`, `notifications.tsx`, `payment.tsx`, `match.tsx` — all unregistered by G-7 stub cleanup. No user can navigate to them.

Home = YOUR DESK hub. Last receipt → Receipt. Jobs I've posted → My Jobs. My applications → My Applications. Category card → Live Market filtered by category_id.

## Supabase — Tables (Live)
`profiles` · `task_categories` · `task_library` · `worker_skills` · `job_post_tasks` · `jobs` · `bids` · `chats` · `messages` · `payments` · `reviews` · `xp_transactions` · `badges` · `notifications` · `user_badges` · `reports` · `user_blocks` · `endorsements`

- `task_code` format: `CCTT` e.g. `0101` = category 01, task 01
- `worker_skills.is_featured` = worker's top 3 "Superpowers" shown on their profile card
- `profiles.first_name` = user-owned display name for receipts and greetings (added 2026-05-25)
- `task_library.completion_verb_phrase` = ops-owned past-tense verb phrase per category (added 2026-05-25)
- Seed file: `supabase/seed/XProHub_TaskLibrary_Seed_v1.1.sql` — deployed 2026-04-17 (20 categories · 188 tasks)
- Realtime on: `jobs`, `messages`, `notifications`
- Core schema: `C:\Users\sophi\Desktop\CLAUDE-DOC\xprohub_schema.sql`

## Database Schema — Core Tables

### task_categories
| Column | Type | Notes |
|---|---|---|
| id | SMALLINT PK | 1–20 |
| name | TEXT | Display name |
| icon_slug | TEXT | e.g. `home-cleaning` |
| tier | SMALLINT | 1 = standard, 2 = skilled/premium |
| billing_type | TEXT | `per_job` \| `per_hour` \| `per_visit_day` \| `mixed` |
| price_min | INTEGER | USD — lowest across tasks in category |
| price_max | INTEGER | USD — highest across tasks in category |
| difficulty_range | TEXT | e.g. `Easy → Skilled` |
| requires_background_check | BOOLEAN | Category-level flag |
| sort_order | SMALLINT | Display order |

### task_library
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | Auto |
| task_code | TEXT UNIQUE | Format: CCTT (e.g. `0101`) |
| category_id | SMALLINT FK | → task_categories.id |
| name | TEXT | Task display name |
| description | TEXT | One-sentence description |
| tags | TEXT[] | Searchable keywords |
| price_min | INTEGER | USD — customer-facing estimate |
| price_max | INTEGER | USD — customer-facing estimate |
| est_time_min_hrs | NUMERIC | 0.5 = 30 min; NULL = open-ended |
| est_time_max_hrs | NUMERIC | NULL = overnight or variable |
| difficulty | TEXT | `easy` \| `medium` \| `skilled` |
| billing_type | TEXT | `per_job` \| `per_hour` \| `per_visit_day` |
| completion_verb_phrase | TEXT NOT NULL | Past-tense editorial phrase per category (e.g. "cleaned your home") |
| requires_verification | BOOLEAN | Worker must pass ID verification for this task |
| is_urgent_eligible | BOOLEAN | Appears in Urgent / Same-Day feed |
| is_active | BOOLEAN | Soft-delete — false = hidden from app via RLS |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto-updated via trigger |

### worker_skills
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| user_id | UUID FK | → profiles.id ON DELETE CASCADE |
| task_id | INTEGER FK | → task_library.id |
| years_exp | SMALLINT | Optional |
| is_featured | BOOLEAN | Up to 3 Superpowers per worker |
| created_at | TIMESTAMPTZ | |

### job_post_tasks
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| job_post_id | UUID FK | → jobs.id ON DELETE CASCADE |
| task_id | INTEGER FK | → task_library.id |

### endorsements
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | Auto |
| job_id | UUID FK UNIQUE | → jobs.id. One endorsement per job. |
| endorser_id | UUID FK | → profiles.id (customer) |
| worker_id | UUID FK | → profiles.id (worker) |
| created_at | TIMESTAMPTZ | Immutable — no UPDATE or DELETE policies |

## Key Business Rules

- **Platform fee**: 10% flat, deducted from worker payout. Read from `payments.platform_fee` — never hardcode. Fee percent derived at render: `round((fee / subtotal) * 100)`.
- **Endorsements**: Binary (endorse OR concern). Immutable once cast. Separate tables: `endorsements` for positive, `reports` for concerns. Mutually exclusive at UI level.
- **Difficulty vs Urgency**: `difficulty` describes skill level only (`easy`/`medium`/`skilled`). Urgency is a separate flag (`is_urgent_eligible = true`).
- **Task codes (CCTT)**: 4-character zero-padded string. First 2 = category, last 2 = task within category.
- **Billing types**: `per_job` (fixed), `per_hour` (hourly), `per_visit_day` (per visit/day). Categories use `mixed` when tasks vary.
- **Verification**: `requires_verification = true` means worker must pass ID verification.
- **Pricing**: All `price_min`/`price_max` are in USD. Customer-facing estimates only.
- **Soft deletes**: Never DELETE rows from `task_library`. Set `is_active = false`.
- **Superpowers**: `worker_skills.is_featured` — max 3 per worker.

## Indexes Available

| Index | Table | Column(s) | Notes |
|---|---|---|---|
| `idx_task_library_category` | task_library | category_id | Full category scan |
| `idx_task_library_active` | task_library | category_id WHERE is_active=true | Partial — browse/home screens |
| `idx_task_library_urgent` | task_library | id WHERE is_urgent_eligible=true | Partial — Live Market urgent feed |
| `idx_worker_skills_user` | worker_skills | user_id | Worker profile skill lookup |
| `idx_worker_skills_task` | worker_skills | task_id | Task → which workers offer it |
| `idx_job_post_tasks_job` | job_post_tasks | job_post_id | Job → its required tasks |
| `idx_payments_job` | payments | job_id | Payment lookup by job |
| `idx_endorsements_job` | endorsements | job_id | UNIQUE — one endorsement per job |
| `idx_endorsements_worker` | endorsements | worker_id | Worker's endorsement count |

## Common Query Patterns

```sql
-- All active tasks in a category (browse / home screen)
SELECT * FROM task_library
WHERE category_id = 1 AND is_active = true;

-- A worker's full skill list with Superpower flag
SELECT tl.name, tl.category_id, ws.years_exp, ws.is_featured
FROM worker_skills ws
JOIN task_library tl ON tl.id = ws.task_id
WHERE ws.user_id = '<uuid>';

-- Match workers to a job's required tasks (match score)
SELECT ws.user_id, COUNT(*) AS matched_tasks
FROM job_post_tasks jpt
JOIN worker_skills ws ON ws.task_id = jpt.task_id
WHERE jpt.job_post_id = '<uuid>'
GROUP BY ws.user_id
ORDER BY matched_tasks DESC;

-- All urgent-eligible tasks (Live Market same-day feed)
SELECT * FROM task_library
WHERE is_urgent_eligible = true AND is_active = true;

-- Tasks requiring worker verification
SELECT task_code, name, category_id
FROM task_library
WHERE requires_verification = true AND is_active = true
ORDER BY category_id, task_code;
```

## Migrations
- `20260417000001_replace_skills_with_task_library.sql` — Task Library v1.1 (20 categories, 188 tasks)
- `20260419000001_cleanup_jobs_schema.sql` — Dropped legacy `skills`, `user_skills`, `jobs.skill_id`. Added RLS on `job_post_tasks`.
- `20260419000002_enable_worker_skills_rls.sql` — Public read + auth CRUD on `worker_skills`.
- `20260419000003_chat_insert_policy.sql` — INSERT policy on `chats` for customers.
- `20260421000001_add_trust_level.sql` — Added `trust_level` column to `profiles`.
- `20260424000001_bid_accept_decline_functions.sql` — `accept_bid()` + `decline_bid()` SECURITY DEFINER functions.
- `20260426000001_job_lifecycle_functions.sql` — `mark_in_progress()` + `mark_completed()` SECURITY DEFINER functions.
- `20260428000001_step13_payments_schema.sql` — Stripe columns on `profiles`, `idx_payments_job`, `create_payment_record()`, `release_payment()`, amended `mark_completed()` with payment gate.
- `20260503000001_accept_bid_set_agreed_price.sql` — `accept_bid()` amended to set `jobs.agreed_price = v_bid.proposed_price`.
- `20260512000001_chunk_d1_payment_setup.sql` — Customer payment method flow columns.
- `20260515000001_chunk_e_payout_release.sql` — `confirm_completion()`, `raise_dispute()`, `stripe_charge_id`, `auto_release_at` on payments.
- `20260515000002_release_payment_auto_release.sql` — Amended `release_payment()` for auto-release cron.
- `20260515000003_confirm_completion_function.sql` — `confirm_completion()` SECURITY DEFINER.
- `20260515000004_jobs_status_check.sql` — Jobs status constraint checks.
- `20260516000001_g4_g5_reports_and_blocks.sql` — `reports` + `user_blocks` tables with RLS.
- `20260525000001_add_first_name_to_profiles.sql` — `profiles.first_name` column + backfill from full_name.
- `20260525000002_add_completion_verb_phrase_to_task_library.sql` — `task_library.completion_verb_phrase` with 20 locked phrases.
- `20260525000003_endorsements_table.sql` — `endorsements` table, unique job_id index, immutable RLS.

## Development Conventions

- **Adding a task**: INSERT into `task_library` with `ON CONFLICT (task_code) DO NOTHING`. Never reuse a retired task code.
- **Adding a category**: INSERT into `task_categories` with the next `id` in sequence (currently 1–20). Update `sort_order` if reordering display.
- **Retiring a task**: Set `is_active = false`. RLS hides it automatically. Do not DELETE rows.
- **New migrations**: Place in `supabase/migrations/` with timestamp prefix `YYYYMMDDHHMMSS_description.sql`. Always wrap in `BEGIN`/`COMMIT`.
- **Seed updates**: Changes to task data go in `supabase/seed/`. Use `ON CONFLICT (task_code) DO NOTHING` for inserts or `DO UPDATE SET ...` for corrections.
- **task_code rules**: Always 4 characters, zero-padded. No gaps — if a task is retired, its code is reserved and not reissued.
- **RLS state**: `task_categories` and `task_library` have anon-safe public read policies. `worker_skills` has public read + auth CRUD. `job_post_tasks` has INSERT + SELECT. `endorsements` has party-read + endorser-insert (immutable). `reports` and `user_blocks` have auth CRUD.
- **New table migrations**: Include explicit `GRANT` statements for `anon`, `authenticated`, and `service_role` (Supabase Data API change, enforced 2026-10-30).
- **Shared formatters**: `lib/format.ts` — fmtCents, fmtPrice, fmtDateStamp, fmtDuration, fmtDayDate, fmtShortDate, fmtReceiptDate, toCents. All dates forced to en-US locale.
- **Support constants**: `lib/legal.ts` — PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL, SUPPORT_EMAIL.

## Progressive Profile Gates

### EXPLORER (Level 1 — Browse Only, default for all new users)
- Required: full name, email, profile photo (optional)
- Can do: browse Live Market feed, browse Worker business cards, filter by category
- Cannot do: apply for jobs, post jobs, message anyone, transact

### APPLY GATE (worker side — triggered when worker taps Apply on any job)
- Required: profile photo + >=1 skill category claimed + Stripe Express (`stripe_charges_enabled = true`)
- ID check fires first; Stripe check second — both must pass before apply form loads
- On gate fire: routes to `id.tsx` (profile) or `stripe-connect.tsx` (payouts); returns to the specific job on completion

### POST GATE (customer side — triggered when customer taps Post a Job)
- Required: customer payment method on file
- On gate fire: routes to `payment-setup.tsx`; returns to post flow on completion

### KEY RULE
Gates fire at moment of action only. Never force payment or identity setup upfront. Stripe handles all banking data — never store financial info directly.

## Matching Algorithm
Location 25% · Skill Match 35% · Experience 20% · Behavioral 20%

## LIVE MARKET — Navigation Model (Locked)

Live Market is the heartbeat of XProHub.

### Entry points
- Category card tap on Home → /live-market?category_id=X (filtered)
- YOUR DESK links → My Jobs / My Applications

### Structure
- Two-feed toggle: Jobs Feed (default) | Workers Feed
- Jobs Feed = pulled from `jobs` table, sorted by recency
- Workers Feed = pulled from `profiles` + `worker_skills`, acts as a business card wall
- Category filter powered by `task_categories` (20 rows)

### Gate triggers
Explorer users browse freely. Gate fires only at:
- Tap "+ Post a Job" → customer payment gate → Post a Job flow
- Tap "Apply" on job card → ID gate then Stripe gate → Apply flow

## Code Rules
1. **Design system** — Dark Gold only: `#0E0E0F` bg, `#C9A84C` gold, `#171719` cards
2. **SafeAreaView** — import from `react-native-safe-area-context` ONLY (not `react-native` — SDK 54 breaking change)
3. **New files** — always `app/filename.tsx`, NEVER `app/app/filename.tsx` (causes Unmatched Route)
4. **Live Market is primary nav** — flat Expo Router `router.push()` is the pattern
5. **No pure white** — use background color from chosen design system
6. **Every screen answers one question** — no feature creep per screen
7. **No mock data in production** — connect to Supabase or gate the screen
8. **Two core loops**: Customer = 3 taps to done · Worker = 2 taps to earn
9. **Plan Mode** (`Shift+Tab`) before multi-file changes
10. **Windows PowerShell** cannot handle `(tabs)` in paths — use File Explorer for those folders
11. **app.json assets**: splash = `splash-icon.png`, Android icon = `adaptive-icon.png`
12. **Dual-role** — no role-specific screen patterns. Any transactional screen must work for any user regardless of which side they're acting on.
13. **Gate philosophy** — gates fire at moment of action only. No persistent banners, no nags.
14. **fontFamily** — always use exact export names (`Inter_400Regular`, not `Inter`). `Fonts.body` from `constants/theme.ts` resolves correctly.
15. **Auth guard** — denylist pattern in `_layout.tsx`. Only redirect FROM auth/onboarding screens when authenticated. Any other route is valid.

## What Is Built

### ✅ Milestone 1 — Foundation & Auth (complete)
- Supabase schema, RLS policies, PostGIS, Realtime on jobs/messages/notifications
- Auth flow: signup + login + forgot-password + Face ID wired to Supabase Auth
- Profile setup with photo upload + first_name capture
- Welcome screen — masthead, ticker bar, Playfair Display tagline, yin-yang boxes, BUILT FOR TRUST strip
- Progressive gates: Explorer → gates fire at moment of action
- 20 task categories with emoji icons, 188 tasks (seed deployed 2026-04-17)

### ✅ Milestone 2 — The Live Loop (complete)
- Live Market two-feed toggle: JOBS feed + WORKERS feed, both wired to Supabase
- Post a Job: category-first picker, task picker, submit wired to DB
- Apply flow: Job Detail → smart templates + price + gates → apply-success
- Hire Directly v2: full job form parity, targeted at specific worker
- Become a Worker onboarding (4-step wizard)
- Back navigation header on all tab screens

### ✅ Milestone 3 — Transactions (complete)
- `accept_bid()` + `decline_bid()` with atomic auto-decline cascade
- My Jobs + My Applications dashboards
- Real Chat UI — Supabase Realtime message thread
- Job lifecycle CTAs — Mark In Progress / Mark Complete / Confirm Completion
- Review flow — bidirectional rating + comment
- Payment flow — all chunks (A through E) complete. Full Stripe Connect pipeline: customer payment method setup, hire-and-charge, escrow hold, payout release, auto-release cron (Cloudflare Worker, 72-hour timer), dispute path, transfer.created webhook backup. 8 Edge Functions deployed.

### ✅ Chunk G — Launch Compliance (8 of 9 complete)
- G-1: Account deletion — Edge Function + UI, money-state blocker, verified on iPhone
- G-2: Privacy Policy link — wired in signup.tsx + account.tsx (URL pending legal copy)
- G-3: Terms of Service link — wired in signup.tsx + account.tsx (URL pending legal copy)
- G-4: User reporting — tables, migration, report.tsx UI, overflow menus on market/job-detail/job-chat
- G-5: User blocking — tables, migration, client-side feed filtering, blocked users management in account.tsx
- G-6: Content moderation — locked: reactive-only for v1 (report-driven, 24-hour SLA)
- G-7: Stub screen cleanup — 6 stubs unregistered from tab layout
- G-8: Privacy nutrition labels — declarations finalized for App Store Connect
- G-9: Pre-submission checklist — audit complete (2026-05-25), code-side items done, user-side items pending

### ✅ Milestone 4 — Lighthouse Screens (Receipt + Home)
- Receipt screen: real Supabase data (jobs + payments + profiles + tasks + endorsements), five-voice typography, worker verb phrase, binary endorsement, 10% fee from DB, runtime money invariant checks
- Home v1 refinement: YOUR DESK card with last receipt link, category grid with square corners, Oswald section labels, SpaceGrotesk tabular prices, no dual CTAs
- Token discipline batch: `Colors.amber` added, Belt dead code removed, hardcoded values replaced
- Polish batch: network error UX (9 locations), fontFamily wiring (19 screens, 107 styles), accessibility labels (8 elements), auth guard denylist refactor

### Design
- Dark Gold theme locked
- Five-voice typography system: Space Grotesk + Inter + Playfair Display + Oswald + IBM Plex Mono
- Inter loaded globally in `_layout.tsx`; receipt-specific fonts loaded locally
- `constants/theme.ts`: Colors, Fonts, Spacing, Radius exports
- `lib/format.ts`: shared date/money/duration formatters

## What Is NOT Built Yet

### 🔲 Milestone 5 — Lighthouse Refinement (next phase)
Each remaining screen refined to lighthouse standard before submission. Order TBD with Claude Design. See `SESSION_PLAN_v2.md` for the full queue.

### 🔲 Submission Items (user-side)
- Privacy Policy + Terms of Service legal copy deployed to xprohub.com
- App Store Connect metadata (screenshots, description, privacy labels)
- Demo account for Apple reviewer
- `hello@xprohub.com` routing verified
- Stripe webhook event subscription verified (5 events)

### 🔲 Deferred to v1.1
See `POLISH_PASS.md` for the full idea queue. Includes: mode-aware Home redesign, worker view of Receipt, PDF receipt export, notifications system, photo viewer modal, Gold Forge icon system, i18n infrastructure, theming variants, worker-view verb phrasing variants (current locked phrases work for customer view but read awkwardly on worker view — needs Claude Design copy contract review).

## Session Start Checklist
- [ ] `npx expo start --clear`
- [ ] Open EAS dev client on iPhone → scan QR
- [ ] `git status` — check what changed last session
- [ ] State what screen/feature we're working on today
- [ ] Connect to Supabase before building new screens
