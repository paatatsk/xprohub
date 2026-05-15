# XProHub — Chunk E Design: Payout Release

**Created:** 2026-05-15
**Author:** Paata Tskhadiashvili + chat-Claude
**Status:** ✅ COMPLETE — All 12 steps shipped and end-to-end verified on iPhone 2026-05-15

---

## What Chunk E Builds

The money movement layer. When a customer hires a worker, funds are
charged immediately and held in escrow on the platform's Stripe
balance. When the job completes and the customer confirms (or the
72-hour auto-release window expires), funds are transferred to the
worker's Express account.

This closes the payment loop: Chunk C (worker gets Stripe Express)
+ Chunk D (customer saves card) + Chunk E (money moves at hire,
releases at completion).

---

## Locked Decisions

**Separate Charges + Transfers (confirmed).**
PaymentIntent captures funds to the platform balance at hire. A
separate Transfer moves funds to the worker's Express account at
release. This is the right pattern for escrow because:
- Full control over release timing (no auto-transfer at capture)
- Platform holds funds in its own Stripe balance between hire and
  release
- Platform fee is implicit: transfer_amount = agreed_price -
  platform_fee
- Stripe recommends this pattern for marketplaces with delayed
  fulfillment

Destination charges rejected: they auto-transfer at capture,
defeating escrow.

**Capture method: automatic.**
`capture_method: 'automatic'` captures immediately when the
PaymentIntent confirms. Manual capture's 7-day window is too short
for job completion timelines. Automatic capture puts funds in the
platform balance — that IS the escrow.

**Hire = Charge. Non-negotiable.**
PaymentIntent created and confirmed at the moment the customer taps
"Hire." Not at job posting, not at completion. Worker Dignity: the
worker knows funds are secured before starting work.

**Charge-then-accept ordering.**
PaymentIntent must succeed BEFORE accept_bid() fires. If the card
declines, the bid is not accepted and other workers' bids remain
active. Reversing this order would leave the worker hired but
unpaid if the charge fails — a Worker Dignity violation.

**Instant release on customer confirmation.**
When the customer taps "Confirm Completion," the Transfer fires
immediately. No holding period after explicit confirmation. The
72-hour auto-release window only applies when the customer doesn't
respond.

**Platform fee: 10% from agreed_price, worker-side.**
Customer pays `agreed_price`. Platform keeps 10%. Worker receives
90%. Fee deducted from worker's side. Exact rate TBD before launch
per CLAUDE.md.

**Transparent fee surfacing is a non-negotiable.**
The worker must see the fee breakdown explicitly in the app: "Job
total: $100 / Platform fee: $10 / Your earnings: $90." Never just
a net number. Transparency is the dignity move, not the fee
location. Primary surface: payment-details panel on the chat
screen. Secondary surface: future earnings.tsx wallet view
(Chunk F).

**[Amendment 1] Fee panel visibility: matched onward, not just
pending_confirmation.** The breakdown renders from the moment the
worker's bid is accepted — when they start work is when fee
transparency matters most. Showing it only at completion treats
the breakdown as a receipt; it should be a contract. Panel renders
on job-chat.tsx whenever jobStatus is matched, in_progress,
pending_confirmation, completed, or disputed. Does not render
before matched (not on open jobs or during bidding).

**Two-step completion model.**
Worker marks work done → job transitions to `pending_confirmation`.
Customer confirms → job transitions to `completed` AND release
fires. If customer doesn't respond within 72 hours → auto-release.

**[Amendment 3] Worker-only mark_completed is locked.**
Customers do not mark work complete. Customers confirm worker
claims. This is a philosophical lock: the worker performed the
labor, the worker declares it done. The customer's role is
verification, not declaration. The customer-side "MARK COMPLETED"
button is removed in E-7 and replaced with "CONFIRM COMPLETION"
against the pending_confirmation state.

**source_transaction requires charge ID, not PaymentIntent ID.**
Stripe's Transfer API `source_transaction` parameter requires a
charge ID (`ch_xxxxx`), not a PaymentIntent ID. The Edge Function
must pull `latest_charge` from the PaymentIntent. This is critical
because `source_transaction` allows the Transfer to succeed
immediately even before funds settle in the platform balance —
without it, Transfers can fail with "Insufficient Funds" during
the standard 2-day settlement window.

