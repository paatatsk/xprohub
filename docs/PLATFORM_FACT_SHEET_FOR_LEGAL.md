# XProHub — Platform Technical Fact Sheet for Legal Documentation

**Generated:** 2026-05-15
**Purpose:** Input for Privacy Policy and Terms of Service drafting
**Source:** Codebase audit of github.com/paatatsk/xprohub (commit `ff77fc8`)

This document describes what the platform actually does, verified against
the codebase. Every claim is traceable to a specific file, migration, or
design document. Hand this to your legal drafter or privacy compliance
service (Termly, Iubenda, etc.) as the factual basis for Privacy Policy
and Terms of Service.

---

## 1. PLATFORM OVERVIEW

**What XProHub is:** A dual-role gig marketplace mobile app for real-world
services (cleaning, handyman, tutoring, pet care, moving, trades, etc.).
Every user is both a potential customer and a potential worker — there is
no permanent role assignment. Users freely switch between posting jobs
(customer mode) and applying to jobs (worker mode).

**Business model:** XProHub charges a 10% platform fee on each transaction.
The fee is calculated at hire time and deducted before worker payout.
(`supabase/functions/hire-and-charge/index.ts:196` —
`Math.round(agreedPriceCents * 0.10)`)

**Geographic scope:** Currently in pre-launch testing, New York City area.
Location defaults in the schema are `city = 'New York'`, `state = 'NY'`
(`xprohub_schema.sql:45-46`).

**Platform type:** iOS mobile app built with React Native + Expo SDK 54.
No web app for end users. Backend on Supabase (PostgreSQL).

**App Store status:** Not yet submitted. Chunk G (compliance) is the
pre-submission gate.

---

## 2. DATA COLLECTED FROM USERS

### 2.1 Account Information

| Data | Storage | When Collected | Required | Retention |
|---|---|---|---|---|
| Email address | Supabase Auth (`auth.users`) + `profiles.email` | Signup | Yes | Until account deletion (then rotated to `deleted-{uuid}@xprohub.invalid`) |
| Password | Supabase Auth (`auth.users`, hashed by Supabase) | Signup | Yes | Until account deletion (then randomized) |
| Full name | `profiles.full_name` | Profile setup onboarding | Yes (required to post or apply) | Until account deletion (then nulled) |
| Phone number | `profiles.phone` | Optional profile field | No | Until account deletion (then nulled) |
| Profile photo | Supabase Storage `avatars` bucket (public) + `profiles.avatar_url` | Profile setup or worker onboarding | Yes (required to post or apply) | Until account deletion (then URL nulled; storage object retained for other party references) |

**Source:** `xprohub_schema.sql:13-57`, `app/(onboarding)/profile-setup.tsx`,
`app/(tabs)/id.tsx`

### 2.2 Identity Verification

XProHub does **not** collect government-issued ID, Social Security numbers,
or legal identity documents. "Identity verification" in the app refers to:
- Profile photo (uploaded via `expo-image-picker`, stored in `avatars` bucket)
- At least one skill category claimed (stored in `worker_skills` table)
- Stripe Express account onboarding (Stripe collects identity docs directly;
  XProHub receives only a boolean `stripe_charges_enabled` flag)

The `is_verified`, `is_insured`, `is_background_checked` fields on `profiles`
are admin-set flags, not user-provided data.

**Source:** `app/(tabs)/id.tsx`, `xprohub_schema.sql:36-38`

### 2.3 Location Data

| Data | Storage | Source | Notes |
|---|---|---|---|
| Street address | `profiles.location_address`, `jobs.location_address` | User-entered text field | Not device GPS |
| Neighborhood | `profiles.neighborhood`, `jobs.neighborhood` | User-entered text field | Required for job posts |
| City | `profiles.city` | User-entered (defaults to 'New York') | |
| State | `profiles.state` | User-entered (defaults to 'NY') | |
| Latitude/Longitude | `profiles.location_lat/lng`, `jobs.location_lat/lng` | User-entered or geocoded | Not from device GPS sensor |

