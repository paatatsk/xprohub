// supabase/functions/stripe-webhook/index.ts
//
// Stripe webhook handler. Receives all Stripe events for XProHub, verifies
// the HMAC signature, and routes to the appropriate handler.
//
// B-6 scope: signature verification + event routing skeleton only.
// Individual event handlers (account.updated, payment_intent.*, transfer.*)
// are wired in Chunks C, D, and E respectively.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"

import type Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { createClient } from '@supabase/supabase-js'
import { stripe, cryptoProvider } from '../_shared/stripe-client.ts'

// Validate STRIPE_WEBHOOK_SECRET at module import time (fail-fast).
// Only this function uses the webhook secret — the check lives here, not in
// stripe-client.ts (see B-5 design notes on minimum coupling).
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

if (!webhookSecret) {
  throw new Error(
    '[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set or is empty. ' +
    'Run: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...'
  )
}

// Platform-side webhook secret — optional. When set, the function
// can verify events from a second Stripe webhook endpoint scoped to
// "Your account" (e.g. setup_intent.succeeded). When absent, only
// the primary Connected accounts secret is used (no regression).
// See docs/CHUNK_D_DESIGN.md "Webhook Architecture" section.
const webhookSecretPlatform = Deno.env.get('STRIPE_WEBHOOK_SECRET_PLATFORM') || null

