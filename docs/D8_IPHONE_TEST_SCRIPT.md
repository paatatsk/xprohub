# D-8: iPhone End-to-End Test Script

**Chunk D — Customer Payment Method Gate**
**Prepared:** 2026-05-14
**Tester:** Paata (primary), Khatuna (second account)
**Estimated time:** 20–30 minutes

This script verifies the full Chunk D flow on a real iPhone.
Read it through once before starting. Every step has an expected
outcome — if reality diverges, stop and note what happened.

---

## Pre-Test Checklist (5 minutes)

Open these before you start. You will tab between them during
the test.

- [ ] **Terminal:** Run `npx expo start --clear` in the
      xprohub-v3 directory. Wait for the Metro QR code.
- [ ] **iPhone:** Open the EAS dev client app. Scan the QR
      code. Wait for the app to load on the Home screen.
- [ ] **Browser tab 1 — Supabase Table Editor:**
      `https://supabase.com/dashboard/project/ygnpjmldabewzogyrjbb/editor`
      Navigate to the `profiles` table. You will check the
      `stripe_payment_method_added` column here.
- [ ] **Browser tab 2 — Supabase Edge Function Logs:**
      `https://supabase.com/dashboard/project/ygnpjmldabewzogyrjbb/functions/stripe-webhook/logs`
      This is where webhook log lines appear after PaymentSheet
      completes. If this URL shows "page not found", navigate
      from the Functions tab in the Supabase sidebar.
- [ ] **Browser tab 3 — Stripe Dashboard (XProHub sandbox):**
      `https://dashboard.stripe.com/test/webhooks`
      Shows webhook delivery attempts and responses. Useful if
      the Edge Function log is empty (means Stripe never sent
      the event). Confirm you're on the XProHub sandbox account
      (top of dashboard shows "Sandbox" indicator, not the empty
      duplicate account).
- [ ] **Verify starting state:** In the profiles table, confirm
      `stripe_payment_method_added` is `false` for Paata's
      account. If it is already `true` from a prior test, set
      it back to `false` manually in the Supabase Table Editor
      (click the cell, change to false, save).

---

## Test Card Numbers

Stripe sandbox accepts these test cards. Use any future
expiry date (e.g. 12/29) and any 3-digit CVC (e.g. 123).

| Card | Number | Behaviour |
|---|---|---|
| **Visa (happy path)** | `4242 4242 4242 4242` | Always succeeds |
| Visa (decline) | `4000 0000 0000 0002` | Always declines — use for edge case testing only |
| Visa (3D Secure) | `4000 0025 0000 3155` | Triggers authentication prompt — optional test |

Use the first card (4242) for all primary tests.

---

## Test 1: Happy Path — NOT_ADDED to ADDED

**Account:** Paata
**Goal:** Submit a job without a payment method, get gated,
add a card, return, and post the job successfully.

1. Open the app on iPhone. You should see the Home screen.

2. Tap **HELP WANTED** or any category card to reach Live Market.

3. Tap the **+ Post a Job** FAB (floating button).

4. **Fill in real job details** — not placeholder text. This
   data will be used to verify form state preservation later.
   - Pick a category (e.g. Home Cleaning)
   - Select at least one task
   - Title: `Test job for D-8 verification`
   - Neighborhood: `Bushwick`
   - Budget min: `50`, max: `150`
   - Timing: `ASAP`
   - Description: `Testing the payment gate flow end to end`

5. **Remember what you entered.** Take a screenshot of the
   filled form. You will compare this after the round trip.

6. Tap **SUBMIT**.

7. **Expected:** You are routed to the PAYMENT SETUP screen.
   You should see:
   - Eyebrow: `PAYMENT SETUP`
   - Heading: `ADD A PAYMENT METHOD`
   - Body text mentioning Stripe
   - Gold **ADD CARD →** button
   - Gold border glow on the card

   **If instead the job posts directly:** The gate is broken.
   Stop. Note this as a failure. See Troubleshooting section.

8. Tap **ADD CARD →**.

9. **Expected:** The Stripe PaymentSheet slides up from the
   bottom of the screen. It shows a card entry form with
   fields for card number, expiry, CVC, and country.

   **If the sheet doesn't appear:** See Troubleshooting.

10. Enter the test card:
    - Card number: `4242 4242 4242 4242`
    - Expiry: `12/29`
    - CVC: `123`
    - ZIP/postal: `10001` (or any 5-digit code)

11. Tap the PaymentSheet's **Save** / **Confirm** button.