---

## Best Practices Applied

**1. Always use `source_transaction` on Transfers.**
Stripe's "Separate Charges and Transfers" guide: when you specify
the associated charge as the transfer's `source_transaction`, the
transfer succeeds immediately regardless of platform balance state.
Without it, you must wait for the ~2 business day settlement
period. For XProHub, this means the worker gets paid immediately
on release — not 2 days later.

**2. Webhook ordering is not guaranteed.**
Stripe docs: "make sure that your event destination isn't dependent
on receiving events in a specific order." `payment_intent.succeeded`
and `charge.succeeded` can arrive in either order. XProHub's
handlers are already idempotent (ON CONFLICT DO NOTHING in
`create_payment_record`), but the hire-and-charge Edge Function
should not depend on the webhook having fired by the time it
returns. The DB state should be set by the Edge Function itself
(optimistically), with the webhook as the confirmation/idempotent
backup.

**3. No marketplace uses XProHub's exact pattern.**
Research finding: TaskRabbit auto-charges after worker invoice
(~24h), Thumbtack and Angi are lead-gen (no escrow), Handy charges
upfront + batch pays weekly. XProHub's "charge at hire, hold in
escrow, release on customer confirmation with auto-release
backstop" is closest to Upwork/Fiverr's freelancing model, applied
to real-world labor. This is more worker-protective than any
mainstream gig marketplace. The 72-hour auto-release is faster
than Upwork (14 days) and Fiverr (14 days) because XProHub jobs
are same-day/next-day labor, not multi-week projects.

**4. Handy's FTC action is a cautionary tale.**
The FTC took action against Handy in January 2025 for deceptive
practices including opaque fee deductions from worker pay.
XProHub's commitment to transparent fee surfacing (fee breakdown
visible to worker on every payment) directly addresses this
pattern. Worker Dignity isn't just philosophy — it's regulatory
risk mitigation.

---

## Auto-Release Window: 72 Hours (3 Days)

**Justification against marketplace norms:**

| Platform | Auto-release window | Job type |
|---|---|---|
| TaskRabbit | 24 hours | Same-day home services |
| Thumbtack | Immediate (no escrow) | Lead-gen, customer pays directly |
| Upwork | 14 days (hourly) | Multi-week remote projects |
| Fiverr | 14 days | Multi-day creative deliverables |
| Rover | 48 hours | Pet care |

**Why 72 hours for XProHub:**
- XProHub jobs are mostly same-day or next-day real-world labor
  (cleaning, handyman, moving). The customer knows immediately
  whether the work is satisfactory.
- 24 hours (TaskRabbit) is tight — doesn't account for customers
  who hire for a property they don't visit daily (e.g., rental
  property cleaning).
- 14 days (Upwork/Fiverr) is disrespectful for a house cleaning.
  Worker Dignity means funds shouldn't sit idle when the work is
  clearly done.
- 72 hours balances customer inspection time with worker payment
  speed. Three business days is a culturally understood "reasonable
  response window."

---

## Auto-Release Mechanism: Cloudflare Workers Cron

Replaced lazy-trigger (v1) with background scheduler. Lazy-trigger
was a Worker Dignity violation — worker shouldn't have to open the
app to claim owed funds.

**Recommended: Cloudflare Workers scheduled handler.**

Justification over alternatives:
- **pg_cron (Supabase):** Available on Pro plan only. XProHub is
  on free tier. Even if upgraded, calling external Stripe API from
  a cron'd SQL function adds complexity.
- **Cloudflare Workers cron:** Paata already has Cloudflare set up
  (xprohub.com on Cloudflare Pages, Email Routing active). A
  Workers cron is a ~20-line script calling a Supabase Edge
  Function on a schedule. Zero new infrastructure, zero new
  accounts, zero new billing.

**Specification:**

Cloudflare Worker with scheduled handler, running every 15 minutes.

Queries Supabase PostgREST directly from the Worker for overdue
payments (`escrow_status = 'held' AND auto_release_at <= now()
AND disputed_at IS NULL`), then calls the `release-payment` Edge
Function (E-5) for each with `mode: 'auto_release'`. No
intermediate `process-auto-releases` Edge Function — the Worker
is the orchestrator, release-payment is the executor. Simpler,
one fewer hop, same validation and idempotency.

