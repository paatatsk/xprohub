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
  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,      // tolerance: SDK default (300 seconds)
      cryptoProvider  // Deno-compatible async crypto provider
    )
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

        // Skip if already true (idempotent — Stripe may retry)
        if (custProfile.stripe_payment_method_added) {
          console.log(`[stripe-webhook] stripe_payment_method_added already true for profile ${custProfile.id} — skipping`)
          break
        }

        const { error: custUpdateError } = await serviceClient
          .from('profiles')
          .update({ stripe_payment_method_added: true })
          .eq('stripe_customer_id', customerId)

        if (custUpdateError) {
          throw new Error(
            `[stripe-webhook] DB update failed for customer ${customerId}: ${custUpdateError.message}`
          )
        }

        console.log(`[stripe-webhook] stripe_payment_method_added set to true for profile ${custProfile.id}`)
        break
      }

      case 'payment_intent.succeeded':
        // Chunk D — Customer payment confirmed; mark escrow held in payments table.
        console.log('[stripe-webhook] payment_intent.succeeded — handler wired in Chunk D')
        break

      case 'payment_intent.payment_failed':
        // Chunk D — Payment attempt failed; notify customer, handle job state.
        console.log('[stripe-webhook] payment_intent.payment_failed — handler wired in Chunk D')
        break

      case 'transfer.created':
        // Chunk E — Platform transferred funds to worker's Express account.
        // Marks payout complete in payments table.
        console.log('[stripe-webhook] transfer.created — handler wired in Chunk E')
        break

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