12. **Expected:** PaymentSheet dismisses. The screen shows a
    brief "Confirming your card..." state with a spinner.
    Within a few seconds (up to ~8 seconds), it should
    transition to the ADDED state:
    - Heading: `YOU'RE ALL SET`
    - Green badge: `CARD ADDED`
    - Gold button: `CONTINUE TO POST →`

    **If "Confirming..." spins for more than 10 seconds:**
    The polling timed out. You should see a soft message
    ("Your card was saved successfully. Confirmation is
    taking a moment.") and a CHECK STATUS button. Tap it.
    See Troubleshooting if the flag never flips.

13. Tap **CONTINUE TO POST →**.

14. **Expected:** You return to the Post a Job screen.

15. **FORM STATE PRESERVATION CHECK (D-5 deferred item):**
    Compare the form to your screenshot from step 5.
    - Category: still selected?
    - Tasks: still checked?
    - Title: still `Test job for D-8 verification`?
    - Neighborhood: still `Bushwick`?
    - Budget: still `50` / `150`?
    - Timing: still `ASAP`?
    - Description: still populated?

    **If any field is blank:** The tab screen was unmounted
    during the round trip. Note exactly which fields are
    blank. This is not a blocker (the job can still be
    posted manually) but flags a follow-up "save draft"
    pattern. Record this as a partial pass.

16. Tap **SUBMIT** again.

17. **Expected:** This time the gate passes (card is now on
    file). The job posts, and you are navigated to Live
    Market. You should see your job in the Jobs Feed.

    **If you bounce to payment-setup again:** The webhook
    hasn't flipped the flag yet. Check Supabase profiles
    table — is `stripe_payment_method_added` still false?
    See Troubleshooting.

**Test 1 result:** PASS / FAIL / PARTIAL (note details)

---

## Test 2: Verify Flag Flip in DB

**Do this immediately after Test 1.**

1. Switch to **Browser tab 1** (Supabase Table Editor,
   profiles table).

2. Find Paata's row. Check the `stripe_payment_method_added`
   column.

3. **Expected:** `true`.

   **If false:** The webhook didn't fire or didn't update the
   row. Proceed to Test 3 to diagnose.

**Test 2 result:** PASS / FAIL

---

## Test 3: Verify Webhook Logs (D-3 Dual-Secret Verification)

**Do this immediately after Test 2.**

1. Switch to **Browser tab 2** (Supabase Edge Function logs
   for stripe-webhook).

2. Look for recent log entries (within the last few minutes).
   You are looking for three specific log lines:

   **Line A (event received):**
   ```
   [stripe-webhook] setup_intent.succeeded for customer cus_...
   ```
   This confirms Stripe sent the event and the Edge Function
   received it.

   **Line B (flag updated):**
   ```
   [stripe-webhook] stripe_payment_method_added set to true for profile ...
   ```
   This confirms the DB update succeeded.

   **Line C (dual-secret path — D-3 deferred verification):**
   ```
   [stripe-webhook] Primary secret failed, trying platform secret
   ```
   This line appears BEFORE lines A and B. It means the Edge
   Function tried the Connected accounts secret first (which
   doesn't match this event), then fell back to the platform
   secret (which does match). **This line confirms the D-3
   dual-secret architecture works as designed.**

   If you see Line C followed by Lines A and B, the dual-secret
   verification is confirmed. If you only see Lines A and B
   (without Line C), it means the primary secret matched first
   — which is unexpected for a setup_intent event but not a
   failure. Note which lines you saw.

3. **If no log lines appear at all:** Switch to Browser tab 3
   (Stripe Dashboard webhooks). Check if the
   `setup_intent.succeeded` event was delivered. Look at the
   delivery status — did Stripe get a 200 response?
   - If Stripe shows "Failed": the Edge Function crashed.
     Check the full Edge Function log for error details.
   - If Stripe shows "Pending": the event hasn't been sent yet.
     Wait a minute and refresh.
   - If no event appears at all: the PaymentSheet may not have
     completed successfully. Check the Stripe Customers page
     for a new SetupIntent.

4. **Screenshot the three log lines** for the test debrief.

**Test 3 result:** PASS (all 3 lines) / PARTIAL (A+B only) / FAIL (no lines)

---

## Test 4: Already-ADDED User Skips Gate

**Account:** Paata (same account, card now on file)
**Goal:** Confirm that a user with a payment method already on
file bypasses the gate entirely.

1. Stay signed in as Paata.

2. Navigate to Post a Job.

3. Fill in any job details (can be quick — this test is about
   the gate, not the form).

4. Tap **SUBMIT**.

5. **Expected:** The job posts directly. No bounce to
   payment-setup. You are navigated to Live Market with
   the new job visible.

   **If you bounce to payment-setup:** The gate is reading
   the flag incorrectly. Check `stripe_payment_method_added`
   in the profiles table — it should be `true`.

**Test 4 result:** PASS / FAIL

---

## Test 5: Second Account (Khatuna)

**Account:** Khatuna
**Goal:** Verify the flow works on a second user account,
confirming the gate is per-user, not global.

1. Sign out of Paata's account.

2. Sign in as Khatuna.

3. Navigate to Post a Job. Fill in job details.

4. Tap **SUBMIT**.

5. **If Khatuna has no payment method:** You should bounce to
   payment-setup. Run the same flow as Test 1 steps 7–17.
   Use the same test card (4242...).

6. **If Khatuna already has a payment method:** The job
   should post directly (same as Test 4).

7. After the test, check the profiles table for Khatuna's
   row — `stripe_payment_method_added` should be `true`.

**Test 5 result:** PASS / FAIL

---

## Edge Cases (Optional, Time Permitting)

### Cancel PaymentSheet
1. Start the Add Card flow (tap ADD CARD on payment-setup).
2. When the PaymentSheet appears, tap the **X** or swipe down
   to dismiss it.
3. **Expected:** Return to idle state on payment-setup. No
   error message. The ADD CARD button is still tappable.

### PaymentSheet Decline
1. Start the Add Card flow.
2. Enter the decline test card: `4000 0000 0000 0002`,
   any expiry, any CVC.
3. **Expected:** PaymentSheet shows a decline error. Dismiss
   it. The payment-setup screen shows an error message:
   "Something went wrong. Please try again."

### Back Button on Payment Setup
1. While on the payment-setup screen (before tapping ADD CARD),
   tap the **‹** back button in the header.
2. **Expected:** Returns to Home (or the returnTo destination).

---

## Troubleshooting

**Submit doesn't bounce to payment-setup (gate not firing):**
- Check profiles table: is `stripe_payment_method_added`
  already `true`? If so, reset it to `false` and retry.
- Check Metro terminal for JS errors on submit.
- Verify post.tsx has the gate code: search for
  `stripe_payment_method_added` in the terminal output or
  check `app/(tabs)/post.tsx` line 222.

**PaymentSheet doesn't open:**
- Check Metro terminal for errors after tapping ADD CARD.
- Likely cause: create-setup-intent Edge Function returned
  an error. Check Supabase Edge Function logs for
  `create-setup-intent`.
- Verify the EAS dev client build includes the Stripe native
  module (it should — built 2026-05-11 with Stripe plugin in
  app.json).

**"Confirming..." spins forever / polling timeout:**
- The webhook hasn't flipped the flag within 7.5 seconds
  (5 polls × 1.5s interval).
- Check Browser tab 2 (Edge Function logs) — did the webhook
  event arrive?
- Check Browser tab 3 (Stripe webhooks) — did Stripe send it?
- If Stripe sent it but the Edge Function log is empty: the
  function may have crashed. Check for error logs.
- If Stripe didn't send it: check that the "XProHub D-3
  setup_intent.succeeded" endpoint is ACTIVE in the Stripe
  webhooks page (scope: Your account).
- Tap CHECK STATUS when it appears. If the flag has since
  flipped, the screen will update to ADDED state.

**Job posts even though no card added (gate broken):**
- This means the gate in post.tsx is not executing. Check
  that commit `0e7a26b` is in the running code: in the
  Metro terminal, verify the latest bundle includes the
  gate logic at post.tsx line 222.
- Restart Metro with `npx expo start --clear` and re-scan
  the QR code.

**Form fields empty after returning from payment-setup:**
- This is the D-5 form state preservation question. The tab
  screen may have been unmounted during navigation.
- Record which fields are blank.
- This does NOT block Chunk D closure — the job can still be
  filled in and posted. It flags a follow-up "save draft"
  pattern for a future polish pass.
- If ALL fields are blank, the component was fully remounted.
  If only SOME are blank, there may be a selective state issue.

---

## What to Record

After completing all tests, note the following for the debrief
session with Claude Code:

- [ ] Test 1 (happy path): PASS / FAIL / PARTIAL
- [ ] Test 2 (DB flag flip): PASS / FAIL
- [ ] Test 3 (webhook logs): PASS / PARTIAL / FAIL
  - Line A (event received): YES / NO
  - Line B (flag updated): YES / NO
  - Line C (dual-secret path): YES / NO
- [ ] Test 4 (skip gate): PASS / FAIL
- [ ] Test 5 (second account): PASS / FAIL
- [ ] Form state preservation: ALL PRESERVED / PARTIAL / ALL BLANK
- [ ] Edge cases tested: which ones, results
- [ ] Screenshots: payment-setup screen, YOU'RE ALL SET state,
      Edge Function logs showing the three key lines
- [ ] Any UX issues noticed (layout, timing, copy, animations)
- [ ] Metro terminal errors (copy-paste any red text)