**Why 15 minutes:** At 72 hours, a 1-hour check means the worker
waits up to 73 hours. At 15-minute checks, worst case is 72h 15m.
Cloudflare Workers cron triggers are free tier eligible.

**Failure mode:** If the cron misses an execution, the next one
catches up — the query returns all overdue payments. If a Stripe
Transfer fails for an individual payment (e.g., worker's Express
account deactivated), log the error and skip — don't block other
releases.

---

## Notification Cadence

Push notifications aren't built (Milestone 4). For v1,
notifications are in-app banners on the chat screen.

| Timing | Customer sees | Worker sees | CTA |
|---|---|---|---|
| T+0 (worker marks done) | "Work marked complete. Please review and confirm." | "Waiting for customer confirmation. Auto-releases in 3 days." | CONFIRM / RAISE CONCERN |
| T+24h | "Your worker is waiting. Confirming helps them get paid promptly." | Timer: "Auto-releases in 2 days." | CONFIRM / RAISE CONCERN |
| T+48h | "Payment releases automatically in 24 hours. Have a concern?" | Timer: "Auto-releases tomorrow." | CONFIRM / RAISE CONCERN |
| T+72h (auto-release) | "Payment released to [worker name]." | "You've been paid! $[amount] is on its way." | LEAVE A REVIEW |

The T+24h copy frames confirmation as a workflow obligation to the
worker, not an admin task. It's the only nudge that names the
worker's perspective.

**Banner timing logic:** The chat screen reads `auto_release_at`
from the payments row and computes which banner to show based on
elapsed time since worker marked done. No separate timer table —
all state derived from the single `auto_release_at` timestamp.

---

## Dispute Path (v1 — Minimal Viable)

**Flow:**
1. Customer taps "RAISE CONCERN" (available during the 72-hour
   window)
2. Job status transitions to `disputed`
3. Payment `escrow_status` transitions to `disputed`,
   `disputed_at` set to now()
4. `auto_release_at` is NOT cleared — preserved for audit trail.
   The auto-release scheduler query filters on
   `disputed_at IS NULL`, so disputed payments are skipped
   without information loss.
5. Customer enters a reason (free text, stored as
   `dispute_reason` on payments)
6. Both parties see banner: "A concern has been raised. Contact
   hello@xprohub.com to resolve."
7. Paata mediates manually via email
8. Resolution (one of three):
   - **Release to worker** — call release-payment Edge Function
   - **Full refund** — Stripe Refund via dashboard,
     escrow_status → refunded
   - **Partial refund + partial release** — manual split via
     Stripe dashboard

Why manual in v1: at launch volume, Paata can mediate every
dispute. When volume makes this unsustainable, that's the signal
to build automation.

---

## Default Payment Method — Deterministic Path

**Finding:** SetupIntent completion does NOT auto-set
`invoice_settings.default_payment_method` on the Customer. And
off-session PaymentIntents require an explicit `payment_method`
parameter — they do NOT auto-resolve from invoice_settings.

**Decision: Store `stripe_payment_method_id` on profiles.**

Amend the `setup_intent.succeeded` webhook handler (Chunk D-3)
to:
1. Extract the `payment_method` ID from the SetupIntent event
2. Store it as `profiles.stripe_payment_method_id`

The hire-and-charge Edge Function reads
`profiles.stripe_payment_method_id` and passes it explicitly to
`PaymentIntent.create({ payment_method: ... })`.

This is a small Chunk D amendment — one column addition and ~3
lines in the existing webhook handler. Done as E-1/E-2 since it's
a prerequisite for E-3.

---

## SCA / Off-Session Fallback

When `PaymentIntent.create` with `off_session: true` fails because
the customer's card requires SCA (3D Secure), the PaymentIntent
enters `requires_action` status.

**SCA fallback flow:**
1. hire-and-charge Edge Function returns:
   `{ error: 'card_requires_action', client_secret: '...' }`
2. App shows: "Your bank requires additional verification for this
   payment. Please verify to complete the hire."
3. App calls `handleNextAction({ clientSecret })` from
   `@stripe/stripe-react-native` — opens 3DS challenge in-app
4. On 3DS success: PaymentIntent → `succeeded`, Edge Function
   resumes accept_bid flow
5. On 3DS failure: hire aborted, customer sees "Verification
   failed. Please try again or update your payment method."
