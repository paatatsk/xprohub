-- ============================================================
-- XProHub — Step 13 Payment Schema
-- 1. Add Stripe onboarding columns to profiles
-- 2. Add index on payments(job_id)
-- 3. create_payment_record — SECURITY DEFINER, idempotent insert
-- 4. release_payment — SECURITY DEFINER, idempotent escrow release
-- 5. Amend mark_completed — payment gate before job completion
--
-- Why no new INSERT/UPDATE policies on payments:
--   Both write operations go through Edge Functions using the
--   Supabase service role key, which bypasses RLS entirely.
--   SECURITY DEFINER functions enforce state correctness.
--   The existing SELECT policy ("Payment parties view") is the
--   only app-facing policy needed.
-- ============================================================

BEGIN;


-- ── A. Three Stripe onboarding columns on profiles ───────────
--
-- stripe_charges_enabled  — true once Stripe confirms the account
--                           can process charges. Set via account.updated
--                           webhook. This is the gate checked before
--                           a worker can apply to jobs with payment.
-- stripe_payouts_enabled  — true once Stripe confirms payouts are live.
--                           Can lag charges_enabled by hours during
--                           initial verification. Tracked separately
--                           for diagnostic visibility — do not collapse
--                           into a single status column.
-- stripe_onboarding_completed_at — timestamp of the first
--                           account.updated webhook that set
--                           charges_enabled = true. NULL until then.
--
-- All three populated by the account.updated webhook handler
-- using last-write-wins semantics (correct for status sync).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled         boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled         boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_completed_at timestamptz DEFAULT NULL;


-- ── B. Index on payments(job_id) ─────────────────────────────
-- The existing schema has no index on payments. Every payment
-- lookup in the app uses job_id as the primary filter.
-- Note: stripe_payment_intent_id already carries a UNIQUE constraint
-- in the schema, which Postgres backs with an implicit index —
-- no separate CREATE INDEX needed for that column.

CREATE INDEX IF NOT EXISTS idx_payments_job
  ON public.payments (job_id);


-- ── C. create_payment_record ──────────────────────────────────
--
-- Called by the stripe-webhook Edge Function when
-- payment_intent.succeeded fires. Creates the payments row with
-- escrow_status = 'held' (funds confirmed in platform balance).
--
-- NOT called from the app client — see Section E.
--
-- Idempotency: uses INSERT ... ON CONFLICT (stripe_payment_intent_id)
-- DO NOTHING RETURNING id. If the conflict fires (duplicate webhook
-- delivery), RETURNING yields nothing, and a follow-up SELECT fetches
-- the existing row's id. Race-safe: ON CONFLICT is resolved atomically
-- by Postgres, eliminating the window in a SELECT-then-INSERT pattern.