**XProHub does not access device GPS.** `expo-location` is not installed.
PostGIS is used server-side for spatial indexing only. All location data
is user-entered.

**Source:** `xprohub_schema.sql:42-47,170-173`, `package.json` (no
expo-location dependency)

### 2.4 Worker Profile Data

| Data | Storage | Required | Notes |
|---|---|---|---|
| Skill categories | `worker_skills.task_id` → `task_library` | Yes (≥1 to apply) | Selected from 188 tasks across 20 categories |
| Featured skills ("Superpowers") | `worker_skills.is_featured` | No (up to 3) | Highlighted on worker card |
| Years of experience | `worker_skills.years_exp` | No | Schema field exists but is not solicited by current UI; defaults to NULL |
| Bio | `profiles.bio` | No | Free-text |

**Source:** `app/(tabs)/id.tsx`, migration
`20260417000001_replace_skills_with_task_library.sql:52-60`

### 2.5 Job Content

| Data | Storage | Required | Notes |
|---|---|---|---|
| Job title | `jobs.title` | Yes | Max 80 characters |
| Job description | `jobs.description` | No | Max 500 characters |
| Category | `jobs.category` + `job_post_tasks` junction | Yes | From task_library |
| Budget range | `jobs.budget_min`, `jobs.budget_max` | No | USD amounts |
| Timing preference | `jobs.timing` | Yes | `asap`, `scheduled`, or `flexible` |
| Urgency flag | `jobs.is_urgent` | No | Boolean |
| Neighborhood | `jobs.neighborhood` | Yes | Free-text |
| Job photos | `jobs.photos` (text array) | No | Schema exists but not wired in current UI |

Jobs expire automatically after 7 days (`jobs.expires_at` default:
`now() + interval '7 days'`).

**Source:** `app/(tabs)/post.tsx:248-260`, `xprohub_schema.sql:145-190`

### 2.6 Applications (Bids)

| Data | Storage | Required |
|---|---|---|
| Proposed price | `bids.proposed_price` | Yes |
| Message | `bids.message` | Yes (template or custom, max 500 chars) |
| Match score | `bids.match_score` | No (future feature, not calculated) |

**Source:** `app/(tabs)/apply.tsx`, `xprohub_schema.sql:204-223`

### 2.7 Chat Messages

| Data | Storage | Notes |
|---|---|---|
| Message content | `messages.content` | Free-text |
| Message type | `messages.message_type` | `text`, `image`, `job_card`, `payment_request`, `system` |
| Read status | `messages.is_read` | Boolean |

Chat is 1:1 between matched customer and worker. One chat room per job
(`chats` table). Messages delivered via Supabase Realtime (WebSocket).

**Source:** `app/(tabs)/job-chat.tsx`, `xprohub_schema.sql:230-258`

### 2.8 Reviews and Ratings

| Data | Storage | Required |
|---|---|---|
| Star rating | `reviews.rating` | Yes (1–5) |
| Comment | `reviews.comment` | No (max 500 chars) |
| Tags | `reviews.tags` | No (schema exists, not wired in UI) |

Reviews are public and permanent. One review per reviewer per job
(unique constraint on `job_id, reviewer_id`). A trigger updates
`profiles.rating_avg` after each review.

**Source:** `app/(tabs)/review.tsx`, `xprohub_schema.sql:300-330`

### 2.9 Payment Information

**XProHub never stores credit card numbers, bank account numbers, or
other raw financial data.** All payment data is collected and stored
by Stripe. XProHub stores only Stripe-issued identifiers:

| Data | Storage | Purpose |
|---|---|---|
| `stripe_customer_id` | `profiles` | Reference to Stripe Customer object |
| `stripe_account_id` | `profiles` | Reference to Stripe Connected Account |
| `stripe_payment_method_id` | `profiles` | Reference to saved payment method (pm_xxx) |
| `stripe_payment_method_added` | `profiles` | Boolean flag: has a card on file |
| `stripe_charges_enabled` | `profiles` | Boolean: Stripe approved for charges |
| `stripe_payouts_enabled` | `profiles` | Boolean: Stripe approved for payouts |
| `stripe_payment_intent_id` | `payments` | Reference to charge |
| `stripe_transfer_id` | `payments` | Reference to worker payout transfer |
| `stripe_charge_id` | `payments` | Reference to charge object |