6. Worker sees nothing until hire succeeds — no limbo state

**[Amendment 2] Expired-card fallback (sibling to SCA).**
PaymentIntent.create with `off_session: true` on an expired card
returns `card_declined` with `decline_code: 'expired_card'` — NOT
`requires_action`. The SCA path doesn't catch this.

When the Edge Function returns error code `expired_card` (or
`card_declined` with `decline_code: 'expired_card'`), the app
shows: "The card on file has expired. Please update your payment
method to complete this hire." Routes to
`/(tabs)/payment-setup?returnTo=<hire-return-path>`. On return,
customer retries the hire with the updated card.

Same atomic principle: either the hire succeeds (charge + accept
bid) or it doesn't happen. Worker is not affected — bid stays in
`pending` for the customer to retry.

**Prevalence:** SCA is primarily European. Expired cards are
universal — any card eventually expires. Building both fallbacks
now avoids production incidents.

---

## mark_completed Worker-Only Change — Footprint Audit

**Call sites for `mark_completed()`:**

| File | Line | Current behavior | Chunk E change |
|---|---|---|---|
| `app/(tabs)/job-chat.tsx` | 320 | `supabase.rpc('mark_completed', ...)` — either party can tap "MARK COMPLETED" (line 452-460) | Worker only: hide button if `currentUserId === chat.customer_id`. On success, status → `pending_confirmation`. |

That's the only call site. No other screen calls
`mark_completed`.

**New UI elements on job-chat.tsx for pending_confirmation:**

Customer (when `jobStatus === 'pending_confirmation'`):
- Banner with timer: "Work marked complete. Auto-releases in X."
- Two CTAs: CONFIRM COMPLETION + RAISE CONCERN
- Fee breakdown panel

Worker (when `jobStatus === 'pending_confirmation'`):
- Banner: "Waiting for customer confirmation."
- Timer display
- Fee breakdown panel
- No action buttons — worker waits

---

## pending_confirmation Status — Realtime Compatibility

| File | Status handling | Impact | Action |
|---|---|---|---|
| `job-chat.tsx:405-489` | Explicit switch on matched, in_progress, completed, cancelled | `pending_confirmation` has no case — **silent gap** | **Must add** case with confirm/dispute CTAs |
| `my-jobs.tsx:39-57` | `statusColor()` + `statusLabel()` with default fallback | Renders "PENDING_CONFIRMATION" in grey | **Should add** explicit case: amber, "AWAITING CONFIRMATION" |
| `my-applications.tsx:70-88` | `jobStatusColor()` + `jobStatusLabel()` with default | Same default | **Should add** explicit case |
| `market.tsx` | No status switching | No impact | None |
| `job-detail.tsx` | No status switching | No impact | None |
| `types/index.ts:9-10` | `JobStatus` type union | Must add `pending_confirmation` + `disputed` | **Must update** |

The jobs table has Realtime enabled. Status transitions fire
subscriptions. The UI files flagged above need updates in E-7/E-9.

---

## Cancellation Flow — Explicitly Out of Scope

Two cancellation scenarios are not designed in Chunk E:

**Customer cancels after hire but before work starts** (job is
`matched` or `in_progress`): requires Stripe Refund + job →
`cancelled` + notifications. `payments.escrow_status` → `refunded`.

**Worker no-shows** (job is `matched`, worker never marks
`in_progress`): requires customer-initiated cancellation, refund,
and potentially worker reputation penalty.

**Why not in Chunk E:** Both require refund automation,
cancellation reason tracking, and reputation impacts — each a
design surface. Chunk E's scope is the happy path + confirmation
window + disputes. Cancellation flows route to **Chunk F**
alongside earnings wallet UI and receipt generation.

**v1 manual answer:** Paata processes refunds via Stripe dashboard.
Payments row updated manually in Supabase.

---

## Stripe API Shape

### At Hire (accept_bid moment)

Edge Function: `hire-and-charge`