CREATE OR REPLACE FUNCTION create_payment_record(
  p_job_id                   UUID,
  p_stripe_payment_intent_id TEXT,
  p_amount                   NUMERIC,
  p_platform_fee             NUMERIC,
  p_worker_payout            NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job        record;
  v_payment_id uuid;
BEGIN
  -- 1. Load the job to pull customer_id and worker_id
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;

  -- 2. State gate — job must be matched (bid accepted, chat created)
  IF v_job.status != 'matched' THEN
    RAISE EXCEPTION 'Job not in matched state (current: %)', v_job.status;
  END IF;

  -- 3. Idempotent insert — ON CONFLICT DO NOTHING handles duplicate
  --    webhook delivery atomically. RETURNING populates v_payment_id
  --    on a fresh insert; stays NULL if the conflict fired.
  INSERT INTO payments (
    job_id,
    customer_id,
    worker_id,
    amount,
    platform_fee,
    worker_payout,
    stripe_payment_intent_id,
    escrow_status
  ) VALUES (
    p_job_id,
    v_job.customer_id,
    v_job.worker_id,
    p_amount,
    p_platform_fee,
    p_worker_payout,
    p_stripe_payment_intent_id,
    'held'
  )
  ON CONFLICT (stripe_payment_intent_id) DO NOTHING
  RETURNING id INTO v_payment_id;

  -- 4. If conflict fired (existing row), fetch the existing id
  IF v_payment_id IS NULL THEN
    SELECT id INTO v_payment_id
      FROM payments
      WHERE stripe_payment_intent_id = p_stripe_payment_intent_id;
  END IF;

  RETURN v_payment_id;
END;
$$;


-- ── D. release_payment ────────────────────────────────────────
--
-- Called by the release-payment Edge Function after a Stripe
-- Transfer is successfully created at job completion.
-- Flips escrow_status → released, records the transfer ID,
-- final worker_payout, final platform_fee, and released_at.
--
-- NOT called from the app client — see Section E.
--
-- Idempotency: if escrow_status is already 'released', exits
-- cleanly. Safe to re-call if the Edge Function retries.
-- The mark_completed gate (Section F) guarantees a 'held' payment
-- row exists before this function is ever reached — the missing-row
-- RAISE is a last-resort safety net, not a normal code path.

CREATE OR REPLACE FUNCTION release_payment(
  p_job_id             UUID,
  p_stripe_transfer_id TEXT,
  p_worker_payout      NUMERIC,
  p_platform_fee       NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job     record;
  v_payment record;
BEGIN
  -- 1. Load the job
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;

  -- 2. State gate — job must be completed before funds release
  IF v_job.status != 'completed' THEN
    RAISE EXCEPTION 'Job not completed (current: %)', v_job.status;
  END IF;

  -- 3. Load the payment row for this job
  SELECT * INTO v_payment FROM payments WHERE job_id = p_job_id;
  IF v_payment IS NULL THEN
    RAISE EXCEPTION 'Payment record not found for job: %', p_job_id;
  END IF;

  -- 4. Idempotency — already released means re-delivery; exit clean
  IF v_payment.escrow_status = 'released' THEN
    RETURN;
  END IF;

  -- 5. State gate — payment must be held before it can be released
  IF v_payment.escrow_status != 'held' THEN
    RAISE EXCEPTION 'Payment not in held state (current: %)', v_payment.escrow_status;
  END IF;

  -- 6. Flip to released, record transfer details and final amounts
  UPDATE payments
    SET escrow_status      = 'released',
        stripe_transfer_id = p_stripe_transfer_id,
        worker_payout      = p_worker_payout,
        platform_fee       = p_platform_fee,
        released_at        = now()
    WHERE job_id = p_job_id;
END;
$$;


-- ── E. No grants to authenticated ────────────────────────────
-- These functions do not use auth.uid() for any caller check, so
-- granting to authenticated would let any logged-in user invoke them
-- with arbitrary parameters. Access is controlled at the Edge Function
-- layer instead, using the service role key.


-- ── F. Amend mark_completed — payment gate ────────────────────
--
-- Adds a payment state gate before the job status transition.
-- A 'held' payment row must exist for the job before it can be
-- marked completed. This enforces the Worker Dignity constraint
-- at the data layer: the payment was confirmed before work began,
-- and must still be in escrow at completion before funds release.
--
-- Side effect: eliminates the race condition in release_payment —
-- by the time mark_completed succeeds, the payment row is
-- guaranteed to exist with escrow_status = 'held'.
--
-- All other behaviour is unchanged from migration 20260426000001.
-- Same signature, same auth gate, same search_path.

CREATE OR REPLACE FUNCTION mark_completed(p_job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job    record;
  v_caller uuid := auth.uid();
BEGIN
  -- 1. Load the target job
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  -- 2. Auth gate — caller must be customer or worker on this job
  IF v_caller != v_job.customer_id AND v_caller != v_job.worker_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 3. State gate — job must be in in_progress state
  IF v_job.status != 'in_progress' THEN
    RAISE EXCEPTION 'Job not in progress (current: %)', v_job.status;
  END IF;

  -- 4. Payment gate — a held payment must exist before completion.
  --    Enforces Worker Dignity at the data layer: funds must be in
  --    escrow before the job can close. Blocks mark_completed if
  --    the payment_intent.succeeded webhook has not yet fired.
  IF NOT EXISTS (
    SELECT 1 FROM payments
     WHERE job_id       = p_job_id
       AND escrow_status = 'held'
  ) THEN
    RAISE EXCEPTION 'No held payment found for job — payment must be confirmed before completion';
  END IF;

  -- 5. Transition job → completed, record completion time
  UPDATE jobs
    SET status       = 'completed',
        completed_at = now()
    WHERE id = p_job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_completed(UUID) TO authenticated;


-- ── G. Verification queries ───────────────────────────────────
-- Run these in Supabase SQL Editor after applying the migration.
-- All three should return the expected values before committing.

-- 1. Confirms the three new columns on profiles:
SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name  = 'profiles'
    AND column_name IN (
      'stripe_charges_enabled',
      'stripe_payouts_enabled',
      'stripe_onboarding_completed_at'
    );
-- Expected: 3 rows — boolean/false, boolean/false, timestamp with time zone/null

-- 2. Confirms the payments index and new functions exist:
SELECT indexname
  FROM pg_indexes
  WHERE tablename = 'payments';
-- Expected: idx_payments_job appears in results

-- 3. Confirms create_payment_record and release_payment exist:
SELECT routine_name, security_type
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN ('create_payment_record', 'release_payment');
-- Expected: 2 rows, both security_type = 'DEFINER'

-- 4. Confirms mark_completed was actually amended (not just that
--    it exists). Checks for the payment gate error string:
SELECT routine_name,
       position('No held payment found' in routine_definition) > 0
         AS has_payment_gate
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name   = 'mark_completed';
-- Expected: has_payment_gate = true


COMMIT;
