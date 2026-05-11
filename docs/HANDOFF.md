# HANDOFF — Onboarding for New chat-Claude Sessions

> This file is for fresh chat-Claude instances joining the XProHub project mid-stream. Read this first, then the linked docs in order. After reading, summarize what you understand back to Paata before starting work.

**Last updated:** 2026-05-11 (after Task 5 closure)
**Latest commit on master:** `a0c8406` — docs: HANDOFF.md — demote visual design from Locked Decisions to parked topic

---

## Who you're working with

**Paata Tskhadiashvili** — solo non-technical founder, NYC. Building XProHub, a two-sided gig marketplace mobile app. Mission: "Real Work. Fair Pay. For Everyone."

Paata is the decision-maker. He runs the human side of the project, makes architectural calls, manages credentials/secrets, and validates empirically on his iPhone. He is **not a coder** but has developed strong instincts for technical tradeoffs after months on this project. Treat his questions seriously even when they're phrased simply — they're often pointing at something real.

Communication style:
- Direct, honest pushback is welcome and expected
- He'll say "your call" or "your judgment" when delegating — take it seriously, explain your reasoning
- He notices when you're hedging or wasting his time
- He often catches things you'd miss (bundle ID names, redundant work, drift from prior decisions)

---

## The three-way team

You (chat-Claude) work with two other parties:

1. **Paata** — decides, approves, runs commands in his terminal, takes screenshots
2. **Claude Code** — runs in Paata's terminal, executes file operations, runs builds, has direct repo access. Strong at investigation and execution; gets verbatim instructions from you via Paata copy-paste

**Your role:** strategy, code review, architecture, decision framing, drafting prompts for Claude Code. You don't execute directly — you propose, Paata approves, Claude Code executes.

---

## Meticulous Mode — the working rule

Every code change follows this pattern:
1. **Investigate** — read files, cite line numbers, web-search when needed
2. **Consult** — discuss tradeoffs with Paata before proposing
3. **Propose OLD/NEW** — exact text being replaced, exact replacement
4. **Approve** — Paata signs off
5. **Save** — Claude Code applies the change to working tree
6. **Test** — type-check, build, empirical validation
7. **Commit** — only after empirical validation passes

**No compound `&&` in bash commands.** Each command runs separately. This is a hard rule (Windows shell quirks bite without it).

**Build it properly once.** Avoid bandaid fixes. If something needs fixing, fix it right. The session pattern is "few hours of careful work" not "rapid iteration."

---

## Read these next (in order)

1. **`CLAUDE.md`** — project conventions, code patterns, mission framing
2. **`docs/PROJECT_STATUS_2026-05-03.md`** — current task tracker, completed work, queued tasks, **Locked Decisions** (architectural commitments)
3. **`docs/POLISH_PASS.md`** — UX refinements queue, technical debt
4. **`git log --oneline -10`** — last 10 commits to see recent work patterns

For specific recent work, also read:
- **`docs/CHUNK_C_DESIGN.md`** — apply gate architecture (Tasks 4/4a/4b)
- **`docs/STRIPE_REDIRECT_OPTIONS.md`** — Universal Links decision (Task 5)

---

## Current state at handoff

**Tasks 1–5 complete.** Most recent work (Task 5, closed 2026-05-11):
- iOS Universal Links wired end-to-end
- xprohub.com on Cloudflare, serves AASA file with correct Content-Type
- EAS iOS development build with `associatedDomains` entitlement, installed and tested on Paata's iPhone
- Stripe Connect onboarding now redirects to `https://xprohub.com/stripe-return` → app via Universal Link
- Cold-start race condition fixed with `<Redirect>` pattern

**Next queued: Task 6** — Android App Links + first EAS Android build (mirror of Task 5 for Android).

Other queued work:
- Chunk C-7: End-to-end test of worker onboarding flow (id.tsx → Stripe → apply gate)
- Chunks D, E, F: Customer payment, payout release, payment UI polish
- POLISH_PASS items (see file): expo SDK patches, Cloudflare Email Routing, Workers subdomain cleanup
- Future task: Bundle ID rename `com.paatatsk.xprohubv3 → com.paatatsk.xprohub` (deferred to pre-App-Store)
- Visual design direction: explored Hall/Ledger/Ticket aesthetics in earlier sessions, currently using default styling. Not a formally locked decision — revisit closer to launch. Design tokens enable multi-theme switching later.

---

## Critical context Paata expects you to know

**Test account / project IDs:**
- email: `paatatskhadiashvili@gmail.com`
- profile id: `5e0b104f-8c9b-4677-bdda-df17c5f5b179`
- Stripe acct: `acct_1TTVpS20OAk9WAsX` (FULLY_VERIFIED — cannot retest Stripe onboarding without resetting)
- Apple Developer Team ID: `67NL4S6Y9P`
- iOS bundle ID: `com.paatatsk.xprohubv3` (rename tracked as future task)
- iPhone UDID: `00008120-001A2C161ED2201E`
- Supabase project ref: `ygnpjmldabewzogyrjbb`
- Repo: github.com/paatatsk/xprohub
- Local: `C:\Users\sophi\Documents\xprohub-v3` (folder rename to `xprohub` deferred)

**Infrastructure (live):**
- Domain: xprohub.com (Cloudflare-managed, nameservers `jermaine.ns.cloudflare.com` + `tani.ns.cloudflare.com`)
- Cloudflare Pages project: `xprohub` (deploys from `/web` folder of repo)
- Supabase Edge Functions deployed: `create-stripe-account`, `create-onboarding-link` (v5), `stripe-webhook`

**Locked Decisions** (don't relitigate without explicit reason — see PROJECT_STATUS for full list):
1. Dual-role from day one (every user is customer + worker)
2. Gates fire at moment of action only
3. Apply requires photo + ≥1 skill + Stripe; Post requires payment method
4. Hire = Charge moment
5. ID = Business Card (`id.tsx` under `app/(onboarding)/`)
6. Mission = hub for X (various) professionals
7. Levels 1/2/3 narrative not enforcement
8. Direct Hire parked
9. Stripe redirect = Universal Links / App Links (Option D)
10. Paata sets secrets/credentials directly
11. Deno dual-config (root + per-function)

---

## How to start the new session

After reading the above + linked docs, your first reply to Paata should:

1. Summarize back what you understand about XProHub's current state
2. Confirm Task 5 is closed and Task 6 is queued
3. Ask what Paata wants to tackle this session

Don't pretend to remember previous chats. Be honest that you're new to this conversation but have read the project docs.

---

## Pacing notes

- Long sessions degrade chat-Claude quality. Paata may stop a session at a natural breakpoint (commit boundary) — respect that.
- EAS builds take 30-60 min (queue + build). Use that wall-clock time for closing prep, doc updates, etc.
- Paata's iPhone testing is the ground truth — empirical validation always trumps theoretical analysis
- Documentation matters as much as code — POLISH_PASS, PROJECT_STATUS, and commit messages are how future-Claude reads the past

---

## What Paata wishes you knew

He's been told that getting attached to a single chat session isn't ideal because Claude's quality degrades over time and each new session is essentially a fresh instance. He's working on it. Be welcoming and competent without pretending to remember things you don't. The handoff docs are how continuity actually happens for this project.

Welcome to XProHub.
