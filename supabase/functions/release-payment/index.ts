// ============================================================
// XProHub — Edge Function: release-payment
// ============================================================
//
// Creates a Stripe Transfer to move funds from the platform
// balance to the worker's Express account, then updates the
// payment record via release_payment() DB function.
//
// Two calling paths:
//   Path A — customer_confirm: customer taps CONFIRM COMPLETION
//     in E-7 UI. App calls confirm_completion RPC first (job →
//     completed), then calls this function. Authenticated via
//     user JWT. Validates caller is customer on the job.
//   Path B — auto_release: Cloudflare Workers cron (E-11) calls
//     this when auto_release_at has passed. Authenticated via
//     X-Service-Secret header matching RELEASE_PAYMENT_SECRET.
//     Job stays pending_confirmation — release_payment() DB
//     function auto-completes it atomically.
//
// source_transaction uses stripe_charge_id from the payments
// row (stored by E-4 webhook). No Stripe API call to retrieve
// the charge ID — locked design decision.
//
// Related: docs/CHUNK_E_DESIGN.md
// ============================================================

import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "../_shared/stripe-client.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const RELEASE_PAYMENT_SECRET = Deno.env.get("RELEASE_PAYMENT_SECRET")!;

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
    // ── Parse request body ───────────────────────────────────
    const { job_id, mode } = await req.json();

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: "job_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (mode !== "customer_confirm" && mode !== "auto_release") {
      return new Response(
        JSON.stringify({ error: "mode must be 'customer_confirm' or 'auto_release'" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Path-specific auth ───────────────────────────────────
    let callerUserId: string | null = null;

    if (mode === "customer_confirm") {
      // Path A: require valid user JWT
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

      const { data: { user }, error: userErr } = await userClient.auth.getUser();
      if (userErr || !user) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }
      callerUserId = user.id;
    } else {
      // Path B: require service secret
      const secret = req.headers.get("X-Service-Secret");
      if (!secret || secret !== RELEASE_PAYMENT_SECRET) {
        return new Response(
          JSON.stringify({ error: "Invalid service secret" }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // ── Load job + payment + worker ──────────────────────────
    const { data: job, error: jobErr } = await serviceClient
      .from("jobs")
      .select("id, status, customer_id, worker_id")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const { data: payment, error: payErr } = await serviceClient
      .from("payments")
      .select("id, escrow_status, stripe_charge_id, worker_payout, platform_fee, disputed_at")
      .eq("job_id", job_id)
      .single();

    if (payErr || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment record not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Path-specific validation ─────────────────────────────

    if (mode === "customer_confirm") {
      // Caller must be customer
      if (callerUserId !== job.customer_id) {
        return new Response(
          JSON.stringify({ error: "Not authorized — only the customer can release payment" }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }
      // Job must be completed (confirm_completion already called)
      if (job.status !== "completed") {
        return new Response(
          JSON.stringify({ error: `Job not completed (current: ${job.status})` }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }
    } else {
      // Auto-release: job must be pending_confirmation
      if (job.status !== "pending_confirmation") {
        return new Response(
          JSON.stringify({ error: `Job not pending confirmation (current: ${job.status})` }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }
      // Must not be disputed (defense-in-depth — cron should filter this)
      if (payment.disputed_at) {
        return new Response(
          JSON.stringify({ error: "Cannot auto-release — dispute is active" }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }
      // Timer expiry is checked by the cron's SQL query (E-11).
      // Edge Function trusts the cron's selection.
    }

    // ── Common validation ────────────────────────────────────

    // Idempotent: already released → success
    if (payment.escrow_status === "released") {
      console.log(`[release-payment] Payment ${payment.id} already released — idempotent return`);
      return new Response(
        JSON.stringify({ success: true, already_released: true }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (payment.escrow_status !== "held") {
      return new Response(
        JSON.stringify({ error: `Payment not in held state (current: ${payment.escrow_status})` }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!payment.stripe_charge_id) {
      return new Response(
        JSON.stringify({ error: "Payment missing stripe_charge_id — cannot create Transfer" }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      );
    }

    // Load worker's Express account
    const { data: worker, error: wrkErr } = await serviceClient
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", job.worker_id)
      .single();

    if (wrkErr || !worker?.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: "Worker Stripe account not found" }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Create Stripe Transfer ───────────────────────────────
    const workerPayoutCents = Math.round(payment.worker_payout * 100);

    console.log(
      `[release-payment] Creating Transfer: $${payment.worker_payout} ` +
      `to ${worker.stripe_account_id} for job ${job_id}, ` +
      `source_transaction=${payment.stripe_charge_id}`
    );

    let transfer;
    try {
      transfer = await stripe.transfers.create(
        {
          amount: workerPayoutCents,
          currency: "usd",
          destination: worker.stripe_account_id,
          source_transaction: payment.stripe_charge_id,
          metadata: {
            job_id: job.id,
            payment_id: payment.id,
            platform: "xprohub",
          },
        },
        {
          idempotencyKey: `release-${payment.id}`,
        },
      );
    } catch (stripeErr: unknown) {
      const err = stripeErr as { message?: string; code?: string };
      console.error(
        `[release-payment] Transfer failed for payment ${payment.id}: `,
        err.message ?? err
      );
      return new Response(
        JSON.stringify({
          error: "transfer_failed",
          message: "Payment release failed. Please try again or contact support.",
          stripe_error: err.message ?? null,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Update DB via release_payment() ──────────────────────
    // release_payment() is idempotent and handles the
    // pending_confirmation → completed transition for auto-release.
    console.log(
      `[release-payment] Transfer ${transfer.id} created. Updating DB.`
    );

    const { error: releaseErr } = await serviceClient
      .rpc("release_payment", {
        p_job_id: job_id,
        p_stripe_transfer_id: transfer.id,
        p_worker_payout: payment.worker_payout,
        p_platform_fee: payment.platform_fee,
      });

    if (releaseErr) {
      // CRITICAL: Transfer succeeded but DB update failed.
      // Money has moved to worker. Do NOT reverse the Transfer.
      // Log for manual reconciliation.
      console.error(
        `[release-payment][CRITICAL] DB update failed after Transfer ${transfer.id} ` +
        `succeeded for payment ${payment.id}. ` +
        "Manual reconciliation required via Supabase dashboard.",
        releaseErr
      );
      return new Response(
        JSON.stringify({
          error: "release_db_failed",
          message: "Payment was sent to the worker but our records could not be updated. Contact support.",
          transfer_id: transfer.id,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Success ──────────────────────────────────────────────
    console.log(
      `[release-payment] Release complete. Payment ${payment.id} → released, ` +
      `Transfer ${transfer.id}, worker payout $${payment.worker_payout}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        transfer_id: transfer.id,
        worker_payout: payment.worker_payout,
        platform_fee: payment.platform_fee,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[release-payment] Unexpected error:", err);
    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "Something went wrong. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