```
// 1. Look up job, bid, customer profile, worker profile
// 2. Calculate fees
const platformFeeCents = Math.round(agreedPriceCents * 0.10);
const workerPayoutCents = agreedPriceCents - platformFeeCents;

// 3. Create PaymentIntent
const paymentIntent = await stripe.paymentIntents.create({
  amount:              agreedPriceCents,
  currency:            'usd',
  customer:            customer.stripe_customer_id,
  payment_method:      customer.stripe_payment_method_id,
  confirm:             true,
  off_session:         true,
  capture_method:      'automatic',
  metadata: {
    job_id, customer_id, worker_id, platform: 'xprohub',
  },
});

// 4. Handle SCA failure
if (paymentIntent.status === 'requires_action') {
  return { error: 'card_requires_action',
           client_secret: paymentIntent.client_secret };
}

// 5. Handle expired card / decline
if (paymentIntent.status !== 'succeeded') {
  return { error: 'card_declined',
           decline_code: paymentIntent.last_payment_error?.decline_code };
}

// 6. On success: accept bid, store charge ID
const chargeId = paymentIntent.latest_charge;
```

### At Release (confirm_completion or auto-release)

Edge Function: `release-payment`

```
// 1. Look up payment row (has stripe_charge_id), worker profile
// 2. Create Transfer using charge ID (not PI ID)
const transfer = await stripe.transfers.create({
  amount:              workerPayoutCents,
  currency:            'usd',
  destination:         worker.stripe_account_id,
  source_transaction:  payment.stripe_charge_id,
  metadata: { job_id, payment_id },
});

// 3. Update DB via release_payment()
```

### application_fee_amount

Not used. In separate charges + transfers, the platform fee is
implicit: charge_amount - transfer_amount. Fee math handled at
application level, stored on payments row.

### Refund on Dispute (v1 — manual via Stripe dashboard)

Paata processes refunds manually. If a Transfer has already been
created, Stripe handles reversal mechanics.

---

## Schema Changes

### Migration: 20260515000001_chunk_e_payout_release.sql

**1. New column on profiles: stripe_payment_method_id**

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;
```

**2. New columns on payments:**

```sql
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_charge_id    TEXT,
  ADD COLUMN IF NOT EXISTS auto_release_at     timestamptz,
  ADD COLUMN IF NOT EXISTS disputed_at         timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_reason      text;
```

**3. Amend `mark_completed()` — worker-only,
pending_confirmation**

- Auth gate: caller must be `worker_id` (not either party)
- State transition: `in_progress` → `pending_confirmation`
- Side effect: set `payments.auto_release_at = now() +
  interval '72 hours'`

**4. New function: `confirm_completion(p_job_id UUID)`**

- Auth gate: caller must be `customer_id`
- State gate: job must be `pending_confirmation`
- Dispute gate: payment `disputed_at` must be NULL
- Transition: job → `completed`, `completed_at = now()`

**5. New function: `raise_dispute(p_job_id UUID, p_reason TEXT)`**

- Auth gate: caller must be `customer_id`
- State gate: job must be `pending_confirmation`
- Sets `payments.escrow_status = 'disputed'`,
  `disputed_at = now()`, `dispute_reason = p_reason`
- Sets `jobs.status = 'disputed'`
- Does NOT clear `auto_release_at`

**6. Update `types/index.ts`**

Add `'pending_confirmation'` and `'disputed'` to `JobStatus`.

---

## Build Sequence

```
E-1:  Schema migration — profiles.stripe_payment_method_id,
      payments.stripe_charge_id + auto_release columns,
      amend mark_completed (worker-only, pending_confirmation),
      new confirm_completion + raise_dispute functions.
      Update types/index.ts.

E-2:  Amend stripe-webhook setup_intent.succeeded handler —
      store payment_method ID on profiles alongside existing
      stripe_payment_method_added flag. (Small Chunk D amendment.)

E-3:  Edge Function — hire-and-charge
      (PaymentIntent creation, SCA + expired-card fallbacks,
      accept_bid call, store charge ID on payments row)

E-4:  Webhook handler — payment_intent.succeeded
      (Wire existing skeleton to create_payment_record.
      Store stripe_charge_id from latest_charge.)

E-5:  Edge Function — release-payment
      (Retrieve charge ID from payments row, create Stripe
      Transfer, call release_payment DB function)

E-6:  Webhook handler — transfer.created
      (Wire existing skeleton to release_payment DB function
      as idempotent backup confirmation)

