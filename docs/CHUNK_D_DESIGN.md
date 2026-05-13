# XProHub — Chunk D Design: Customer Payment Method Gate

**Created:** 2026-05-11 (D-2 spec corrected 2026-05-12; D-3 webhook architecture corrected 2026-05-13; D-4 prerequisites shipped 2026-05-13)
**Author:** Paata Tskhadiashvili + chat-Claude
**Status:** Design complete — ready to build

---

## What Chunk D Builds

The customer-side payment gate. When a user taps Submit on Post a Job,
the platform checks whether they have a payment method on file. If not,
they are routed to a payment setup screen. On completion they return to
Post a Job with their draft content preserved.

This is the mirror of the worker-side Stripe Connect gate (C-4a/C-4b)
already wired in apply.tsx.

---

## Locked Decisions

**Gate trigger: Submit, not Load.**
The Post a Job tab always opens freely. Users can draft a job, browse
categories, and set a budget without friction. The gate fires only when
they tap Submit — at the moment they are actually committing to post.
This preserves draft content and respects the user's time.

**Gate flag: stripe_payment_method_added boolean on profiles.**
Single boolean, same pattern as stripe_charges_enabled on the worker
side. Gate reads this column. Webhook sets it to true on success.
Fast — one DB column read, no Stripe API call at gate-check time.

**Payment UX: Stripe PaymentSheet (in-app).**
User adds a card without leaving the app. Requires a create-setup-intent
Edge Function. Stripe SDK already installed (Chunk B). No new Universal
Links needed — PaymentSheet is a native SDK sheet, not a web redirect.

**Dual-role awareness.**
The same user may be both a customer (needs payment method) and a worker
(needs Stripe Express). These are two separate Stripe objects and two
separate gates. Chunk D handles the customer side only. The worker side
(stripe_charges_enabled) is already wired.

---

## Schema Changes

### Migration: 20260511000001_chunk_d_payment_method.sql

One new column on profiles:

BEGIN;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_payment_method_added
  BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;

Existing columns confirmed in live DB (no migration needed):
- stripe_customer_id — text, nullable, original schema
- stripe_account_id — text, nullable, original schema
- stripe_charges_enabled — boolean, default false (Chunk A migration)
- stripe_payouts_enabled — boolean, default false (Chunk A migration)
- stripe_onboarding_completed_at — timestamptz (Chunk A migration)

---

## New Screen: app/(tabs)/payment-setup.tsx

### Prerequisites (completed 2026-05-13)

Three items identified during D-4 readiness investigation
(Claude Code consultation) and resolved before screen build:

1. **StripeProvider wired at app root.** app/_layout.tsx now
   wraps the root Stack with `<StripeProvider>` passing
   publishableKey and urlScheme="xprohub". Without this,
   initPaymentSheet throws immediately. Commit eaa29f9.

2. **Publishable key location: hardcoded in _layout.tsx.**
   Decision: option A (hardcode) over option B (app.json extra)
   because the key is read in exactly one place and there's no
   existing Constants.expoConfig pattern in the codebase. The
   key is public by design (safe to embed per Stripe docs).
   Live-mode rollover is a one-line swap documented in the
   constant's comment block.

3. **EAS dev client confirmed — no rebuild needed.** The most
   recent iOS build (2026-05-11, commit 319e62f) used the
   development profile with developmentClient: true. The Stripe
   plugin was in app.json at that commit, so the native module
   is already in the installed binary. D-4 changes are JS-only
   and hot-reload via Metro.

Customer-side payment method setup. Mirrors stripe-connect.tsx in
structure.

### States

State 1 — NOT_ADDED: stripe_payment_method_added = false
  UI: "ADD PAYMENT METHOD" CTA, opens Stripe PaymentSheet

State 2 — ADDED: stripe_payment_method_added = true
  UI: Confirmation message, bounces to returnTo destination

### Behaviour

- Accepts returnTo query param (same pattern as stripe-connect.tsx)
- On completion: webhook sets stripe_payment_method_added = true,
  screen detects change and routes to returnTo destination
