# XProHub — CLAUDE.md
> Single source of truth. Read this at the start of every session.

## Who I Am
**Paata** — non-technical founder, zero prior coding experience. Building with Claude AI session by session since March 2026. GitHub: `paatatskhadia`. My job is vision + product decisions; Claude writes the code.

## Project Overview
**XProHub** — two-sided gig economy marketplace. Workers earn. Customers get things done.
- Mission: Economic empowerment for everyday people regardless of background
- Tagline: **"Real Work. Fair Pay. For Everyone."**
- Model: eBay buyer/seller dual-role (users freely switch Customer ↔ Worker)
- Repo: `github.com/paatatsk/xprohub` | Local: `C:\Users\sophi\Documents\xprohub`
- Start: `npx expo start --clear` | Test: iPhone via Expo Go

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | React Native + Expo Router + TypeScript (SDK 54) |
| Backend | Supabase — PostgreSQL, Auth, Realtime, Storage, PostGIS |
| Payments | Stripe Connect (escrow model, 10% platform fee) |
| Push | Expo Push Notifications |
| Est. cost | $0/month until real traction |

## Design System — Dark Gold (Locked)
The only design direction. No other aesthetic is in use.

| Token | Value | Use |
|---|---|---|
| Background | `#0E0E0F` | All screens — never changes |
| Gold Accent | `#C9A84C` | CTAs, highlights, big numbers, borders |
| Dark Card | `#171719` | All cards and surfaces |
| Border | `#2E2E33` | Card borders, dividers |
| Text Primary | `#FFFFFF` | All headings and body text |
| Text Secondary | `#888890` | Supporting text, metadata |
| Green | `#4CAF7A` | Success, completions, Worker mode |
| Blue | `#4A9EDB` | Trust, verification, info |
| Purple | `#9B6EE8` | XP, growth, Royal theme |
| Red | `#E05252` | Urgent, live, alerts, cancel |

- **Heading font**: Space Grotesk Bold or Plus Jakarta Sans ExtraBold
- **Body font**: Inter
- **Big numbers**: always gold — the loudest element on every screen
- **Cards**: glassmorphism — frosted glass effect, gold border glow, photo/illustration fills top 50%, gradient fade into dark info panel below
- **Icons**: Gold Forge custom duotone system — dark base + gold accent highlight, one gold light-source catch per icon. Do NOT use standard Ionicons or Material icons.

**5 feed card themes** (user-selectable): Broadsheet · Western · Gold Press · Dispatch · Chronicle

## 14 Production Screens (build order)
| # | Screen | File | Status |
|---|---|---|---|
| 1 | Splash | `app/(tabs)/splash.tsx` | Built |
| 2 | Welcome | `app/(tabs)/welcome.tsx` | Built |
| 3 | Sign Up | `app/(tabs)/signup.tsx` | **Wired to Supabase Auth** |
| 4 | Login | `app/(tabs)/login.tsx` | Built |
| 5 | Profile Setup | `app/(tabs)/profile-setup.tsx` | Built |
| 6 | Home (Hub & Spoke) | `app/(tabs)/index.tsx` | Built |
| 7 | Post a Job | `app/(tabs)/post-job.tsx` | Built |
| 8 | Worker Match | `app/(tabs)/worker-match.tsx` | Built (mock data) |
| 9 | Chat | `app/(tabs)/chat.tsx` | Built (mock data) |
| 10 | Payment / Escrow | `app/(tabs)/payment.tsx` | Built (no Stripe yet) |
| 11 | Rate / Review | `app/(tabs)/review.tsx` | Built |
| 12 | Notifications | `app/(tabs)/notifications.tsx` | Built |
| 13 | Live Market | `app/(tabs)/live-market.tsx` | Built (mock feed) |
| 14 | Belt System | `app/(tabs)/belt-system.tsx` | Built |

Home = role-adaptive toggle (Customer ↔ Worker). Hub & Spoke = secondary modal only (`Explore All Features`), not primary nav.

## Supabase — 13 Core Tables + 5 Task Library Tables
Core: `profiles` · `skills` · `user_skills` · `jobs` · `bids` · `chats` · `messages` · `payments` · `reviews` · `xp_transactions` · `badges` · `user_badges` · `notifications`

Task Library (confirmed seed file): `task_categories` · `task_library` · `worker_skills` · `job_post_tasks` · `belt_history`
- Seed file: `C:\Users\sophi\Desktop\CLAUDE-DOC\xprohub_task_library_seed.sql` — run this AFTER main schema
- `task_code` format: `CCTT` e.g. `0101` = category 01, task 01
- `worker_skills.is_featured` = worker's top 3 "Superpowers" shown on their profile card
- `worker_match_scores` VIEW produces the "X/X Tasks Match" label shown on applicant cards
- ⚠️ Seed file references `users` and `job_posts` — main schema uses `profiles` and `jobs`. Fix FKs before running.

Core schema: `C:\Users\sophi\Desktop\CLAUDE-DOC\xprohub_schema.sql` | Realtime on: `jobs`, `messages`, `notifications`

