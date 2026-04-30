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

      case 'account.updated':
        // Chunk C — Worker's Stripe Express account status changed.
        // Updates profiles.stripe_onboarding_complete and stripe_charges_enabled.
        console.log('[stripe-webhook] account.updated — handler wired in Chunk C')
        break

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
