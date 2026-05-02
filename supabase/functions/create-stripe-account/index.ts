// supabase/functions/create-stripe-account/index.ts
//
// Creates a Stripe Express account for the authenticated user and writes
// the resulting account ID to their profiles row.
//
// Security model:
//   - verify_jwt = true in config.toml: Supabase rejects unauthenticated
//     requests before this code runs.
//   - User ID is extracted from the verified JWT via auth.getUser() — never
//     from the request body. Prevents account-takeover.
//   - Idempotent: if stripe_account_id is already set on the profile, the
//     existing ID is returned without calling Stripe.
//   - DB write uses service role key, scoped to WHERE id = <verified user id>.
//     Service role bypasses RLS; the WHERE clause is the security boundary.
//   - serviceClient is initialized at module level (cold-start once, not per
//     request). Service role keys carry no per-user state, so this is safe
//     and more efficient than per-request init.

import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from '@supabase/supabase-js'
import { stripe } from '../_shared/stripe-client.ts'

// Validate required env vars at module load time (fail-fast on misconfiguration).
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are auto-injected
// by Supabase into all Edge Functions — no manual secrets set required.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    '[create-stripe-account] Missing required Supabase env vars. ' +
    'SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY must all be present.'
  )
}

// Service role client — created once at module level, reused across requests.
// Used for: (a) reading stripe_account_id for the idempotency check, and
// (b) writing the new stripe_account_id after Stripe account creation.
// Bypasses RLS. Every query is scoped to WHERE id = <verified user id>.
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req: Request): Promise<Response> => {

  // 1. Method guard — this function accepts POST only.
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 2. Extract Authorization header.
  //    With verify_jwt = true, Supabase blocks requests without a valid JWT
  //    before reaching this code. This check is a defensive fallback.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('[create-stripe-account] Missing or malformed Authorization header')
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 3. Resolve the authenticated user.
  //    User-context client passes the request's JWT to Supabase Auth.
  //    auth.getUser() returns the verified user including their email,
  //    which we use for the Stripe account creation call below.
  //    Created per-request (not at module level) because it depends on
  //    the Authorization header from this specific request.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } }
  })

  const { data: { user }, error: authError } = await userClient.auth.getUser()

  if (authError || !user) {
    console.error(
      '[create-stripe-account] auth.getUser failed:',
      authError?.message ?? 'no user returned'
    )
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const userId = user.id

  // 4. Idempotency check — read the user's current stripe_account_id.
  //    If one exists, return it immediately without calling Stripe.
  //    This prevents creating duplicate Express accounts if the user
  //    taps GET VERIFIED more than once (e.g. after a restart).
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    console.error(
      `[create-stripe-account] No profile found for user ${userId}:`,
      profileError?.message
    )
    return new Response(
      JSON.stringify({ error: 'Profile not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (profile.stripe_account_id) {
    console.log(`[create-stripe-account] Returning existing account for user ${userId}`)
    return new Response(
      JSON.stringify({ stripe_account_id: profile.stripe_account_id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 5. Create a Stripe Express account.
  //    Minimum fields for US Express accounts:
  //      type: 'express'          — locked decision
  //      country: 'US'           — locked, NYC launch scope
  //      email: user.email       — optional but recommended so Stripe can
  //                                 send the user onboarding emails
  //      capabilities            — card_payments + transfers, both requested
  //    business_type is deliberately omitted: letting Stripe collect it
  //    during the hosted form avoids pre-committing individual vs. company
  //    before the user has indicated which applies to them.
  let stripeAccountId: string

  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: user.email ?? undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })
    stripeAccountId = account.id
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(
      `[create-stripe-account] stripe.accounts.create failed for user ${userId}:`,
      message
    )
    return new Response(
      JSON.stringify({ error: 'Stripe account creation failed. Please try again.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 6. Write the new Stripe account ID to the user's profile row.
  //    Service role is required because RLS does not permit users to UPDATE
  //    stripe_* columns on their own profile.
  //    .eq('id', userId) scopes this to the authenticated user's row only —
  //    service role bypasses RLS, so this WHERE clause is the enforcement.
  const { error: updateError } = await serviceClient
    .from('profiles')
    .update({ stripe_account_id: stripeAccountId })
    .eq('id', userId)

  if (updateError) {
    console.error(
      `[create-stripe-account] DB update failed for user ${userId}:`,
      updateError.message
    )
    // The Stripe account was created but the ID wasn't persisted to our DB.
    // Log the account ID for manual recovery if the user contacts support.
    console.error(
      `[create-stripe-account] Orphaned Stripe account: ${stripeAccountId} for user ${userId}`
    )
    return new Response(
      JSON.stringify({ error: 'Failed to save account information. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 7. Return the new account ID.
  //    The caller (stripe-connect.tsx, C-4) passes this directly to
  //    create-onboarding-link (C-3) to open the Stripe hosted form.
  return new Response(
    JSON.stringify({ stripe_account_id: stripeAccountId }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
