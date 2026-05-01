# Chunk C — Payment Account Setup (Design)

Status: Design revised 2026-05-01 to reflect dual-role architecture.
Original worker-only model superseded. Q1 and Q3 resolved; Q2 reframed
for the two-component apply gate; Q4 confirmed. All decisions resolved
as of 2026-05-01.

Captured: 2026-05-01 | Revised: 2026-05-01

---

# C-1 Design Proposal — Payment Account Setup

---

## Dual-Role Architecture

XProHub is a hub for X (various) professionals. Every user is both
customer and worker — there is no role fork at sign-up, no permanent
assignment to either side. A user who posts a job today applies for
one tomorrow. The app does not distinguish "a customer" from "a
worker" at the account level.

This changes how payment setup is framed:

- **Not:** "Worker onboarding" — a gate before workers can participate
- **Instead:** "Payment account setup" — infrastructure any user
  needs at the moment they transact

Two separate Stripe objects are involved across the dual role:

- **Stripe Express account** (worker side) — for receiving payment
  after completing a job. Set up via stripe-connect.tsx (Chunk C).
- **Customer payment method** (customer side) — for funding escrow
  when posting a job. Spec and UI are Chunk D scope.

The stripe-connect.tsx screen and this C-1 document cover the Stripe
Express account (worker side). The customer payment method gate is
noted in the Gate Specifications below; its implementation details
are deferred to Chunk D.

---

## Gate Specifications

All gates fire only at the moment of action. No persistent banners,
no nags on Home, no upfront requirements beyond sign-up. Users browse,
build their professional identity, and read the market freely.

| Action | ID Gate | Stripe Gate | Notes |
|---|---|---|---|
| Sign up | — | Offered, skippable | Express account offered but not required |
| Browse Live Market | — | — | Fully open to all signed-in users |
| Post a job | — | Customer payment method (Chunk D) | Checks payment method on file |
| Apply for a job | Required: photo + >=1 skill | Required: stripe_charges_enabled | ID check fires first; both must pass |
| Chat | — | — | Opens after hire; both parties already cleared |
| Hire / acceptance | — | — | Triggers charge (Chunk D); both sides verified |

**Action continuity (locked):** When a gate interrupts an action,
completing the gate returns the user to exactly the screen they came
from — the apply form pre-populated for the specific job, the post-job
form with their drafted content preserved. Never drop the user on Home.

**Why chat has no gate:** Chat opens only when a customer hires a
worker. At that point both parties have already cleared all required
gates — the customer's payment method was verified at post time, the
worker cleared ID + Stripe Express at apply time. No additional check
is needed when the chat thread opens.

**Hire moment = charge moment (Chunk D context):** When a customer
hires a worker, the customer's card is charged and funds are held in
escrow. The worker is confirmed paid before work begins — this is the
Worker Dignity constraint enforced at the data layer. The gate
architecture positions all checks before this moment so that by hire
time, both sides are fully verified.

---

## 1. Screen Location

**Recommendation: Dedicated connect screen reachable only from gate
points — no persistent banner anywhere.**

The stripe-connect.tsx screen is not proactively surfaced. It has no
persistent link on Home, no banner in My Applications, no item in a
settings menu. Users reach it in one of three ways:

```
Entry Point 1 — Apply gate (worker side, Chunk C scope)
  User taps APPLY on a job card in market.tsx.
  apply.tsx runs two checks in sequence:
    (1) ID gate: photo set AND >=1 skill category claimed
    (2) Stripe gate: stripe_charges_enabled = true
  If either check fails, the gate fires and routes to the
  appropriate setup screen. On completion, returns to the
  apply form for the specific job.

Entry Point 2 — Sign-up offer (optional, skippable)
  During sign-up flow, Stripe Express account setup is offered
  as an optional step. User can skip and complete it later at
  their first apply attempt.

Entry Point 3 — Post gate (customer side, Chunk D scope)
  Customer posts a job — checked against payment method on file.
  Routes to customer Stripe setup (separate from stripe-connect.tsx,
  spec in Chunk D). Noted here for completeness.
```

**Why no persistent banner:**

The original C-1 design proposed a permanent banner at the top of My
Applications. That was designed for a worker-first model where payment
setup was part of "becoming a worker." In the dual-role architecture,
Stripe Express setup is infrastructure, not identity. Surfacing it
proactively adds friction without value on a screen the user may visit
for entirely unrelated reasons (checking bid status, browsing
categories). The gate at the moment of action is cleaner and more
honest — it fires exactly when the user has established intent.

