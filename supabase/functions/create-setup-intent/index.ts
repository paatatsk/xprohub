// ============================================================
// XProHub — Edge Function: create-setup-intent
// ============================================================
//
// Creates the three Stripe objects required to initialize a
// PaymentSheet on the client side for saving a card to the
// user's Stripe Customer:
//
//   1. Stripe Customer (idempotent — reuses stripe_customer_id
//      from profiles if present, creates one if null)
//   2. EphemeralKey (short-lived token, lets the mobile SDK
//      access the Customer's saved payment methods without
//      exposing the secret key)
//   3. SetupIntent (the object the PaymentSheet attaches the
//      card to — no money moves, card is saved for later use)
//
// Returns all three values to the app so PaymentSheet can
// initialize. Card collection happens client-side via the
// native sheet. Final confirmation happens via the
// setup_intent.succeeded webhook (D-3).
//
// Related: docs/CHUNK_D_DESIGN.md
// Pattern: mirrors create-stripe-account/index.ts
// ============================================================

import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "../_shared/stripe-client.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Stripe API version that supports automatic_payment_methods on
// SetupIntents. Pin explicitly so EphemeralKey creation matches.
const STRIPE_API_VERSION = "2024-06-20";

// Service role client — created once at module level, reused across requests.
// Used for: reading stripe_customer_id and writing it back after Customer creation.
// Bypasses RLS. Every query is scoped to WHERE id = <verified user id>.
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  // ── Method check ──────────────────────────────────────────
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // ── Auth: verify JWT, get user ──────────────────────────
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

    // ── Look up profile ─────────────────────────────────────
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("stripe_customer_id, full_name, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile lookup failed:", profileError);
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Find or create Stripe Customer (idempotent) ─────────
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customerCreateParams: Record<string, string> = {
        email: profile.email ?? user.email ?? "",
      };
      if (profile.full_name) {
        customerCreateParams.name = profile.full_name;
      }

      const customer = await stripe.customers.create(customerCreateParams);
      customerId = customer.id;

      // Persist immediately so a retry never creates a duplicate
      const { error: updateError } = await serviceClient
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);

      if (updateError) {
        console.error(
          "Failed to persist stripe_customer_id:",
          updateError,
        );
        return new Response(
          JSON.stringify({ error: "Failed to save customer record" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // ── Create EphemeralKey ─────────────────────────────────
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: STRIPE_API_VERSION },
    );

    // ── Create SetupIntent ──────────────────────────────────
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      usage: "off_session",
    });

    // ── Success response ────────────────────────────────────
    return new Response(
      JSON.stringify({
        client_secret: setupIntent.client_secret,
        ephemeral_key: ephemeralKey.secret,
        customer_id: customerId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("create-setup-intent error:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to set up payment. Please try again.",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
});