**Source:** `xprohub_schema.sql:49-50`, migrations
`20260428000001_step13_payments_schema.sql`,
`20260512000001_chunk_d_payment_method.sql`,
`20260515000001_chunk_e_payout_release.sql`

### 2.10 Device and Diagnostic Data

| Data | Source | Notes |
|---|---|---|
| Crash data | Expo framework defaults | Standard React Native crash reporting |
| Biometric enrollment status | `expo-local-authentication` | Checked locally, never transmitted |
| Biometric credentials | `expo-secure-store` (iOS Keychain) | Email + password stored on-device only, hardware-encrypted |
| Auth session tokens | `AsyncStorage` (via Supabase SDK) | JWT tokens for API auth |

**No analytics SDKs are installed.** No Amplitude, Mixpanel, Firebase
Analytics, Segment, Sentry, or similar. Verified by package.json audit.

**Source:** `hooks/useBiometrics.ts`, `lib/supabase.ts`, `package.json`

### 2.11 System-Generated Data (Not User-Provided)

| Data | Table | Purpose |
|---|---|---|
| XP total / level / belt | `profiles`, `xp_transactions` | Gamification progression |
| Jobs completed / posted counts | `profiles` | Activity statistics |
| Total earned / spent | `profiles` | Financial summary |
| Trust level | `profiles.trust_level` | `explorer` / `starter` / `pro` gate |
| Notification records | `notifications` | System-triggered event log |
| Badge awards | `user_badges` | Achievement tracking |

---

## 3. THIRD-PARTY DATA PROCESSORS

### 3.1 Supabase (Backend Infrastructure)

| Attribute | Value |
|---|---|
| Role | Database, Authentication, File Storage, Realtime, Edge Functions |
| Data received | All user data: profiles, jobs, bids, messages, reviews, payments metadata |
| Data hosting | Supabase cloud (US region) |
| Project ID | `ygnpjmldabewzogyrjbb` |
| SDK version | `@supabase/supabase-js ^2.103.0` |

**Services used:**
- **Auth:** Email/password signup, JWT session management, password hashing
- **Database (PostgreSQL):** All 13+ application tables
- **Storage:** `avatars` bucket (public), `job-photos` bucket (public),
  `portfolio` bucket (public), `id-documents` bucket (private) — only
  `avatars` actively used
- **Realtime:** WebSocket subscriptions on `jobs`, `messages`, `notifications`
- **Edge Functions (Deno):** 6 deployed functions for Stripe integration
  and payment processing

**Source:** `lib/supabase.ts`, `supabase/functions/`, `xprohub_schema.sql`

### 3.2 Stripe (Payment Processing)

| Attribute | Value |
|---|---|
| Role | Payment processing, merchant onboarding, escrow, payouts |
| Data received | Customer email + name (for Customer creation), payment method tokens, transaction amounts |
| PCI scope | Stripe handles all card data; XProHub never sees card numbers |
| SDK version | `@stripe/stripe-react-native 0.50.3` (iOS SDK ~24.19.x) |
| Mode | Currently test mode (`pk_test_*`, `sk_test_*`) |

**Stripe objects created by XProHub:**
- **Customer** — `stripe.customers.create()` in `create-setup-intent/index.ts`
- **SetupIntent** — `stripe.setupIntents.create()` in `create-setup-intent/index.ts`
- **Connected Account (Express)** — `stripe.accounts.create()` in `create-stripe-account/index.ts`
- **Account Link** — `stripe.accountLinks.create()` in `create-onboarding-link/index.ts`
- **PaymentIntent** — `stripe.paymentIntents.create()` in `hire-and-charge/index.ts`
- **Transfer** — `stripe.transfers.create()` in `release-payment/index.ts`
- **Refund** — `stripe.refunds.create()` in `hire-and-charge/index.ts` (on post-charge failure)

