// ============================================================
// XProHub — Edge Function: hire-and-charge
// ============================================================
//
// Orchestrates the hire moment: charges the customer's card via
// PaymentIntent, then accepts the bid (which transitions the job
// to matched, auto-declines other bids, sets agreed_price, and
// creates the chat).
//
// Charge-then-accept ordering is a Locked Decision: the
// PaymentIntent must succeed BEFORE accept_bid fires. If the
// card declines, the bid stays pending and no state changes.
// Worker Dignity: the worker knows funds are secured before
// starting work.
//
// Payment record creation is handled by the payment_intent.succeeded
// webhook (E-4), not by this function. Single-writer pattern
// eliminates race conditions on retry.
//
// Two-call contract for SCA:
//   First call:  { bid_id } → may return requires_action + client_secret
//   Resume call: { bid_id, payment_intent_id } → skips charge creation,
//                retrieves existing PI, verifies succeeded, then accept_bid
//
// Related: docs/CHUNK_E_DESIGN.md
// ============================================================

import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "../_shared/stripe-client.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const serviceClient = createClient(
  SUPABASE_URL,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req: Request): Promise<Response> => {
  // ── Method check ───────────────────────────────────────────
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // ── Auth: verify JWT, get user ───────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Parse request body ───────────────────────────────────
    const { bid_id, payment_intent_id } = await req.json();
    if (!bid_id) {
      return new Response(
        JSON.stringify({ error: "bid_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Load bid + job + profiles ────────────────────────────
    const { data: bid, error: bidErr } = await serviceClient
      .from("bids")
      .select("id, status, proposed_price, worker_id, job_id")
      .eq("id", bid_id)
      .single();

    if (bidErr || !bid) {
      return new Response(
        JSON.stringify({ error: "Bid not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const { data: job, error: jobErr } = await serviceClient
      .from("jobs")
      .select("id, status, customer_id")
      .eq("id", bid.job_id)
      .single();

    if (jobErr || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Validate preconditions ───────────────────────────────

    // Auth: caller must be the customer on this job
    if (user.id !== job.customer_id) {
      return new Response(
        JSON.stringify({ error: "Not authorized — only the customer can hire" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // Bid must be pending
    if (bid.status !== "pending") {
      return new Response(
        JSON.stringify({ error: `Bid is not pending (current: ${bid.status})` }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    // Job must be open
    if (job.status !== "open") {
      return new Response(
        JSON.stringify({ error: `Job is not open (current: ${job.status})` }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    // Proposed price must exist
    if (!bid.proposed_price || bid.proposed_price <= 0) {
      return new Response(
        JSON.stringify({ error: "Bid has no valid proposed price" }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      );
    }

    // Load customer profile for Stripe IDs
    const { data: customerProfile, error: custErr } = await serviceClient
      .from("profiles")
      .select("stripe_customer_id, stripe_payment_method_id")
      .eq("id", user.id)
      .single();

    if (custErr || !customerProfile) {
      return new Response(
        JSON.stringify({ error: "Customer profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!customerProfile.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "No Stripe customer on file. Please add a payment method first." }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!customerProfile.stripe_payment_method_id) {
      return new Response(
        JSON.stringify({ error: "No payment method on file. Please add a card first." }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      );
    }

    // Load worker profile to confirm Stripe Express is active
    const { data: workerProfile, error: wrkErr } = await serviceClient
      .from("profiles")
      .select("stripe_account_id, stripe_charges_enabled")
      .eq("id", bid.worker_id)
      .single();

    if (wrkErr || !workerProfile) {
      return new Response(
        JSON.stringify({ error: "Worker profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!workerProfile.stripe_account_id || !workerProfile.stripe_charges_enabled) {
      return new Response(
        JSON.stringify({ error: "Worker's payment account is not active" }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Calculate fees ───────────────────────────────────────
    const agreedPriceCents = Math.round(bid.proposed_price * 100);
    const platformFeeCents = Math.round(agreedPriceCents * 0.10);
    const workerPayoutCents = agreedPriceCents - platformFeeCents;

    // ── Charge: create or resume PaymentIntent ───────────────
    let paymentIntent;

    if (payment_intent_id) {
      // SCA resume: retrieve existing PaymentIntent after
      // handleNextAction completed on the client
      console.log(
        `[hire-and-charge] Resuming SCA flow, retrieving PI=${payment_intent_id}`
      );

      paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

      if (paymentIntent.status !== "succeeded") {
        return new Response(
          JSON.stringify({
            error: "payment_not_completed",
            message: "Payment verification has not completed. Please try again.",
            status: paymentIntent.status,
          }),
          { status: 402, headers: { "Content-Type": "application/json" } },
        );
      }
    } else {
      // First call: create and confirm PaymentIntent
      console.log(
        `[hire-and-charge] Creating PaymentIntent: $${bid.proposed_price} ` +
        `for job ${job.id}, bid ${bid.id}, customer ${user.id}`
      );

      try {
        paymentIntent = await stripe.paymentIntents.create(
          {
            amount: agreedPriceCents,
            currency: "usd",
            customer: customerProfile.stripe_customer_id,
            payment_method: customerProfile.stripe_payment_method_id,
            confirm: true,
            off_session: true,
            capture_method: "automatic",
            metadata: {
              job_id: job.id,
              bid_id: bid.id,
              customer_id: user.id,
              worker_id: bid.worker_id,
              platform_fee_cents: String(platformFeeCents),
              worker_payout_cents: String(workerPayoutCents),
              platform: "xprohub",
            },
          },
          {
            idempotencyKey: `hire-${bid.id}-${customerProfile.stripe_payment_method_id}`,
          },
        );
      } catch (stripeErr: unknown) {
        // Stripe throws on immediate declines (off_session)
        const err = stripeErr as {
          type?: string;
          code?: string;
          decline_code?: string;
          message?: string;
          payment_intent?: { id?: string; client_secret?: string };
        };

        if (
          err.code === "authentication_required" ||
          err.code === "payment_intent_authentication_failure"
        ) {
          // SCA required — return client_secret for handleNextAction
          return new Response(
            JSON.stringify({
              error: "card_requires_action",
              client_secret: err.payment_intent?.client_secret ?? null,
              payment_intent_id: err.payment_intent?.id ?? null,
              message: "Your bank requires additional verification for this payment.",
            }),
            { status: 402, headers: { "Content-Type": "application/json" } },
          );
        }

        if (err.decline_code === "expired_card") {
          return new Response(
            JSON.stringify({
              error: "card_expired",
              message: "The card on file has expired. Please update your payment method to complete this hire.",
            }),
            { status: 402, headers: { "Content-Type": "application/json" } },
          );
        }

        // Generic decline
        console.error("[hire-and-charge] PaymentIntent failed:", err.message ?? err);
        return new Response(
          JSON.stringify({
            error: "card_declined",
            message: "Your card was declined. Please try a different payment method.",
            decline_code: err.decline_code ?? null,
          }),
          { status: 402, headers: { "Content-Type": "application/json" } },
        );
      }

      // Handle non-succeeded status (belt-and-suspenders)
      if (paymentIntent.status === "requires_action") {
        return new Response(
          JSON.stringify({
            error: "card_requires_action",
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            message: "Your bank requires additional verification for this payment.",
          }),
          { status: 402, headers: { "Content-Type": "application/json" } },
        );
      }

      if (paymentIntent.status !== "succeeded") {
        console.error(
          `[hire-and-charge] Unexpected PI status: ${paymentIntent.status}`
        );
        return new Response(
          JSON.stringify({
            error: "payment_failed",
            message: "Payment could not be completed. Please try again.",
          }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // ── Charge succeeded — accept bid ────────────────────────
    // Uses userClient so auth.uid() resolves correctly inside
    // accept_bid's SECURITY DEFINER customer auth check.
    console.log(
      `[hire-and-charge] PaymentIntent ${paymentIntent.id} succeeded, ` +
      `charge ${paymentIntent.latest_charge}. Accepting bid ${bid.id}`
    );

    let chatId: string | null = null;
    try {
      const { data: acceptResult, error: acceptErr } = await userClient
        .rpc("accept_bid", { p_bid_id: bid.id });

      if (acceptErr) throw acceptErr;
      chatId = (acceptResult as string | null) ?? null;
    } catch (acceptErr) {
      // CRITICAL: charge succeeded but accept_bid failed.
      // Attempt automatic refund to avoid charging without hiring.
      console.error(
        "[hire-and-charge] accept_bid FAILED after charge succeeded. " +
        `PI=${paymentIntent.id}. Attempting refund.`,
        acceptErr
      );

      try {
        await stripe.refunds.create({ payment_intent: paymentIntent.id });
        console.log(
          `[hire-and-charge] Refund succeeded for PI=${paymentIntent.id}`
        );
      } catch (refundErr) {
        // Refund also failed — requires manual intervention
        console.error(
          `[hire-and-charge][CRITICAL] Refund FAILED for PI=${paymentIntent.id}. ` +
          "Manual intervention required via Stripe dashboard.",
          refundErr
        );
      }

      return new Response(
        JSON.stringify({
          error: "hire_failed",
          message: "The hire could not be completed. Your card has been refunded.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Success ──────────────────────────────────────────────
    console.log(
      `[hire-and-charge] Hire complete. Job ${job.id} matched, ` +
      `chat ${chatId}, PI=${paymentIntent.id}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        chat_id: chatId,
        payment_intent_id: paymentIntent.id,
        charge_id: paymentIntent.latest_charge,
        amount_cents: agreedPriceCents,
        platform_fee_cents: platformFeeCents,
        worker_payout_cents: workerPayoutCents,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[hire-and-charge] Unexpected error:", err);
    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "Something went wrong. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