**The mission filter:** Users who are ready to work discover the setup
naturally when they try to apply. They are not ambushed by reminders
while doing something else.

---

## 2. Screen States

The connect screen renders different content based on four fields read
from the **user's** profile row: `stripe_account_id` (existing
column), `stripe_charges_enabled`, `stripe_payouts_enabled`,
`stripe_onboarding_completed_at`.

These states apply specifically to the Stripe Express account (worker
side). Customer payment method state is handled in Chunk D.

---

### State 1 — Not Started

**Condition:** `stripe_account_id IS NULL`

This is the default for all users who have never tapped the payment
setup flow.

```
Eyebrow:  GET PAID SETUP
Heading:  UNLOCK YOUR EARNINGS
Body:     Connect your bank account and you're ready to earn on
          any job on XProHub. It takes about 2 minutes. Stripe
          handles the secure verification — we never see your
          bank details.

CTA:      [ GET VERIFIED -> ]    <- gold filled button, full width
```

What "GET VERIFIED" does is covered in Section 3.

---

### State 2 — In Progress

**Condition:** `stripe_account_id IS NOT NULL AND
               stripe_onboarding_completed_at IS NULL`

This covers two sub-cases: the user started the Stripe form but
exited before finishing, OR the user finished the form and we're
waiting for the `account.updated` webhook to confirm. We cannot
distinguish these from DB state alone, so the message covers both.

```
Eyebrow:  VERIFICATION IN PROGRESS
Heading:  ALMOST DONE
Body:     Your account is being reviewed. This usually takes a
          few minutes. If you stepped away before finishing,
          tap below to pick up where you left off.

Status chip:  [ IN PROGRESS ]    <- outlined chip, gold border

CTA:      [ CONTINUE SETUP -> ]    <- outlined gold button, full width
          (smaller, less prominent than State 1 -- less urgency)

Sub-note: "Waiting for confirmation..." with a subtle pulse
          indicator if the user just returned from Stripe.
          (Fades out after 10 seconds if webhook hasn't fired.)
```

What "CONTINUE SETUP" does: calls `create-onboarding-link` only
(account already exists), opens the returned URL. No account creation
step needed.

---

### State 3 — Charges Enabled, Payouts Pending

**Condition:** `stripe_charges_enabled = true AND
               stripe_payouts_enabled = false`

Stripe approved the account for charges but bank payout verification
is still running. Users can have their bids accepted and payment held
in escrow at this point. They just cannot receive payout yet.

```
Eyebrow:  ALMOST THERE
Heading:  VERIFIED — PAYOUTS PENDING
Body:     You're verified and ready to earn. Your bank account
          is being confirmed — payouts usually go live within
          1-2 business days. Nothing you need to do.

Status chip:  [ CHARGES ACTIVE ]    <- outlined chip, green border

No primary CTA.
Optional secondary:  "VIEW STRIPE DASHBOARD"  <- small text link
                     (deferred -- see Resolved Decisions)
```

---

### State 4 — Fully Verified

**Condition:** `stripe_charges_enabled = true AND
               stripe_payouts_enabled = true`

```
Eyebrow:  PAYMENT ACCOUNT
Heading:  YOU'RE ALL SET
Body:     Your earnings will be deposited directly to your
          bank after each completed job. Minus XProHub's 10%
          platform fee.

Status chip:  [ VERIFIED ]    <- outlined chip, green border

No required CTA.
Optional:  "VIEW STRIPE DASHBOARD"  <- small text link
           (deferred -- see Resolved Decisions)
```

---

## 3. The CTA Flow

### Not Started — "GET VERIFIED"

```
1. Button enters loading state (gold ActivityIndicator, button disabled)
2. Call create-stripe-account Edge Function (C-2)
   -- Body: { user_id: user's Supabase UID }
   -- Returns: { stripe_account_id }
3. On success: stripe_account_id is now saved to profiles row
   (C-2 does this write)
4. Immediately call create-onboarding-link Edge Function (C-3)
   -- Body: { stripe_account_id, return_url: "xprohub://stripe-return",
              refresh_url: "xprohub://stripe-refresh" }
   -- Returns: { url }
5. Call Linking.openURL(url) -- opens Stripe's hosted form in
   device browser
6. App goes to background. User fills out Stripe form.
7. User completes form -> Stripe redirects to xprohub://stripe-return
8. Deep link handler (C-5) intercepts and brings app to foreground
9. Screen re-reads profile from Supabase, shows State 2
   ("Waiting for confirmation..." pulse indicator)
10. account.updated webhook fires (C-6) -> flips DB columns ->
    screen refreshes to State 3 or 4
```