**Webhook events consumed:** `account.updated`, `payment_intent.succeeded`,
`transfer.created`, `setup_intent.succeeded`
(`supabase/functions/stripe-webhook/index.ts`)

### 3.3 Expo / EAS (Build & Framework)

| Attribute | Value |
|---|---|
| Role | Mobile app framework, build service, OTA updates |
| Data received | Build artifacts, crash reports (framework default) |
| EAS Project ID | `d345f424-bb4c-4ecb-99ff-6388070a5822` |
| SDK version | Expo ~54.0.33 |

No Expo analytics or telemetry SDKs are explicitly enabled.
`expo-notifications` is not installed (no push token collection).

**Source:** `app.json`, `package.json`

### 3.4 Cloudflare (Infrastructure)

| Attribute | Value |
|---|---|
| Role | DNS, Workers (auto-release cron), Pages (legal page hosting) |
| Data received | Standard HTTP request data (IP, headers) for DNS resolution |
| Workers | `auto-release` cron — queries Supabase for overdue payments, triggers release |

The auto-release Worker accesses payment data (job_id, escrow_status,
auto_release_at) via Supabase PostgREST API using a service role key.

**Source:** `cloudflare/auto-release/src/index.ts`,
`cloudflare/auto-release/wrangler.toml`

### 3.5 Google Fonts (Font Delivery)

| Attribute | Value |
|---|---|
| Role | Font asset delivery at app build/load time |
| Data received | Standard HTTP request metadata (IP, user agent) |
| Fonts | Space Grotesk, Playfair Display, Inter (via @expo-google-fonts packages) |

Minimal data exposure — font files are fetched from Google CDN.

**Source:** `package.json` (@expo-google-fonts packages)

---

## 4. PAYMENT ARCHITECTURE

### 4.1 Model

XProHub uses **Stripe Connect** with two payment directions:

- **Customer side:** Stripe Customer object + saved PaymentMethod (credit/debit
  card). Created via `create-setup-intent` Edge Function. Card data never
  touches XProHub servers — Stripe's PaymentSheet SDK tokenizes on-device.

- **Worker side:** Stripe Express Connected Account. Workers onboard via
  Stripe's hosted onboarding form (identity verification, bank account
  setup handled entirely by Stripe). XProHub receives only boolean status
  flags (`stripe_charges_enabled`, `stripe_payouts_enabled`).

### 4.2 Escrow Flow

```
Customer taps "Hire"
  → hire-and-charge Edge Function creates PaymentIntent (confirm: true)
  → Stripe charges customer's saved card
  → payment_intent.succeeded webhook fires
  → stripe-webhook creates payment record (escrow_status = 'held')
  → Worker performs job
  → Worker taps "Mark Complete"
  → mark_completed() sets job → pending_confirmation
  → auto_release_at = now() + 72 hours
  → Customer has 72 hours to confirm or dispute
  → On confirm: release-payment transfers 90% to worker
  → On timeout (72 hours): auto-release cron triggers same transfer
```

### 4.3 Auto-Release Cron

- **Schedule:** Every 15 minutes (`*/15 * * * *`)
- **Platform:** Cloudflare Workers
- **Query:** Finds payments where `escrow_status = 'held'` AND
  `auto_release_at <= now()` AND `disputed_at IS NULL`
- **Action:** Calls `release-payment` Edge Function for each overdue payment
- **Purpose:** Worker Dignity guarantee — workers receive payment even if
  customer never confirms

**Source:** `cloudflare/auto-release/src/index.ts`,
`cloudflare/auto-release/wrangler.toml`

### 4.4 Dispute Path

- Customer calls `raise_dispute(job_id, reason)` during the 72-hour
  confirmation window
- Sets `escrow_status = 'disputed'`, records `disputed_at` and
  `dispute_reason`
- Job transitions to `disputed` status
- Auto-release cron skips disputed payments (`disputed_at IS NULL` filter)
- Resolution is manual in v1: Paata mediates via `hello@xprohub.com`,
  resolves with either Stripe refund or manual payment release

**Source:** migration `20260515000001_chunk_e_payout_release.sql:192-256`

