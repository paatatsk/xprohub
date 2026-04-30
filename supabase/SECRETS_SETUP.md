# Stripe + Supabase Edge Functions — Setup Guide

## When to follow this guide

Any time you're setting up the Stripe payment integration from scratch —
new environment, new machine, or re-linking after a project reset. You'll
need your Stripe dashboard open and the Supabase CLI authenticated.

This is a one-time manual setup per environment. Once done, no repeat
steps are needed unless you rotate keys.

## The order matters

Two Stripe secrets are required: `STRIPE_SECRET_KEY` (your API key, available
any time from the Stripe dashboard) and `STRIPE_WEBHOOK_SECRET` (the signing
secret Stripe generates when you create the webhook endpoint).

The catch: you can't get `STRIPE_WEBHOOK_SECRET` until the endpoint is
registered in Stripe, and you can't register the endpoint until the function
is deployed (Stripe needs a live URL to validate). So the two secrets are set
at different points — Step 1 and Step 4.

Do not skip ahead. The steps below are in the correct order.

## Step 1 — Set STRIPE_SECRET_KEY

Get your secret key from the Stripe dashboard: Developers → API keys →
Secret key (starts with `sk_test_` in test mode, `sk_live_` in production).

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

Secrets are available to deployed functions immediately — no redeploy needed
after this command. Never put this value in any file in the repo.

## Step 2 — Deploy the webhook function

```bash
supabase functions deploy stripe-webhook
```

This deploys only the stripe-webhook function. JWT verification is disabled
for this function via `supabase/config.toml` — no extra flags needed on the
deploy command.

The live function URL after deploy:
```
https://ygnpjmldabewzogyrjbb.supabase.co/functions/v1/stripe-webhook
```

## Step 3 — Register the endpoint in Stripe

In the Stripe dashboard, make sure you're in **Test mode** during development.

Navigate to: **Workbench → Webhooks tab → Create an event destination**

- Endpoint URL: `https://ygnpjmldabewzogyrjbb.supabase.co/functions/v1/stripe-webhook`
- Subscribe to exactly these four events:
  - `account.updated`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `transfer.created`

After creating the endpoint, Stripe shows a **Signing secret** (starts with
`whsec_`). Copy it — you'll need it in the next step. It's only shown once.

## Step 4 — Set STRIPE_WEBHOOK_SECRET

Paste the signing secret you copied from Step 3:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

Again — never put this value in any file in the repo.

To confirm both secrets are set:

```bash
supabase secrets list
```

This shows secret names only, not values.

## Step 5 — Verify it's working

In the Stripe dashboard, go to the webhook endpoint you created in Step 3
and click **Send test webhook**. Choose any of the four subscribed event
types and send it.

Check the delivery log on that same page. A successful delivery shows
HTTP 200 with response body `{"received":true}`.

If you see a cold-start error instead of 200, the most common cause is a
missing or misspelled secret. Run `supabase secrets list` to confirm both
names appear, then re-run the `secrets set` command for the missing one.

## Going to production

The setup above uses Stripe test mode (sandbox). When launching to
production, the entire Stripe-side flow repeats with live keys:

- Get a new secret key from the Stripe dashboard while in **Live mode**
  (starts with `sk_live_` instead of `sk_test_`)
- Register a NEW webhook endpoint in Live mode (test mode and live mode
  have separate endpoint lists in Stripe)
- Subscribe to the same four events
- Copy the new `whsec_` signing secret (separate from the test mode whsec)
- Set both new values via `supabase secrets set` — they REPLACE the test
  mode values. Once you do this, your deployed function processes live
  events only.

Production-mode setup is a one-way step. Don't do it until the app is
genuinely ready for real money.

## Troubleshooting

**Function deploys but Stripe events don't arrive in your code**
- Most common cause: signature mismatch. The `whsec_` you set in Step 4
  is from the wrong endpoint or the wrong mode (test vs live).
- Fix: in Stripe dashboard, find the webhook endpoint, copy the signing
  secret again, and re-run `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`.
  Secrets update immediately.

**Cold-start error: "STRIPE_SECRET_KEY is not set or is empty"**
- The secret hasn't been set yet. Run Step 1.
- If you set it but still see this: confirm the env var name is
  `STRIPE_SECRET_KEY` exactly (case-sensitive). Run `supabase secrets list`
  to verify.

**Cold-start error: "STRIPE_WEBHOOK_SECRET is not set or is empty"**
- The webhook secret hasn't been set yet. Run Step 4.
- If you set it but still see this: re-confirm the value starts with
  `whsec_` — pasting the wrong value is a common slip.
