// ============================================================
// XProHub — Edge Function: cancel-hire
// ============================================================
//
// Cancels a matched hire: refunds the customer's PaymentIntent,
// resets the job to 'open' so it can collect new applications,
// and leaves a system-style message in the existing chat.
//
// Either party (customer or worker) can cancel while the job is
// still in 'matched' state (before work begins). Once work is
// in_progress, cancellation is no longer available — the dispute
// flow handles that.
//
// Stripe model: the charge is a standard PaymentIntent on the
// platform balance (no destination charge). No Transfer has been
// created yet (that happens at release). A simple PI refund
// returns the full amount to the customer.
//
// Ordering: refund FIRST, then DB mutations. If the refund fails,
// the DB stays untouched (matched + held) and the client can
// retry. If DB mutations fail after a successful refund, the
// payment row stays 'held' — manual reconciliation required, but
// the customer has their money back.
//
// Related: hire-and-charge (charge model), release-payment
// (transfer model), cancel_job (open-only cancel RPC).
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
    const { job_id } = await req.json();
    if (!job_id) {
      return new Response(
        JSON.stringify({ error: "job_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Load job ─────────────────────────────────────────────
    const { data: job, error: jobErr } = await serviceClient
      .from("jobs")
      .select("id, status, customer_id, worker_id, agreed_price")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Auth gate: caller must be customer or worker ─────────
    const isCustomer = user.id === job.customer_id;
    const isWorker = user.id === job.worker_id;

    if (!isCustomer && !isWorker) {
      return new Response(
        JSON.stringify({ error: "Not authorized" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── State gate: must be matched ──────────────────────────
    if (job.status !== "matched") {
      return new Response(
        JSON.stringify({
          error: "not_cancellable",
          message:
            "This job can no longer be cancelled. If there is a problem, use Raise a Concern.",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Load payment row (held escrow) ───────────────────────
    const { data: payment, error: payErr } = await serviceClient
      .from("payments")
      .select("id, stripe_payment_intent_id, amount, escrow_status")
      .eq("job_id", job_id)
      .eq("escrow_status", "held")
      .single();

    if (payErr || !payment) {
      // Webhook may not have fired yet — PI is charged but no
      // payments row exists. Do NOT guess at Stripe state.
      return new Response(
        JSON.stringify({
          error: "payment_processing",
          message:
            "Payment is still processing — try again in a moment.",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!payment.stripe_payment_intent_id) {
      return new Response(
        JSON.stringify({
          error: "missing_payment_intent",
          message: "Payment record is incomplete — contact support.",
        }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Refund: full PI refund ────────────────────────────────
    // Refund FIRST, before any DB mutations. If this fails, the
    // DB stays consistent (matched + held) and the client retries.
    console.log(
      `[cancel-hire] Refunding PI=${payment.stripe_payment_intent_id} ` +
        `for job ${job_id}, caller=${user.id} (${isCustomer ? "customer" : "worker"})`,
    );

    try {
      await stripe.refunds.create(
        { payment_intent: payment.stripe_payment_intent_id },
        { idempotencyKey: `cancel-${payment.id}` },
      );
      console.log(
        `[cancel-hire] Refund succeeded for PI=${payment.stripe_payment_intent_id}`,
      );
    } catch (refundErr: unknown) {
      const err = refundErr as { message?: string };
      console.error(
        `[cancel-hire][CRITICAL] Refund FAILED for PI=${payment.stripe_payment_intent_id}. ` +
          "Manual intervention required via Stripe dashboard.",
        err,
      );
      return new Response(
        JSON.stringify({
          error: "refund_failed",
          message:
            "Could not process the refund. Please try again or contact support.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── DB mutations (refund succeeded) ──────────────────────
    // Order: payment → bid → job → chat message.
    // If any step fails after refund, log CRITICAL for manual
    // reconciliation — customer has their money back regardless.

    // 5a. Payment: escrow_status → refunded
    const { error: payUpdateErr } = await serviceClient
      .from("payments")
      .update({ escrow_status: "refunded" })
      .eq("id", payment.id);

    if (payUpdateErr) {
      console.error(
        `[cancel-hire][CRITICAL] Payment update failed after refund. ` +
          `Payment ${payment.id} still shows 'held' but Stripe refund succeeded. ` +
          "Manual reconciliation required.",
        payUpdateErr,
      );
      // Continue — the customer has been refunded, so we should
      // still try to reset the job. Worst case: payment row is
      // stale but job is back to open.
    }

    // 5b. Bid: set the accepted bid's status
    //     Customer cancelling → 'declined'; Worker cancelling → 'withdrawn'
    const newBidStatus = isWorker ? "withdrawn" : "declined";
    const { error: bidErr } = await serviceClient
      .from("bids")
      .update({ status: newBidStatus })
      .eq("job_id", job_id)
      .eq("status", "accepted");

    if (bidErr) {
      console.error(
        `[cancel-hire] Bid status update failed for job ${job_id}:`,
        bidErr,
      );
      // Non-fatal: job reset is more important
    }

    // 5c. Job: reset to open, clear worker assignment, refresh expiry
    const { error: jobUpdateErr } = await serviceClient
      .from("jobs")
      .update({
        status: "open",
        worker_id: null,
        agreed_price: null,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", job_id);

    if (jobUpdateErr) {
      console.error(
        `[cancel-hire][CRITICAL] Job reset failed after refund. ` +
          `Job ${job_id} still shows 'matched' but refund succeeded. ` +
          "Manual intervention required.",
        jobUpdateErr,
      );
      return new Response(
        JSON.stringify({
          error: "partial_failure",
          message:
            "Your refund was processed but the job could not be reopened. Contact support.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // 5d. Chat: insert a system-style message and update chat metadata
    const systemMessage = "This hire was cancelled and the job has been reposted.";

    // Find the chat for this job
    const { data: chat, error: chatErr } = await serviceClient
      .from("chats")
      .select("id")
      .eq("job_id", job_id)
      .maybeSingle();

    if (!chatErr && chat) {
      // Insert message — use caller's ID as sender (no system-user infra)
      const { error: msgErr } = await serviceClient
        .from("messages")
        .insert({
          chat_id: chat.id,
          sender_id: user.id,
          content: systemMessage,
          message_type: "text",
        });

      if (msgErr) {
        console.error(
          `[cancel-hire] Message insert failed for chat ${chat.id}:`,
          msgErr,
        );
        // Non-fatal
      }

      // Update chat metadata for list previews
      const { error: chatUpdateErr } = await serviceClient
        .from("chats")
        .update({
          last_message: systemMessage,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", chat.id);

      if (chatUpdateErr) {
        console.error(
          `[cancel-hire] Chat metadata update failed for chat ${chat.id}:`,
          chatUpdateErr,
        );
        // Non-fatal
      }
    } else {
      console.log(
        `[cancel-hire] No chat found for job ${job_id} — skipping message insert`,
      );
    }

    // ── Success ──────────────────────────────────────────────
    const refundedAmount = payment.amount;
    console.log(
      `[cancel-hire] Cancel complete. Job ${job_id} → open, ` +
        `payment ${payment.id} → refunded, amount=$${refundedAmount}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        refunded_amount: refundedAmount,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[cancel-hire] Unexpected error:", err);
    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "Something went wrong. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