### 4.5 Platform Fee

- **Rate:** 10% of the agreed job price
- **Calculation:** `platformFeeCents = Math.round(agreedPriceCents * 0.10)`
- **Worker receives:** 90% of the charged amount via Stripe Transfer
- **Fee retained:** In the platform's Stripe balance (no separate fee
  collection mechanism — it's the amount not transferred)

**Source:** `supabase/functions/hire-and-charge/index.ts:196`

### 4.6 What XProHub Controls vs Stripe

| XProHub Controls | Stripe Controls |
|---|---|
| Job matching and hire decision | Card data collection and tokenization |
| Escrow timing (72-hour hold) | Payment processing and settlement |
| Platform fee calculation (10%) | Identity verification for workers (KYC) |
| Dispute initiation | Bank account and payout management |
| Auto-release trigger timing | PCI compliance |
| Payment record keeping | Refund processing |

---

## 5. WORKER CLASSIFICATION

Workers on XProHub are **independent contractors**, not employees of
XProHub. The platform is a marketplace that connects customers with
workers.

Key characteristics supporting independent contractor status:
- Workers set their own prices (proposed_price on bids)
- Workers choose which jobs to apply for
- Workers control their own work methods and schedule
- Workers are not required to accept any specific job
- Workers can work on multiple platforms simultaneously
- XProHub does not provide tools, equipment, or training
- XProHub does not set work hours or schedules
- Payment is per-job, not salary or hourly wage from XProHub

The platform charges a marketplace fee (10%) on transactions, similar
to eBay, Etsy, or other marketplace models.

---

## 6. USER ACCOUNT MANAGEMENT

### 6.1 Account Creation

- Email + password signup via Supabase Auth
- Email confirmation required (confirmation link sent to email)
- Profile auto-created via PostgreSQL trigger on `auth.users` insert
  (`xprohub_schema.sql:73-84`)
- No social login (no Sign in with Apple, Google, Facebook)

### 6.2 Biometric Sign-In

- Optional Face ID / Touch ID login via `expo-local-authentication`
- Credentials (email + password) stored in iOS Keychain via
  `expo-secure-store` — hardware-encrypted, not included in device
  backups
- Biometric enrollment is automatic on first successful password login;
  user can clear via sign-out

**Source:** `hooks/useBiometrics.ts`

### 6.3 Account Deletion (Designed, Not Yet Built)

Per Apple Guideline 5.1.1(v), account deletion is mandatory. The design
is locked (`docs/CHUNK_G_COMPLIANCE_DESIGN.md`, G-1 section):

**Strategy: Anonymization, not hard-deletion.**

- 11 of 14 FK columns referencing `profiles.id` use NO ACTION — hard
  deletion would violate referential integrity
- The FK from `profiles.id` to `auth.users(id)` is ON DELETE CASCADE —
  deleting the auth user would cascade-delete the profile, breaking
  downstream constraints

**What happens on account deletion:**

| Action | Detail |
|---|---|
| Profile PII | Nulled (full_name, phone, avatar_url, bio, location fields, Stripe IDs) |
| Auth credentials | Email rotated to `deleted-{uuid}@xprohub.invalid`, password randomized, `banned_until = 9999-12-31` |
| Stripe Customer | Deleted (removes saved payment methods) |
| Stripe Connected Account | Capabilities deactivated (not deleted — Stripe retains transfer history) |
| Financial records (payments) | Preserved for Stripe compliance and dispute evidence |
| Reviews authored | Author display anonymized; text and rating preserved |
| Chat messages | Preserved for other party's record |
| Worker skills, badges, notifications | Deleted (no downstream FK dependencies) |
| XP transactions | Preserved (audit trail) |
| Open jobs (as customer) | Cancelled; pending bids auto-declined |

**Money-state blocker:** Account deletion is rejected if the user has:
- Jobs in status: `in_progress`, `pending_confirmation`, `disputed`
- Payments with `escrow_status = 'held'`

**Source:** `docs/CHUNK_G_COMPLIANCE_DESIGN.md` (G-1 section, locked
2026-05-15)