- On load if already ADDED and returnTo exists: bounce immediately
  (user already set up, no friction)

### Stripe PaymentSheet flow

1. Screen loads → calls create-setup-intent Edge Function
2. Edge Function creates Stripe SetupIntent + Customer object
   (creates Customer if stripe_customer_id is null, stores ID back
   to profiles)
3. Returns { client_secret, ephemeral_key, customer_id } to app
4. App initialises Stripe PaymentSheet with client_secret
5. User completes card entry in native sheet
6. On success: webhook fires setup_intent.succeeded →
   stripe_payment_method_added = true in profiles
7. Screen detects flag change → routes to returnTo

---

## Gate in post.tsx

### Trigger point

Lines 15 and 219 have TODO comments marking the gate location.
Gate fires at handleSubmit — before the job INSERT runs.

### Gate logic

handleSubmit:
  1. Validate form fields (existing logic)
  2. Fetch profiles.stripe_payment_method_added for current user
  3. If false:
       router.push to /(tabs)/payment-setup with returnTo: /(tabs)/post
       return — abort submit, draft preserved in component state
  4. If true:
       proceed with job INSERT (existing logic)

### Draft preservation

Because the gate aborts at handleSubmit and returns without unmounting
the component, all form state (category, tasks, budget, timing,
description) remains in memory. When the user returns from payment-setup
the Post a Job screen is exactly as they left it.

---

## New Edge Function: create-setup-intent

Path: supabase/functions/create-setup-intent/index.ts

Responsibilities:
1. Authenticate the calling user (JWT verification)
2. Look up profiles.stripe_customer_id for the user
3. If null: create a new Stripe Customer object, store the ID back
   to profiles.stripe_customer_id
4. Create a Stripe SetupIntent attached to the Customer
5. Create a Stripe EphemeralKey for the Customer (required for
   PaymentSheet to access saved payment methods on the client side
   without exposing the secret key)
6. Return { client_secret, ephemeral_key, customer_id }

Follows same structure as create-stripe-account and
create-onboarding-link Edge Functions.

---

## Webhook Architecture: Two Endpoints, One Edge Function

Stripe Connect separates webhook endpoints by scope. An endpoint
scoped to "Connected accounts" cannot receive events from "Your
account" and vice versa. XProHub needs both:

- **account.updated** fires on Connected accounts (workers'
  Stripe Express accounts) — already wired in C-6
- **setup_intent.succeeded** fires on Your account (platform-side
  Customer objects created in D-2) — requires a second endpoint

Both endpoints point to the same Edge Function URL:
`https://ygnpjmldabewzogyrjbb.supabase.co/functions/v1/stripe-webhook`

### Endpoint 1: Connected accounts (existing)

- Scope: Connected accounts
- Events: account.updated
- Secret: STRIPE_WEBHOOK_SECRET (already set in Supabase secrets)
- Status: ACTIVE since C-6 (2026-05-06)

### Endpoint 2: Your account (new for Chunk D)

- Scope: Your account
- Events: setup_intent.succeeded
- Secret: STRIPE_WEBHOOK_SECRET_PLATFORM (new Supabase secret)
- Status: Must be created in Stripe dashboard

### Dual-secret verification

Each endpoint has its own signing secret. The Edge Function must
try both secrets when verifying the webhook signature. Logic:
1. Try STRIPE_WEBHOOK_SECRET first
2. If verification fails, try STRIPE_WEBHOOK_SECRET_PLATFORM
3. If both fail, return 400 (invalid signature)

This is a common pattern for Connect platforms with a single
backend webhook handler.

### Handler logic (setup_intent.succeeded)

File: supabase/functions/stripe-webhook/index.ts (already amended
in D-3 commit 1ef47c0)

1. Extract customer ID from SetupIntent event object
2. Look up profiles row where stripe_customer_id = customer ID
3. Idempotency check (skip if stripe_payment_method_added already true)
4. Set stripe_payment_method_added = true
5. Throw on failure (triggers Stripe retry via 500 response)

