// ============================================================
// XProHub — Edge Function: delete-account
// ============================================================
//
// 7-step account deletion per locked design in
// docs/CHUNK_G_COMPLIANCE_DESIGN.md (G-1 section).
//
// Strategy: anonymize, not hard-delete. Profile row preserved as
// tombstone with PII nulled. Auth credentials rotated + 100-year
// ban. Financial records (payments, reviews) preserved for Stripe
// compliance and audit trail.
//
// Security: userId derived EXCLUSIVELY from verified JWT — never
// from request body or query string. This prevents user A from
// deleting user B's account. The function operates ONLY on the
// authenticated caller's own account.
//
// All 7 steps are idempotent — safe to retry on partial failure.
// Mid-flight failure is acceptable for v1 (<5s total execution).
// Manual recovery via hello@xprohub.com if persistent.
//
// NOT wired to UI yet — Phase 5 connects account.tsx.
// Related: docs/CHUNK_G_COMPLIANCE_DESIGN.md
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
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // ── Step 1: Auth + Money-state check ─────────────────────
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

    const userId = user.id;
    console.log(`[delete-account] Starting deletion for user ${userId}`);

    // Money-state: active jobs
    // Note: 'matched' is NOT checked here. A matched job with held payment
    // is caught by the payments query below. Matched without payment is a
    // rare edge case (hire-and-charge failed mid-flow) — acceptable to
    // cancel as orphan in step 3.
    const { count: activeJobCount } = await serviceClient
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .or(`customer_id.eq.${userId},worker_id.eq.${userId}`)
      .in("status", ["in_progress", "pending_confirmation", "disputed"]);

    if (activeJobCount && activeJobCount > 0) {
      return new Response(
        JSON.stringify({
          error: "active_jobs",
          message: "You have active jobs. Please complete or cancel them before deleting your account.",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    // Money-state: held payments
    const { count: heldPaymentCount } = await serviceClient
      .from("payments")
      .select("id", { count: "exact", head: true })
      .or(`customer_id.eq.${userId},worker_id.eq.${userId}`)
      .eq("escrow_status", "held");

    if (heldPaymentCount && heldPaymentCount > 0) {
      return new Response(
        JSON.stringify({
          error: "held_payments",
          message: "You have payments in escrow. Please wait for them to be released before deleting your account.",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Step 2: Stripe cleanup ───────────────────────────────
    // Read Stripe IDs BEFORE step 4 nulls them.
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("stripe_customer_id, stripe_account_id")
      .eq("id", userId)
      .single();

    if (profile?.stripe_customer_id) {
      try {
        await stripe.customers.del(profile.stripe_customer_id);
        console.log(`[delete-account] Stripe Customer ${profile.stripe_customer_id} deleted`);
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        if (e.code === "resource_missing") {
          console.log(`[delete-account] Stripe Customer already deleted — continuing`);
        } else {
          console.error(`[delete-account] Stripe Customer deletion failed — continuing:`, e.message);
        }
      }
    }

    if (profile?.stripe_account_id) {
      try {
        await stripe.accounts.update(profile.stripe_account_id, {
          capabilities: {
            transfers: { requested: false },
            card_payments: { requested: false },
          },
        });
        console.log(`[delete-account] Stripe Account ${profile.stripe_account_id} capabilities disabled`);
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        console.error(`[delete-account] Stripe Account capability disable failed — continuing:`, e.message);
      }
    }

    // ── Step 3: Cancel open jobs + auto-decline bids ─────────
    const { data: cancelledJobs } = await serviceClient
      .from("jobs")
      .update({ status: "cancelled" })
      .eq("customer_id", userId)
      .eq("status", "open")
      .select("id");

    const cancelledJobIds = (cancelledJobs ?? []).map((j: { id: string }) => j.id);

    if (cancelledJobIds.length > 0) {
      await serviceClient
        .from("bids")
        .update({ status: "declined" })
        .in("job_id", cancelledJobIds)
        .eq("status", "pending");

      console.log(
        `[delete-account] Cancelled ${cancelledJobIds.length} open job(s), auto-declined pending bids`
      );
    }

    // ── Step 4: Anonymize profiles ───────────────────────────
    const { error: anonErr } = await serviceClient
      .from("profiles")
      .update({
        full_name: "Deleted User",
        email: null,
        phone: null,
        avatar_url: null,
        bio: null,
        location_lat: null,
        location_lng: null,
        location_address: null,
        neighborhood: null,
        city: null,
        state: null,
        stripe_customer_id: null,
        stripe_account_id: null,
        stripe_payment_method_id: null,
        stripe_payment_method_added: false,
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
        stripe_onboarding_completed_at: null,
      })
      .eq("id", userId);

    if (anonErr) {
      throw new Error(`Profile anonymization failed: ${anonErr.message}`);
    }

    console.log(`[delete-account] Profile anonymized for ${userId}`);

    // ── Step 5: Auth credential rotation ─────────────────────
    // Implements the locked design's "banned_until = 9999-12-31"
    // via Supabase's duration-based ban API. 876000h ≈ 100 years.
    // If this step fails after step 4 succeeds, the profile is
    // anonymized but the user can still log in. On retry, steps
    // 1-4 are no-ops and step 5 retries. Mid-flight failure is
    // rare (<5s total execution). Manual intervention via
    // hello@xprohub.com if persistent.
    const { error: authErr } = await serviceClient.auth.admin.updateUserById(
      userId,
      {
        email: `deleted-${userId}@xprohub.invalid`,
        password: crypto.randomUUID(),
        ban_duration: "876000h",
      },
    );

    if (authErr) {
      throw new Error(`Auth credential rotation failed: ${authErr.message}`);
    }

    console.log(`[delete-account] Auth credentials rotated + banned for ${userId}`);

    // ── Step 6: Cleanup deletes ──────────────────────────────
    await serviceClient.from("worker_skills").delete().eq("user_id", userId);
    await serviceClient.from("user_badges").delete().eq("user_id", userId);
    await serviceClient.from("notifications").delete().eq("user_id", userId);
    await serviceClient
      .from("user_blocks")
      .delete()
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

    console.log(`[delete-account] Cleanup deletes complete for ${userId}`);

    // ── Step 7: Return success ───────────────────────────────
    console.log(`[delete-account] Account deletion complete for ${userId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[delete-account] Fatal error:", err);
    return new Response(
      JSON.stringify({
        error: "deletion_failed",
        message: "Account deletion could not be completed. Please try again or contact support.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