// Service role client — module level, reused across requests.
// Used by account.updated handler to write stripe_* columns on profiles.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req: Request): Promise<Response> => {

  // 1. Check for Stripe signature header first — reject unsigned requests
  //    before doing any body-reading work.
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'Missing stripe-signature header' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 2. Read raw body. Must happen before any other body reads — body stream
  //    is consumed once. req.text() decodes as UTF-8, which is lossless for
  //    Stripe's JSON payloads and preserves the exact bytes that were signed.
  const body = await req.text()

  // 3. Verify signature and construct event.
  //    constructEventAsync is required on Deno — the sync variant uses Node's
  //    crypto module which is not available in this runtime. cryptoProvider
  //    supplies Deno's Web Crypto API to the SDK (5th argument; tolerance
  //    is 4th and left as undefined to use the SDK default of 300 seconds).
  //    Empty or malformed bodies are caught here naturally — Stripe never
  //    signs empty bodies, so verification fails and returns 400 below.
  //
  //    Dual-secret verification: XProHub has two Stripe webhook endpoints
  //    (Connected accounts + Your account) pointing to this single Edge
  //    Function. Each endpoint has its own signing secret. Try the primary
  //    secret first; if it fails and a platform secret is configured, retry
  //    with that. If both fail, return 400.
  let event: Stripe.Event

  try {
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,      // tolerance: SDK default (300 seconds)
        cryptoProvider  // Deno-compatible async crypto provider
      )
    } catch (primaryErr) {
      // Primary secret failed. If no platform secret is configured,
      // this is the only secret — rethrow to hit the outer catch.
      if (!webhookSecretPlatform) throw primaryErr

      // Platform secret is configured — retry verification with it.
      console.log('[stripe-webhook] Primary secret failed, trying platform secret')
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecretPlatform,
        undefined,
        cryptoProvider
      )
    }
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err)
    return new Response(
      JSON.stringify({ error: 'Webhook signature verification failed' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 4. Route verified event to handler.
  //    Unhandled event types return 200 — Stripe expects acknowledgement for
  //    all events it sends, even ones we don't act on. Non-200 causes retries.
  try {
    switch (event.type) {

      case 'account.updated': {
        // Chunk C — Worker's Stripe Express account status changed.
        // Syncs charges_enabled and payouts_enabled to profiles row.
        const account = event.data.object as Stripe.Account
        const acctId = account.id

        console.log(
          `[stripe-webhook] account.updated for ${acctId}: ` +
          `charges_enabled=${account.charges_enabled}, payouts_enabled=${account.payouts_enabled}`
        )

        // Read current row to check stripe_onboarding_completed_at (first-time-only logic).
        const { data: profile, error: readError } = await serviceClient
          .from('profiles')
          .select('stripe_onboarding_completed_at')
          .eq('stripe_account_id', acctId)
          .single()

        if (readError || !profile) {
          console.warn(`[stripe-webhook] No profile found for stripe_account_id=${acctId} — skipping`)
          break
        }

        // Build update payload. stripe_onboarding_completed_at is set once:
        // first time charges_enabled flips to true.
        const updatePayload: Record<string, unknown> = {
          stripe_charges_enabled: account.charges_enabled ?? false,
          stripe_payouts_enabled: account.payouts_enabled ?? false,
        }

        if (account.charges_enabled && !profile.stripe_onboarding_completed_at) {
          updatePayload.stripe_onboarding_completed_at = new Date().toISOString()
        }

        const { data: updated, error: updateError } = await serviceClient
          .from('profiles')
          .update(updatePayload)
          .eq('stripe_account_id', acctId)
          .select('id')

        if (updateError) {
          throw new Error(`[stripe-webhook] DB update failed for ${acctId}: ${updateError.message}`)
        }

        if (!updated || updated.length === 0) {
          console.warn(`[stripe-webhook] Update matched 0 rows for stripe_account_id=${acctId}`)
        } else {
          console.log(`[stripe-webhook] Updated profile ${updated[0].id} for ${acctId}`)
        }

        break
      }

      case 'setup_intent.succeeded': {
        // Chunk D — Customer saved a payment method via PaymentSheet.
        // Flips stripe_payment_method_added = true on the matching profile.
        const setupIntent = event.data.object as Stripe.SetupIntent
        const customerId = setupIntent.customer as string
        const paymentMethodId = setupIntent.payment_method as string | null

        console.log(
          `[stripe-webhook] setup_intent.succeeded for customer ${customerId}`
        )

        if (!customerId) {
          console.error('[stripe-webhook] setup_intent.succeeded missing customer ID — skipping')
          break
        }

        // Look up profile by stripe_customer_id (not user ID — webhook
        // events identify the Stripe Customer, not the Supabase user).
        const { data: custProfile, error: custReadError } = await serviceClient
          .from('profiles')
          .select('id, stripe_payment_method_added')
          .eq('stripe_customer_id', customerId)
          .single()

        if (custReadError || !custProfile) {
          console.error(
            `[stripe-webhook] No profile found for stripe_customer_id=${customerId}:`,
            custReadError?.message
          )
          throw new Error(`No profile for customer ${customerId}`)
        }

        // Idempotency: skip if already added. Note — this also means
        // stripe_payment_method_id won't refresh on card changes. Revisit
        // at E-3 when expired-card fallback flow is wired.
        if (custProfile.stripe_payment_method_added) {
          console.log(`[stripe-webhook] stripe_payment_method_added already true for profile ${custProfile.id} — skipping`)
          break
        }

        const { error: custUpdateError } = await serviceClient
          .from('profiles')
          .update({
            stripe_payment_method_added: true,
            ...(paymentMethodId ? { stripe_payment_method_id: paymentMethodId } : {}),
          })
          .eq('stripe_customer_id', customerId)

        if (custUpdateError) {
          throw new Error(
            `[stripe-webhook] DB update failed for customer ${customerId}: ${custUpdateError.message}`
          )
        }

        console.log(`[stripe-webhook] stripe_payment_method_added set to true for profile ${custProfile.id}, payment_method=${paymentMethodId ?? 'none'}`)
        break
      }

      case 'payment_intent.succeeded': {
        // Chunk E — Customer payment captured at hire. Creates the
        // payments row with escrow_status = 'held' via create_payment_record.
        // Single-writer: this webhook is the SOLE writer for payment records.
        // hire-and-charge Edge Function (E-3) does charge → accept_bid only.
        const pi = event.data.object as Stripe.PaymentIntent
        const jobId = pi.metadata?.job_id
        const feeCentsStr = pi.metadata?.platform_fee_cents
        const payoutCentsStr = pi.metadata?.worker_payout_cents

        // Guard: skip PaymentIntents not created by hire-and-charge
        if (!jobId || !feeCentsStr || !payoutCentsStr) {
          console.log(
            `[stripe-webhook] payment_intent.succeeded for ${pi.id} — ` +
            'missing XProHub metadata, likely external event. Skipping.'
          )
          break
        }

        const feeCents = parseInt(feeCentsStr, 10)
        const payoutCents = parseInt(payoutCentsStr, 10)

        if (isNaN(feeCents) || isNaN(payoutCents)) {
          console.warn(
            `[stripe-webhook] payment_intent.succeeded for ${pi.id} — ` +
            `invalid metadata: fee=${feeCentsStr}, payout=${payoutCentsStr}. Skipping.`
          )
          break
        }

        // Convert cents → dollars for NUMERIC(10,2) columns
        const amountDollars = pi.amount / 100
        const feeDollars = feeCents / 100
        const payoutDollars = payoutCents / 100

        console.log(
          `[stripe-webhook] payment_intent.succeeded for ${pi.id}: ` +
          `job=${jobId}, amount=$${amountDollars}, fee=$${feeDollars}, payout=$${payoutDollars}`
        )

        // Create payment record. State gate inside the function requires
        // job.status = 'matched'. If the webhook arrives before accept_bid
        // completes (race between Stripe delivery and Edge Function RPC),
        // the function raises an exception → Stripe retries with backoff
        // (~5 min), by which time accept_bid will have completed.
        const { data: paymentId, error: createErr } = await serviceClient
          .rpc('create_payment_record', {
            p_job_id: jobId,
            p_stripe_payment_intent_id: pi.id,
            p_amount: amountDollars,
            p_platform_fee: feeDollars,
            p_worker_payout: payoutDollars,
          })

        if (createErr) {
          throw new Error(
            `[stripe-webhook] create_payment_record failed for PI ${pi.id}: ${createErr.message}`
          )
        }

        // Store stripe_charge_id on the payment row (needed by E-5
        // release-payment for Transfer source_transaction).
        const chargeId = typeof pi.latest_charge === 'string'
          ? pi.latest_charge
          : (pi.latest_charge as any)?.id ?? null

        if (chargeId && paymentId) {
          const { error: chargeUpdateErr } = await serviceClient
            .from('payments')
            .update({ stripe_charge_id: chargeId })
            .eq('id', paymentId)

          if (chargeUpdateErr) {
            throw new Error(
              `[stripe-webhook] Failed to set stripe_charge_id on payment ${paymentId}: ${chargeUpdateErr.message}`
            )
          }
          console.log(
            `[stripe-webhook] stripe_charge_id=${chargeId} set on payment ${paymentId}`
          )
        }

        console.log(
          `[stripe-webhook] Payment record created: id=${paymentId} for PI ${pi.id}`
        )
        break
      }

      case 'payment_intent.payment_failed':
        // Chunk D — Payment attempt failed; notify customer, handle job state.
        console.log('[stripe-webhook] payment_intent.payment_failed — handler wired in Chunk D')
        break

      case 'transfer.created': {
        // Chunk E — Idempotent backup for release-payment Edge Function (E-5).
        // Primary writer is the Edge Function. This webhook covers the
        // [CRITICAL] path: Transfer succeeded but Edge Function's DB call
        // to release_payment failed. On the happy path, release_payment
        // exits early at the idempotency check (escrow_status = 'released').
        const xfer = event.data.object as Stripe.Transfer
        const xferJobId = xfer.metadata?.job_id
        const xferPaymentId = xfer.metadata?.payment_id

        // Guard: skip Transfers not created by release-payment
        if (!xferJobId || !xferPaymentId) {
          console.log(
            `[stripe-webhook] transfer.created for ${xfer.id} — ` +
            'missing XProHub metadata, likely external transfer. Skipping.'
          )
          break
        }

        console.log(
          `[stripe-webhook] transfer.created for ${xfer.id}: ` +
          `job=${xferJobId}, payment=${xferPaymentId}`
        )

        // Read worker_payout and platform_fee from the payments row
        const { data: xferPayment, error: xferPayErr } = await serviceClient
          .from('payments')
          .select('worker_payout, platform_fee')
          .eq('id', xferPaymentId)
          .single()

        if (xferPayErr || !xferPayment) {
          throw new Error(
            `[stripe-webhook] Payment row ${xferPaymentId} not found for transfer ${xfer.id}: ` +
            (xferPayErr?.message ?? 'no data')
          )
        }

        // Call release_payment — idempotent. If Edge Function already
        // updated DB, this exits clean at escrow_status = 'released' check.
        const { error: xferReleaseErr } = await serviceClient
          .rpc('release_payment', {
            p_job_id: xferJobId,
            p_stripe_transfer_id: xfer.id,
            p_worker_payout: xferPayment.worker_payout,
            p_platform_fee: xferPayment.platform_fee,
          })

        if (xferReleaseErr) {
          throw new Error(
            `[stripe-webhook] release_payment failed for transfer ${xfer.id}: ${xferReleaseErr.message}`
          )
        }

        console.log(
          `[stripe-webhook] release_payment confirmed for transfer ${xfer.id}, payment ${xferPaymentId}`
        )
        break
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error('[stripe-webhook] Handler error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Acknowledge receipt. Stripe marks the event delivered on 200.
  return new Response(
    JSON.stringify({ received: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
