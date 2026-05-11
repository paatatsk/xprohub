# XProHub — Chunk D Design: Customer Payment Method Gate

**Created:** 2026-05-11
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
3. Returns client_secret to app
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
5. Return { client_secret, customer_id }

Follows same structure as create-stripe-account and
create-onboarding-link Edge Functions.

---

## Webhook Addition: setup_intent.succeeded

File: supabase/functions/stripe-webhook/index.ts (amend existing)

New event to handle: setup_intent.succeeded

Handler logic:
1. Extract customer ID from event object
2. Look up profiles row where stripe_customer_id = customer ID
3. Set stripe_payment_method_added = true
4. Return 200

Register in Stripe dashboard: Add setup_intent.succeeded to the
existing webhook endpoint alongside account.updated.

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