### In Progress — "CONTINUE SETUP"

```
1. Button enters loading state
2. Call create-onboarding-link only
   (stripe_account_id already on profile)
3. Linking.openURL(url)
4. Same deep link return flow as above
```

The reason we regenerate the link (not cache the URL): Stripe Account
Links expire after a few minutes. Always generate a fresh one on tap.

### Charges Enabled, Payouts Pending

No required CTA. State is informational only. If we add a Stripe
Dashboard link later, the flow is: call a `create-stripe-dashboard-link`
Edge Function then Linking.openURL(result). Out of scope for Chunk C.

### Fully Verified

Same as above — informational only. No action required.

---

## 4. Error States

### Network error during create-stripe-account

What happens: the Edge Function request fails (no internet, Supabase
cold start, Stripe API down).

```
Message:  "We couldn't connect right now. Check your connection
           and try again."

State:    Button returns to "GET VERIFIED" (not loading, not
          disabled). No state change to the profile -- nothing
          was written. User can retry immediately.

Tone:     The problem is the network, not the user. Do not say
          "Something went wrong on our end" (blame-shifting) or
          "Error 503" (technical). Just a plain human sentence.
```

### Network error during create-onboarding-link

Same handling as above. If the Stripe account was created in step 2
but step 4 (onboarding link) fails, the screen will show State 2 on
next load (account exists, onboarding not complete). The "CONTINUE
SETUP" button in State 2 regenerates the link, so the user can
recover naturally.

### Stripe rejects the user (country/eligibility issue)

This should be extremely rare for US-based users in the NYC launch.
Stripe Express fully supports US workers. But if `create-stripe-account`
returns a Stripe error indicating eligibility:

```
Message:  "We need a moment to sort out your account. Please
           email support@xprohub.com and we'll get it handled
           quickly."

Tone:     The system needs human review, not the user. Do NOT
          say "you were rejected" or "your account was declined."
          Say "we need to sort this out together."

State:    Return to State 1 CTA so they can contact support,
          but don't disable the button (they might try again
          after resolving via support).
```

### User exits Stripe browser without completing

The deep link `xprohub://stripe-return` fires when Stripe navigates
to the return URL — this happens whether the user completed the form
or tapped "Back" / closed the browser mid-flow. We cannot distinguish
these at the URL level.

Handling when the deep link fires and webhook has not yet confirmed:

```
State 2 shows ("VERIFICATION IN PROGRESS")
Body:    "Your account is being reviewed. This usually takes a
          few minutes. If you stepped away before finishing, tap
          below to pick up where you left off."
CTA:     "CONTINUE SETUP"
```

If the user genuinely didn't finish, "CONTINUE SETUP" generates a
fresh link and they complete the form. If they finished and the
webhook just hasn't fired yet, they wait and the screen will update
when it does. The message covers both cases honestly.

### User taps Apply before completing required gates (two-component check)

The apply gate in `apply.tsx` runs two checks in sequence before the
form loads. Each check can fail independently.

**Check 1 — ID gate** (runs first):

```
Condition: profile photo not set OR no skill categories claimed

Gate card:
  Heading:  SET UP YOUR PROFILE
  Body:     To apply for jobs, add a photo and claim at least
            one skill. It takes about a minute — and customers
            are more likely to hire workers with a complete
            profile.

  CTA:      [ SET UP PROFILE -> ]    <- routes to id.tsx
  Secondary: [ BACK TO JOBS ]         <- pops back to market

  On complete: return to apply form for this specific job
```

**Check 2 — Stripe gate** (runs after ID check passes):

```
Condition: stripe_charges_enabled = false

Gate card:
  Heading:  ONE MORE STEP
  Body:     To apply for paid jobs, connect your payment account
            first. It takes about 2 minutes — and then you're
            ready to earn on every job.

  CTA:      [ SET UP PAYOUTS -> ]    <- routes to stripe-connect.tsx
  Secondary: [ BACK TO JOBS ]         <- pops back to market

  On complete: return to apply form for this specific job
```