E-7:  UI — job-chat.tsx updates:
      - Worker-only MARK COMPLETED (hide for customer)
      - pending_confirmation state: customer CONFIRM + RAISE
        CONCERN CTAs, worker "Waiting" banner, timer display
      - disputed state: both see dispute banner + contact info
      - Fee breakdown panel visible from matched state onward
        (not just pending_confirmation) [Amendment 1]
      - Expired-card error handling in hire flow [Amendment 2]

E-8:  UI — status label updates in my-jobs.tsx +
      my-applications.tsx for pending_confirmation + disputed

E-9:  Wire hire-and-charge into job-bids.tsx
      (Replace direct accept_bid RPC with Edge Function call.
      Handle SCA + expired-card fallbacks.)

E-10: Cloudflare Workers cron — process-auto-releases
      (Scheduled handler every 15 min calling Supabase
      Edge Function. Query + Transfer + DB update per job.)

E-11: Deploy all Edge Functions + iPhone end-to-end test
      (Both accounts, full hire-to-release cycle, auto-release
      timer verification, dispute flow verification)
```

---

## Test Criteria (E-11)

**Happy path:**
- Customer taps Hire on bid → card charged → bid accepted →
  other bids auto-declined → chat created
- Card decline at hire → bid NOT accepted, error shown
- Expired card at hire → routes to payment-setup, returnTo hire
  [Amendment 2]
- Worker marks in_progress → marks done → pending_confirmation
- Customer sees CONFIRM + RAISE CONCERN + timer + fee breakdown
- Worker sees fee breakdown from matched onward [Amendment 1]
- Customer taps CONFIRM → Transfer → worker paid → completed
- Fee breakdown: $[agreed] total, $[10%] fee, $[90%] earnings
- Stripe dashboard: matching PaymentIntent + Transfer, charge
  ID links them

**Auto-release:**
- Worker marks done, customer doesn't respond
- After 72 hours, cron fires → Transfer → released → completed
- Worker sees "You've been paid!" on next chat open

**Dispute:**
- Customer taps RAISE CONCERN → enters reason → disputed
- Timer paused (auto_release_at preserved, disputed_at set)
- Both see dispute banner with hello@xprohub.com
- Paata resolves → releases or refunds via dashboard

**SCA fallback:**
- Hire with 3DS test card → challenge appears → success → hire
- Failed 3DS → hire aborted, worker unaffected

**Two-account test:** Paata hires Khatuna, Khatuna completes,
Paata confirms → full cycle. Then reverse roles.

---

## Notes

- `agreed_price` set on `jobs` by `accept_bid()` (migration
  20260503). If null, hire-and-charge must fail.
- Existing `create_payment_record()` and `release_payment()`
  functions are idempotent. No changes to core logic.
- Operational learning from D-8: set webhook secrets via Supabase
  dashboard UI, not CLI.
- The Cloudflare Workers cron is the first external infrastructure
  dependency beyond Supabase + Stripe. Keep it minimal.
- `source_transaction` is the single most important Stripe
  implementation detail. Without it, Transfers fail during the
  2-day settlement window.

## Implementation Notes (E-12 testing)

- **Webhook destination events:** The Stripe webhook endpoint must
  subscribe to all 4 events: `setup_intent.succeeded` (D-3),
  `payment_intent.succeeded` (E-4), `payment_intent.payment_failed`
  (future), `transfer.created` (E-6). E-12 testing surfaced that
  only `setup_intent.succeeded` was subscribed from Chunk D — the
  three Chunk E events were never added during E-2/E-4/E-6 deploys.
  Easy to miss when webhook handler code and Stripe dashboard
  endpoint config are separate manual steps.
- **jobs_status_check constraint:** Migration 20260515000004 added
  `pending_confirmation` and `disputed` to the CHECK constraint on
  `jobs.status`. E-1 missed this because the constraint lived in
  the original schema (not in any migration we wrote). Lesson: when
  adding new enum-like values to a column, always check for CHECK
  constraints, not just application-level type definitions.

---

## Open Questions for Chat-Claude

1. Should Chunk G's customer-side ID requirement (POLISH_PASS
   Trust & Safety entry) move ahead of Chunk E? Disputes will
   surface concerns about anonymous customers.

2. Should the payments table get a `stripe_charge_id` column
   distinct from `stripe_payment_intent_id`? The v2 draft
   includes it — storing at payment creation avoids a Stripe
   API call per release. Trade-off: one column vs one API call.
