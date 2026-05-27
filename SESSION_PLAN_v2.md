# XProHub — Session Plan v2

**Last updated:** 2026-05-25 (post Lighthouse Screens + Polish Batch)

This document tracks the build sequence for XProHub. It supersedes any earlier
session plan documents.

---

## North Star

**Tagline:** Real Work. Fair Pay. For Everyone.

**Mission:** Economic empowerment and dignified income for working-class workers
through a marketplace that treats their time as a valuable resource.

**MVP Definition:** A two-sided marketplace where customers can post jobs, workers
can apply, customers can accept and chat with matched workers, and money can flow
through escrow safely. All locked product architecture decisions in CLAUDE.md
must be respected.

**The Load-Bearing Principle:** The interface serves the person, not the other
way around. Every design and engineering choice gets judged against: is this
easier for the user, or harder? See CLAUDE.md for the full principle.

---

## Milestones

### ✅ Milestone 0 — Foundation Reset (Apr 17-19)
Cleared legacy schema, established `xprohub-v3`, locked CLAUDE.md preferences,
deployed Welcome screen, smart auth routing.

### ✅ Milestone 1 — Foundation & Auth (Apr 19-21)
Profile setup, photo upload, smart auth routing in `_layout.tsx`, Trust System
locked into CLAUDE.md, 20 task categories with emoji icons in Supabase.

### ✅ Milestone 2 — The Live Loop (Apr 21-25)
12 steps: Home routing, back navigation, Live Market two-feed toggle, Post a Job
(category-first picker), Apply flow (smart templates + price gates), Workers Feed,
Become a Worker onboarding, Direct Hire v2.

### ✅ Milestone 3 — Transactions (complete May 15)
- Step 8: Bid acceptance (Postgres functions + My Jobs + Job Bids)
- Step 9: My Applications worker dashboard
- Step 10: Real Chat UI (Supabase Realtime)
- Step 11: Job lifecycle CTAs (Mark In Progress / Mark Complete / Confirm Completion)
- Step 12: Review flow (bidirectional rating + comment)
- Step 13: Full Stripe Connect pipeline — customer payment setup, hire-and-charge,
  escrow hold, payout release, auto-release cron (72hr), dispute path, webhooks.
  8 Edge Functions + Cloudflare Worker deployed.

### ✅ Chunk G — Launch Compliance (8 of 9 complete, May 22)
- G-1: Account deletion (Edge Function + UI + money-state blocker)
- G-2/G-3: Privacy Policy + ToS links wired (URLs pending legal copy)
- G-4: User reporting (4 surfaces)
- G-5: User blocking (feed filtering + management UI)
- G-6: Content moderation locked (reactive-only for v1)
- G-7: Stub screen cleanup (6 stubs unregistered)
- G-8: Privacy nutrition labels finalized
- G-9: Pre-submission checklist — code-side audit complete, user-side items pending

### ✅ Milestone 4 — Lighthouse Screens (May 22-25)
- Receipt screen: first Claude Design handoff, real Supabase data, five-voice
  typography, endorsements, 10% fee from DB, worker verb phrases
- Home v1 refinement: YOUR DESK card, last receipt deep-link, square category
  tiles, Oswald labels, SpaceGrotesk tabular prices, zero CTAs
- Token discipline: `Colors.amber`, Belt dead code removal, hardcoded values replaced
- Polish batch: network error UX (9 locations), fontFamily wiring (19 screens),
  accessibility labels (8 elements), auth guard denylist refactor
- Schema additions: `profiles.first_name`, `task_library.completion_verb_phrase`,
  `endorsements` table (3 new migrations)

### 🟡 Milestone 5 — Lighthouse Refinement (current phase)

Each remaining screen refined to lighthouse standard before submission.
Per-screen process: subtraction first → design pass (Claude Design) →
engineering pass (Claude Code) → hardware verification → commit.

Each refinement gets its own thesis matching the screen's role in the product.

**Cross-cutting refinements** — these touch multiple screens, not single ones.
Scope and direction to be set with Claude Design when he returns. Treated as
v1 refinement work, not v1.1 polish — they affect daily experience for the people using this app
and need to land before submission.

1. **Back button improvement (all screens)** — current "‹" chevron lacks
   consistency and presence. Tap target, position, styling all in scope.
   Likely needs a shared back-affordance component.
2. **Menu / Settings expansion** — current gear icon leads to thin Account
   screen. Richer menu structure needed (settings, profile, preferences,
   legal, account management). May warrant a dedicated Settings hub.
3. **Profile / ID setup refinement** — both profile-setup.tsx and id.tsx
   (768-line 4-step wizard) in scope. Principle-test the length, clarity,
   and visual register. Elevated as priority within per-screen queue.
4. **Live Market lighthouse refinement** — heaviest-used worker-side
   surface, deserves full lighthouse pass. Already in per-screen queue
   as second priority after Welcome.
5. **User identifier / signed-in account orientation** — no persistent
   indicator of which account is signed in. Real friction for
   multi-account testing and device-sharing. Surface location, visual
   treatment, and persistence all in scope — likely a small avatar+name
   badge somewhere persistent.

Each gets its own thesis when Claude Design returns. Don't predict the
solutions — log the problems clearly.

**Per-screen refinement queue** (order to be set with Claude Design when he returns):
- Welcome (partially editorial already, next in queue)
- Live Market (heaviest used worker-side surface)
- Job Detail
- Post a Job
- Apply / Apply Success
- My Jobs / My Applications
- Job Chat
- Review
- Account
- Onboarding (signup, login, profile-setup, id, stripe-connect, verify-level-2)

### 🔲 Submission (after Milestone 5)
Submission is treated as a gate rather than a milestone — it's the process of releasing what's already built, not new build work.

- Legal copy deployed (Privacy Policy + Terms of Service)
- App Store Connect metadata (screenshots, description, keywords, privacy labels)
- Demo account with test data for Apple reviewer
- EAS production build + TestFlight QA
- App Store submission

### 🔲 Milestone 6 — Post-Launch Enhancements
- Notifications system (per v1.1 idea queue)
- Background check integration for high-trust categories
- Advanced matching signals
- Worker view of Receipt
- PDF receipt export
- See POLISH_PASS.md for full idea queue

### 🔲 Milestone 7+ — Scale (long-term)
- Hybrid Matching (instant-dispatch + market density UX)
- Squad / Team Jobs
- Mode-aware Home redesign (composer, Tonight card, liquidity, role switcher)

---

## Build Discipline

- One step at a time
- Investigation → proposal → chunked review → approve → save → commit → test
- All schema changes via migration files in `supabase/migrations/`
- All migrations include verification queries and get design review before SQL runs
- iPhone testing with real accounts after every step
- Polish items NEVER block step progression — they go in POLISH_PASS.md
- The user question gets asked before anything ships

---

## What This Plan Does NOT Cover

By explicit choice:
- Worker availability calendar — too early, no signal
- Geolocation matching — post-launch at earliest
- Squad/Team jobs — post-launch (deferred from earlier docs)
- Hybrid Matching ecosystem — see POLISH_PASS.md for critique
- Push notifications — post-launch
- i18n / multi-language — post-launch
- Theming variants (Hall/Ledger/Ticket) — post-launch

These are real ideas with real merit. They are NOT next.