Both gates use a hard block — the apply form does not load until both
checks pass. This is the MVP choice: clean, simple, prevents the state
where bids are accepted but the worker has no payout account or no
visible identity. See Open Questions — Q2 if you want to reconsider.

**Tone for both:** Empowering, not punishing. The user is one step
away from being fully ready. Do not say "you can't apply until..." —
say "here's what unlocks everything."

---

## 5. Visual Design

Everything stays in the locked Dark Gold system. No new patterns
invented — components are assembled from what already exists in the
codebase.

### Background and surfaces

- Screen background: `#0E0E0F`
- Content card (the main status card): `#171719`, `borderWidth: 1`,
  `borderColor: #2E2E33` — same as every other card in the app
- Gold-glow variant for State 1 (not started, needs attention):
  `borderColor: #C9A84C`, `backgroundColor: #C9A84C1A` — same
  treatment as `catTileActive` in `id.tsx` (the pending rename of
  `become-worker.tsx` per dual-role architecture decisions)

### Typography hierarchy

```
Eyebrow:  #C9A84C, 11px, fontWeight 700, letterSpacing 3
          -- matches id.tsx's `eyebrow` style exactly
             (currently become-worker.tsx until rename lands)
          e.g. "GET PAID SETUP"

Heading:  #C9A84C, 28px, fontWeight bold, letterSpacing 2
          -- matches id.tsx's `heading` style
          e.g. "UNLOCK YOUR EARNINGS"
          -- Oswald font family if loaded, system bold fallback

Subhead:  #888890, 13px, lineHeight 19
          -- matches id.tsx's `subhead` style
          1-2 sentences of plain English body

Body:     #888890, 14px, lineHeight 20
          -- same as emptySub in my-applications.tsx
```

Playfair Display is not appropriate here — that's the serif editorial
font (taglines and inspirational text). This is transactional/
functional UI. Oswald/bold is right.

### Status indicator — 3-step progress track

A horizontal row of three labeled dots, positioned between the heading
and the body text. State coloring:

```
State 1 (not started):    o  o  o   (all empty, gold border)
State 2 (in progress):    *  o  o   (first filled gold)
State 3 (charges active): *  *  o   (two filled, third outline)
State 4 (fully verified): *  *  *   (all filled green)

Label below each dot (10px, textSecondary):
  "Account"    "Verified"    "Payouts"
```

This echoes the Belt System's progression philosophy — visible forward
movement, not just a binary gate.

### Status chip / badge

Uses the `statusBadge` pattern from my-applications.tsx:

```
borderWidth: 1.5
borderRadius: 999 (pill)
paddingHorizontal: 9
paddingVertical: 3

State 1: hidden (no chip until something is in motion)
State 2: [ IN PROGRESS ]    gold border, gold text
State 3: [ CHARGES ACTIVE ] green border, green text
State 4: [ VERIFIED ]       green border, green text
```

### CTA buttons

Primary (State 1 — high urgency):

```
backgroundColor: #C9A84C
borderRadius: Radius.md
paddingVertical: 16
color: #0E0E0F (background on gold)
fontWeight: bold, fontSize: 15, letterSpacing: 1.5
-- exact match to `continueBtn` in id.tsx (become-worker.tsx)
```

Secondary (State 2 — medium urgency):

```
borderWidth: 1.5
borderColor: #C9A84C
borderRadius: Radius.full
paddingVertical: 10
paddingHorizontal: 28
color: #C9A84C
-- exact match to `retryBtn` in my-applications.tsx
```

---

## Proposed File Location

```
app/(tabs)/stripe-connect.tsx
```

Register in `app/(tabs)/_layout.tsx`:

```
<Tabs.Screen
  name="stripe-connect"
  options={{ ...headerDefaults, headerShown: true, title: 'GET PAID',
             headerLeft: () => <BackButton /> }}
/>
```

Title "GET PAID" — short, mission-aligned, empowering. "PAYMENT SETUP"
sounds bureaucratic. "GET PAID" says what the user cares about.
Confirmed per Q4 resolution.

---

## Flow Diagram