### 6.4 Sign-Out

- Calls `supabase.auth.signOut()` (kills JWT session)
- Calls `clearCredentials()` (erases biometric credentials from SecureStore)
- Routes to welcome screen

**Source:** `app/(tabs)/account.tsx`

---

## 7. CONTENT MODERATION

**Model:** Reactive-only for v1 launch (no proactive keyword or profanity
filtering).

**Mechanisms (in progress, Chunk G):**

| Mechanism | Status | Description |
|---|---|---|
| User reporting (G-4) | Designed, not built | Report button on profiles, job posts, chat messages, reviews |
| User blocking (G-5) | Designed, not built | Block users from feeds, prevent messaging and applications |
| Published contact | Active | `hello@xprohub.com` |
| Response SLA | Committed | 24-hour response to reported content |

**Rationale:** Apple accepts reactive moderation for low-volume marketplace
apps when a report mechanism, block mechanism, published contact, and
response SLA all exist.

**Future consideration:** Reviews are the first candidate for proactive
filtering when volume scales — they are public and permanent, unlike chat
(private) and jobs (ephemeral, 7-day expiry).

**Source:** `docs/CHUNK_G_COMPLIANCE_DESIGN.md` (G-6 section, locked
2026-05-15)

---

## 8. DATA RETENTION

| Data Category | Retention Policy | Basis |
|---|---|---|
| Profile data | Until account deletion, then anonymized (not deleted) | FK integrity; tombstone for financial records |
| Auth credentials | Until account deletion, then rotated + banned | Cannot delete auth record (CASCADE FK) |
| Financial records (payments) | Retained indefinitely | Stripe compliance, tax reporting, dispute evidence |
| Chat messages | Retained for other party's account lifetime | Both parties have right to their conversation history |
| Reviews (text + rating) | Retained indefinitely, author anonymized on deletion | Platform trust data |
| Job posts | Retained (completed/cancelled); cancelled on customer deletion | Financial audit trail for completed jobs |
| Worker skills | Deleted on account deletion | No downstream dependencies |
| Notifications | Deleted on account deletion | No retention value |
| XP transactions | Retained indefinitely | Audit trail |
| Diagnostic/crash data | Per Expo framework defaults | Standard mobile app telemetry |
| On-device credentials (SecureStore) | Until sign-out or app uninstall | Hardware-encrypted, local only |

---

## 9. USER RIGHTS (JURISDICTIONAL)

### 9.1 California (CCPA)

| Right | XProHub Position |
|---|---|
| Right to know | Supported — user data is visible in-app (profile, jobs, reviews, messages) |
| Right to delete | Supported with limitations — PII anonymized, financial records retained per Stripe compliance |
| Right to opt-out of sale | Not applicable — XProHub does not sell user data to third parties |
| Right to non-discrimination | Supported — no service degradation for exercising privacy rights |

### 9.2 New York (SHIELD Act)

| Requirement | XProHub Compliance |
|---|---|
| Reasonable security measures | Supabase Auth (bcrypt hashing), RLS access control, Stripe PCI compliance, biometric credentials in hardware-encrypted Keychain |
| Breach notification | Supabase handles infrastructure-level breach notification; XProHub would notify affected users via email for application-level breaches |

### 9.3 GDPR (if applicable to EU users)

| Right | XProHub Position |
|---|---|
| Right to access | Supported — user data visible in-app |
| Right to rectification | Supported — users can edit profile, bio, location |
| Right to erasure | Supported with limitations — anonymization policy (financial records retained) |
| Right to data portability | Not yet implemented — would require data export feature |
| Right to object | Not applicable — no profiling or automated decision-making |
| Lawful basis for processing | Contract performance (providing the marketplace service) |

---

## 10. SECURITY POSTURE