## Belt System (Workers)
| Belt | Jobs | Min Rating | Key Unlock |
|---|---|---|---|
| Newcomer (White) | 0 | — | 2× XP first 5 jobs, XProHub Guarantee |
| Yellow | 10 | 4.0★ | Higher-paying categories |
| Orange | 30 | 4.3★ | Priority matching, Squad creation |
| Green | 75 | 4.5★ | 30-sec head start on jobs, Gov jobs |
| Blue | 150 | 4.7★ | Team job eligibility |
| Brown | 300 | 4.8★ | Reduced platform commission |
| Black | 500+ (invited) | 4.9★ | Verified badge, premium jobs |
| Legend | 1,000+ | 4.9★ | Highest platform status |

Badges (9): Never Cancels · Top Pro · Verified · Insured · Top 5% · Fast Replies · Rising Star · Money Maker · Squad Leader

XP earn: job complete +50 · 5-star review +30 · on time +20 · fast response +10 · repeat customer +25 · refer worker +100

## PROGRESSIVE PROFILE SYSTEM

### EXPLORER (Level 1 — Browse Only, default for all new users)
- Required: full name, email, profile photo (optional)
- Can do: browse Live Market feed, browse Worker business cards, filter by category
- Cannot do: apply for jobs, post jobs, message anyone, transact

### STARTER (Level 2A — triggered when user posts or applies for jobs under $50)
- Gate screen shown when user taps Post a Job or Apply (low-value jobs)
- Required: phone number (SMS verified), Stripe basic (debit/bank for payouts)
- Workers also: choose skills from Task Library
- Unlocks: posting jobs under $50, applying, messaging, basic transactions
- Stripe handles all banking data — never store financial info directly

### PRO (Level 2B — triggered when user posts or applies for jobs $50+)
- Gate screen shown when job value or category requires full verification
- Required: everything in Starter + address + State ID photo + Stripe Connect full
- Workers also: full background check eligibility
- Unlocks: all jobs, sensitive categories, team jobs
- Stripe Connect handles all banking data — never store financial info directly

### KEY RULE
Never force Starter or Pro upfront. User chooses the path that matches
what they are trying to do. Show a friendly gate only at the moment of
action. Stripe handles all banking data in both paths — never store
financial info directly.

### XPRO (Level 3 — Reputation Builder, optional, unlocks after first transaction)
- Work history, references, certifications, portfolio photos, bio
- Feeds into Belt System ranking and match score

## Progressive Trust Levels (unlock at moment of action)
| Level | Triggered | Required | Unlocks |
|---|---|---|---|
| I Explorer | Sign up | Name + Email + Phone | Browse, view, post basic jobs |
| II Professional | Applying to a job | Photo + Bio + Portfolio | Apply, full profile, messaging |
| III Trusted | Accepting paid job | Address + Gov ID + Stripe | Payments, sensitive categories |

## Matching Algorithm
Location 25% · Skill Match 35% · Belt/Experience 20% · Behavioral 20%
White Belt gets +15% newcomer boost for first 5 jobs ("Give Them A Chance").

## Code Rules
1. **Design system** — Dark Gold only: `#0E0E0F` bg, `#C9A84C` gold, `#171719` cards
2. **SafeAreaView** — import from `react-native-safe-area-context` ONLY (not `react-native` — SDK 54 breaking change)
3. **New files** — always `app/filename.tsx`, NEVER `app/app/filename.tsx` (causes Unmatched Route)
4. **Hub & Spoke nav** — React Native Modal + store pending route in state + useEffect to navigate after modal closes
5. **No pure white** — use background color from chosen design system
6. **Every screen answers one question** — no feature creep per screen
7. **No mock data in production** — connect to Supabase or gate the screen
8. **Two core loops**: Customer = 3 taps to done · Worker = 2 taps to earn
9. **Dev Menu** (`dev-menu.tsx`) is `__DEV__` only — never ships to production
10. **Plan Mode** (`Shift+Tab`) before multi-file changes
11. **Windows PowerShell** cannot handle `(tabs)` in paths — use File Explorer for those folders
12. **app.json assets**: splash = `splash-icon.png`, Android icon = `android-icon-foreground.png`

## What Is Built
- All 14 production screens as TSX files (mostly mock/demo data)
- Welcome screen — newspaper broadsheet style, single screen, Dark Gold, two symmetrical boxes with yin-yang, Built for Trust strip
- Sign Up wired to Supabase Auth (email + password)
- Supabase schema fully written (`xprohub_schema.sql`)
- GoldenDollar + HomeBeacon reusable components
- Hub & Spoke modal via Explore All Features button
- Job Categories screen (`job-categories.tsx`) using real image + invisible overlay buttons

## What Is NOT Built Yet
- Supabase not wired beyond Sign Up (Login, Profile, Jobs all use mock data)
- Stripe integration (no real payments)
- Live Market not connected to Supabase Realtime
- Push notifications not configured
- Smart match algorithm not implemented
- PostGIS geo-matching not active
- Trust Level II/III verification flow
- Task Library tables not confirmed deployed
- Team Jobs / Squads / Regional system (Phase 2+)

## Session Start Checklist
- [ ] `npx expo start --clear`
- [ ] Open Expo Go on iPhone → scan QR
- [ ] `git status` — check what changed last session
- [ ] Confirm screens use `#0E0E0F` background and `#C9A84C` gold (fix any that don't)
- [ ] State what screen/feature we're wiring today
- [ ] Connect to Supabase before building new screens