```
ENTRY POINTS — gate-only, no persistent banner

  apply.tsx (user applies to a job)
    Check 1: ID gate -- photo set AND >=1 skill claimed?
      NO  ->  id.tsx (profile / business card setup)
              On complete: return to apply form for this job
    Check 2: Stripe gate -- stripe_charges_enabled = true?
      NO  ->  stripe-connect.tsx
              On complete: return to apply form for this job
      YES ->  Apply form loads normally

  post.tsx (user posts a job)
    Check: Customer payment method on file? (Chunk D scope)
      NO  ->  [customer Stripe setup -- Chunk D spec]
              On complete: return to post form, content preserved
      YES ->  Post submits normally

  Sign-up (optional path)
    Stripe Express setup offered but skippable.
    Skip -> user completes at first apply attempt.


HAPPY PATH -- stripe-connect.tsx (Stripe Express account)

  +─────────────────────────+
  | STATE 1 -- NOT STARTED  |
  | UNLOCK YOUR EARNINGS    |
  | o  o  o  progress dots  |
  | [GET VERIFIED ->]       |
  +────────────┬────────────+
               |
               | tap
         +─────+─────+
         |           |
         v           v
 C-2: create-    network error
 stripe-account  -> show message,
         |          restore CTA
         v
 C-3: create-
 onboarding-link
         |
         v
 Linking.openURL(stripeUrl)
 +───────────────────────+
 |  Stripe-hosted form   |
 |  (device browser)     |
 +───────────┬───────────+
             |
             | user completes
             | or exits
             v
 xprohub://stripe-return
 (deep link -- C-5)
             |
             v
  +─────────────────────────+
  | STATE 2 -- IN PROGRESS  |
  | ALMOST DONE             |
  | *  o  o  progress dots  |
  | [CONTINUE SETUP ->]     |
  +─────────────────────────+
             ^
             |
             | account.updated
             | webhook (C-6) fires
             | -> DB columns updated
             v
  STATE 3 or 4 (screen auto-refreshes)
  +─────────────────────────+
  | STATE 4 -- FULLY DONE   |
  | YOU'RE ALL SET          |
  | *  *  *  (green)        |
  | [ VERIFIED ] chip       |
  | no CTA required         |
  +─────────────────────────+


TWO-COMPONENT APPLY GATE (apply.tsx)

  User taps APPLY on job card
          |
          v
  Check 1: ID gate
  photo set AND >=1 skill claimed?
          |
    +─────+──────────+
    |                |
    | NO             | YES
    v                v
  +────────────────────+   Check 2: Stripe gate
  | SET UP YOUR        |   stripe_charges_enabled?
  | PROFILE            |         |
  | photo + skill      |   +─────+──────────+
  | needed             |   |                |
  | [SET UP PROFILE -> |   | NO             | YES
  | [BACK TO JOBS]     |   v                v
  +────────────────────+ +────────────────────+  Apply form
  On complete: return  | | ONE MORE STEP      |  loads
  to apply form for    | | connect payouts    |  normally
  this specific job    | | [SET UP PAYOUTS -> |
                       | | [BACK TO JOBS]     |
                       | +────────────────────+
                       | On complete: return
                       | to apply form for
                       | this specific job
```

---

## Open Questions

All architectural decisions resolved as of 2026-05-01. See
Resolved Decisions below.

---

## Resolved Decisions

**Q2 (reframed) — Two-component apply gate: hard block or soft warn
for each component?**
**Resolved: Hard block on both components.**
- Stripe gate: hard block — bids accepted without a payout
  account create the exact Worker Dignity violation the
  platform exists to prevent.
- ID gate: hard block — workers without photo + skill claim
  compete unfairly. Soft warn would let them invest time on
  bids that get filtered out by customers, which hurts workers
  more than the gate does. MVP cost (one photo + one skill
  tap) is small; worker gets a fair shot in return.
- Revisit if post-launch evidence shows disproportionate
  drop-off at photo-upload step.

**Q1 — Does become-worker route to stripe-connect after finishing?**
**Resolved: No change needed.** `become-worker.tsx` (pending rename:
`id.tsx`) continues routing to Live Market after the user sets up
their professional identity. Stripe Express setup fires at the moment
of action (apply), not as part of identity setup. No routing change
required.

**Q3 — Stripe Dashboard link in State 4 — is it Chunk C scope?**
**Resolved: Deferred to polish pass.** Requires a fourth Edge Function
(`create-stripe-dashboard-link`). State 4 is "you're done, go earn"
— users don't need dashboard access for MVP.

**Q4 — Screen title in the header: confirm "GET PAID"?**
**Resolved: "GET PAID" confirmed.** Short, mission-aligned, empowering.
Applies equally to workers (receiving payment) and to the general
sense that value is exchanged. Locked.