| Control | Implementation |
|---|---|
| Authentication | Supabase Auth — email/password with bcrypt hashing, JWT sessions |
| Authorization | PostgreSQL Row Level Security (RLS) on all 13+ tables |
| Payment card data | Stripe handles exclusively — PCI scope minimized to SAQ-A equivalent |
| Biometric credentials | iOS Keychain via `expo-secure-store` (hardware-encrypted, excluded from backups) |
| API transport | HTTPS for all Supabase and Stripe API calls |
| Webhook verification | HMAC-SHA256 signature verification on all Stripe webhook events |
| Idempotency | Idempotency keys on all Stripe payment operations (PaymentIntents, Transfers, Refunds) |
| Cross-app tracking | None — `NSPrivacyTracking = false`, `NSPrivacyTrackingDomains = []` |
| Edge Function auth | Service role keys scoped to specific operations; user JWT validated on entry |
| Secrets management | Supabase dashboard for Edge Function secrets; Cloudflare `wrangler secret` for Worker secrets — never in code or shell environment variables |

**Source:** `app.json` (privacy manifests), `supabase/functions/stripe-webhook/index.ts`
(webhook verification), `hooks/useBiometrics.ts` (SecureStore)

---

## 11. WHAT WE DO NOT DO

| Statement | Verification |
|---|---|
| No advertising | No ad SDKs in `package.json`; no ad-related code anywhere in codebase |
| No sale of user data | No third-party data broker integrations; only processors are Supabase and Stripe |
| No cross-app tracking | `NSPrivacyTracking = false` in `app.json`; no IDFA/IDFV access |
| No use of data for ML/AI training | No ML models trained on user data; no data export to training pipelines |
| No device GPS tracking | `expo-location` not installed; all location data is user-entered text |
| No analytics beyond crash reporting | No Amplitude, Mixpanel, Firebase Analytics, Segment, Sentry, or PostHog installed |
| No social media data collection | No social login; no Facebook, Google, or Apple sign-in SDKs |
| No contact list access | `expo-contacts` not installed |
| No camera access | Only photo library picker (`expo-image-picker` with `launchImageLibraryAsync`); camera never accessed |
| No push notification tokens | `expo-notifications` not installed |

---

## 12. CONTACT

| Purpose | Contact |
|---|---|
| General support | hello@xprohub.com |
| Privacy inquiries | hello@xprohub.com |
| Legal inquiries | hello@xprohub.com |
| Content moderation reports | hello@xprohub.com (24-hour response SLA) |
| Account deletion requests | In-app (account screen) once G-1 is built; hello@xprohub.com as interim |

**Published in-app:** Account screen (About section), dispute panel in
job chat (`app/(tabs)/job-chat.tsx:701-704`)

**Source:** `lib/legal.ts` (`SUPPORT_EMAIL = 'hello@xprohub.com'`)

---

## APPENDIX: FILE REFERENCES

Key files cited in this document:

| File | Purpose |
|---|---|
| `xprohub_schema.sql` | Core database schema (13 tables) |
| `supabase/functions/hire-and-charge/index.ts` | Customer charge at hire |
| `supabase/functions/release-payment/index.ts` | Worker payout transfer |
| `supabase/functions/stripe-webhook/index.ts` | Stripe event handler |
| `supabase/functions/create-setup-intent/index.ts` | Customer payment method setup |
| `supabase/functions/create-stripe-account/index.ts` | Worker Express account creation |
| `supabase/functions/create-onboarding-link/index.ts` | Stripe onboarding link |
| `cloudflare/auto-release/src/index.ts` | Auto-release cron worker |
| `supabase/migrations/20260515000001_chunk_e_payout_release.sql` | Payment lifecycle functions |
| `supabase/migrations/20260428000001_step13_payments_schema.sql` | Stripe columns on profiles |
| `supabase/migrations/20260512000001_chunk_d_payment_method.sql` | Customer payment method flag |
| `docs/CHUNK_G_COMPLIANCE_DESIGN.md` | Compliance design (G-1 deletion, G-6 moderation, G-8 privacy labels) |
| `hooks/useBiometrics.ts` | Biometric credential storage |
| `lib/supabase.ts` | Supabase client configuration |
| `lib/legal.ts` | Legal URL and contact constants |
| `app.json` | iOS privacy manifests, permissions, plugins |
| `package.json` | All dependencies (audit for third-party processors) |