### Manual setup steps (Paata in Stripe dashboard)

1. Go to Stripe dashboard → Developers → Webhooks
2. Add endpoint: same URL as existing endpoint
3. Set "Events from" to "Your account"
4. Select event: setup_intent.succeeded
5. Save → copy the signing secret (whsec_...)
6. Set in Supabase: supabase secrets set STRIPE_WEBHOOK_SECRET_PLATFORM=whsec_...

Source: https://docs.stripe.com/connect/webhooks (scope separation
documented under "Events from" filter)

---

## Build Sequence

D-1: Migration — add stripe_payment_method_added
     supabase/migrations/20260511000001_chunk_d_payment_method.sql

D-2: Edge Function — create-setup-intent
     supabase/functions/create-setup-intent/index.ts

D-3: Webhook amendment — setup_intent.succeeded
     supabase/functions/stripe-webhook/index.ts

D-4: New screen — payment-setup.tsx
     app/(tabs)/payment-setup.tsx

D-5: Gate in post.tsx — replace TODO at handleSubmit
     app/(tabs)/post.tsx

D-6: Register new screen in _layout.tsx
     app/(tabs)/_layout.tsx

D-7: Deploy Edge Functions + webhook event
     Supabase dashboard + CLI

D-8: End-to-end test on iPhone
     Both accounts: Paata + Khatuna

---

## Test Criteria (D-8)

- User without payment method taps Submit on Post a Job →
  routed to payment-setup screen
- Draft content survives the round-trip (category, tasks, budget
  all still populated on return)
- User completes card entry in PaymentSheet →
  stripe_payment_method_added flips to true in DB
- User returned to Post a Job → taps Submit again → job posts
  successfully
- User who already has payment method taps Submit → no gate,
  job posts directly
- Verified with two accounts (Paata + Khatuna) for two-sided
  coverage
- **D-3 dual-secret verification (deferred synthetic test):**
  After completing the iPhone PaymentSheet flow, inspect Edge
  Function logs at the Supabase dashboard. Look for
  `[stripe-webhook] setup_intent.succeeded for customer cus_...`
  followed by `[stripe-webhook] stripe_payment_method_added set
  to true for profile ...`. If the platform secret path fires,
  you'll see `[stripe-webhook] Primary secret failed, trying
  platform secret` first — that's the dual-secret fallback
  working as designed.

---

## Notes

- stripe_customer_id exists in live DB (original schema,
  pre-migration). create-setup-intent will populate it for users
  who go through payment setup.
- stripe_payment_method_added is the only new DB column Chunk D
  requires.
- Do not query Stripe API at gate-check time — read the boolean
  from profiles only. Fast and offline-resilient.
- PaymentSheet handles all card UI — no custom card input fields
  in the app.
- Chunk E (payout release) and Chunk F (payment UI polish) are
  out of scope for Chunk D.
- PaymentSheet requires three values to initialize: SetupIntent
  client_secret, EphemeralKey secret, and Customer ID. The Edge
  Function creates all three Stripe objects in a single call and
  returns them together. Discovered during D-2 strategy consultation
  with Claude Code (2026-05-12).
- Stripe Connect webhook endpoints are scoped: "Your account" vs
  "Connected accounts" cannot share a single endpoint. XProHub
  needs two endpoints (one per scope) pointing to the same Edge
  Function, with dual-secret verification. Original design doc
  incorrectly specified adding setup_intent.succeeded to the
  existing Connected accounts endpoint. Corrected during D-3
  strategy consultation with Claude Code (2026-05-13). Source:
  https://docs.stripe.com/connect/webhooks
- D-4 readiness investigation (Claude Code consultation,
  2026-05-13) discovered three prerequisites not in the original
  design doc: (1) StripeProvider must wrap the app root for
  PaymentSheet to initialize, (2) publishable key placement
  decision needed, (3) EAS dev client confirmation needed to
  verify native Stripe module is in the binary. All three
  resolved same day — commit eaa29f9 (StripeProvider + key),
  stale Expo Go references fixed in commit f7e9405.
