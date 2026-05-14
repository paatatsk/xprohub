-- ============================================================
-- XProHub — Chunk E-1: Payout Release Schema
--
-- 1. Add stripe_payment_method_id to profiles (deterministic
--    off-session charges in E-3 hire-and-charge)
-- 2. Add four columns to payments (charge_id, auto-release
--    timer, dispute tracking)
-- 3. Amend mark_completed — worker-only, transitions to
--    pending_confirmation instead of completed, sets
--    auto_release_at on the payment row
-- 4. New confirm_completion — customer confirms worker's claim,
--    transitions pending_confirmation → completed
-- 5. New raise_dispute — customer raises concern, pauses
--    auto-release, sets escrow_status to disputed
--
-- Note on auto-release → release_payment dependency:
--   release_payment() (from migration 20260428000001) requires
--   jobs.status = 'completed'. The auto-release cron path (E-11)
--   must transition pending_confirmation → completed BEFORE
--   calling release_payment. Either the cron Edge Function calls
--   confirm_completion first, or release_payment's state gate is
--   revisited at E-5. Decision deferred to E-5 build — this
--   migration does not alter release_payment.
-- ============================================================

BEGIN;


-- ── A. New column on profiles ────────────────────────────────
--
-- stripe_payment_method_id stores the PaymentMethod ID (pm_xxx)
-- attached to the Stripe Customer during Chunk D SetupIntent.
-- Required because off-session PaymentIntents do NOT auto-resolve
-- from invoice_settings.default_payment_method — the payment
-- method must be passed explicitly.
--
-- Set by the setup_intent.succeeded webhook handler (E-2 amendment
-- to existing Chunk D handler in stripe-webhook).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;


-- ── B. New columns on payments ───────────────────────────────
--
-- stripe_charge_id: the charge ID (ch_xxx) from the PaymentIntent's
--   latest_charge field. Stored at payment creation time to avoid a
--   Stripe API call when creating the Transfer at release (Transfers
--   require source_transaction = charge ID, not PaymentIntent ID).
--
-- auto_release_at: set to now() + 72 hours when worker marks done.
--   The auto-release cron (E-11) queries for payments WHERE
--   auto_release_at <= now() AND escrow_status = 'held' AND
--   disputed_at IS NULL.
--
-- disputed_at: set when customer raises a concern. Presence of this
--   value pauses auto-release (cron filters on disputed_at IS NULL).
--   NOT cleared on dispute resolution — preserved for audit trail.
--
-- dispute_reason: free-text reason from customer's concern form.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS auto_release_at  timestamptz,
  ADD COLUMN IF NOT EXISTS disputed_at      timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_reason   text;


-- ── C. Amend mark_completed ──────────────────────────────────
--
-- Changes from prior version (migration 20260428000001):
--   1. Auth gate: worker only (was: either party)
--   2. State transition: in_progress → pending_confirmation
--      (was: in_progress → completed)
--   3. Does NOT set completed_at (confirm_completion does that)
--   4. Sets payments.auto_release_at = now() + 72 hours
--
-- Locked Decision (CHUNK_E_DESIGN.md): workers declare
-- completion; customers confirm. This is a philosophical lock.

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

  -- 2. Auth gate — caller must be worker on this job (not customer)
  IF v_caller != v_job.worker_id THEN
    RAISE EXCEPTION 'Not authorized — only the worker can mark work as done';
  END IF;

  -- 3. State gate — job must be in in_progress state
  IF v_job.status != 'in_progress' THEN
    RAISE EXCEPTION 'Job not in progress (current: %)', v_job.status;
  END IF;

  -- 4. Payment gate — a held payment must exist before completion.
  --    Enforces Worker Dignity at the data layer: funds must be in
  --    escrow before the job can close.
  IF NOT EXISTS (
    SELECT 1 FROM payments
     WHERE job_id       = p_job_id
       AND escrow_status = 'held'
  ) THEN
    RAISE EXCEPTION 'No held payment found for job — payment must be confirmed before completion';
  END IF;

  -- 5. Transition job → pending_confirmation (not completed)
  UPDATE jobs
    SET status = 'pending_confirmation'
    WHERE id = p_job_id;

  -- 6. Set auto-release timer on the payment row (72 hours)
  UPDATE payments
    SET auto_release_at = now() + interval '72 hours'
    WHERE job_id = p_job_id
      AND escrow_status = 'held';
END;
$$;

-- Grant unchanged — authenticated users can call (function
-- enforces worker-only via auth.uid() check internally)
GRANT EXECUTE ON FUNCTION mark_completed(UUID) TO authenticated;


-- ── D. confirm_completion ────────────────────────────────────
--
-- Called by the customer to confirm the worker's completion claim.
-- Transitions job pending_confirmation → completed. Does NOT
-- release payment — the release-payment Edge Function (E-5)
-- handles the Stripe Transfer after this function succeeds.

CREATE OR REPLACE FUNCTION confirm_completion(p_job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job     record;
  v_payment record;
  v_caller  uuid := auth.uid();
BEGIN
  -- 1. Load the target job
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  -- 2. Auth gate — caller must be customer on this job
  IF v_caller != v_job.customer_id THEN
    RAISE EXCEPTION 'Not authorized — only the customer can confirm completion';
  END IF;

  -- 3. State gate — job must be pending_confirmation
  IF v_job.status != 'pending_confirmation' THEN
    RAISE EXCEPTION 'Job not pending confirmation (current: %)', v_job.status;
  END IF;

  -- 4. Payment gate — a held payment must exist
  SELECT * INTO v_payment FROM payments WHERE job_id = p_job_id AND escrow_status = 'held';
  IF v_payment IS NULL THEN
    RAISE EXCEPTION 'No held payment found for job — cannot confirm completion';
  END IF;

  -- 5. Dispute gate — cannot confirm while disputed
  IF v_payment.disputed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot confirm — a dispute is active on this job';
  END IF;

  -- 6. Transition job → completed, record completion time
  UPDATE jobs
    SET status       = 'completed',
        completed_at = now()
    WHERE id = p_job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_completion(UUID) TO authenticated;


-- ── E. raise_dispute ─────────────────────────────────────────
--
-- Called by the customer to raise a concern during the 72-hour
-- confirmation window. Pauses auto-release (cron filters on
-- disputed_at IS NULL). Resolution is manual in v1 — Paata
-- mediates via hello@xprohub.com and resolves by calling
-- release_payment or issuing a Stripe Refund via dashboard.
--
-- auto_release_at is NOT cleared — preserved for audit trail.

CREATE OR REPLACE FUNCTION raise_dispute(p_job_id UUID, p_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job     record;
  v_payment record;
  v_caller  uuid := auth.uid();
BEGIN
  -- 1. Load the target job
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  -- 2. Auth gate — caller must be customer on this job
  IF v_caller != v_job.customer_id THEN
    RAISE EXCEPTION 'Not authorized — only the customer can raise a dispute';
  END IF;

  -- 3. State gate — job must be pending_confirmation
  IF v_job.status != 'pending_confirmation' THEN
    RAISE EXCEPTION 'Job not pending confirmation (current: %)', v_job.status;
  END IF;

  -- 4. Idempotency — if already disputed, exit clean
  SELECT * INTO v_payment FROM payments WHERE job_id = p_job_id;
  IF v_payment IS NOT NULL AND v_payment.disputed_at IS NOT NULL THEN
    RETURN;
  END IF;

  -- 5. Payment must be in held state to be disputable
  IF v_payment IS NULL OR v_payment.escrow_status != 'held' THEN
    RAISE EXCEPTION 'No held payment found for job — cannot raise dispute';
  END IF;

  -- 6. Set dispute state on payment (auto_release_at preserved)
  UPDATE payments
    SET escrow_status  = 'disputed',
        disputed_at    = now(),
        dispute_reason = p_reason
    WHERE job_id = p_job_id
      AND escrow_status = 'held';

  -- 7. Transition job → disputed
  UPDATE jobs
    SET status = 'disputed'
    WHERE id = p_job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION raise_dispute(UUID, TEXT) TO authenticated;


-- ── F. Verification queries ──────────────────────────────────
-- Run in Supabase SQL Editor after applying the migration.

-- 1. Confirm new column on profiles:
SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'profiles'
    AND column_name = 'stripe_payment_method_id';
-- Expected: 1 row — text

-- 2. Confirm new columns on payments:
SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'payments'
    AND column_name IN (
      'stripe_charge_id', 'auto_release_at',
      'disputed_at', 'dispute_reason'
    );
-- Expected: 4 rows

-- 3. Confirm all three functions exist with correct security:
SELECT routine_name, security_type
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN (
      'mark_completed', 'confirm_completion', 'raise_dispute'
    );
-- Expected: 3 rows, all security_type = 'DEFINER'

-- 4. Confirm mark_completed has worker-only gate:
SELECT routine_name,
       position('only the worker' in routine_definition) > 0
         AS has_worker_gate
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name = 'mark_completed';
-- Expected: has_worker_gate = true

-- 5. Confirm mark_completed transitions to pending_confirmation:
SELECT routine_name,
       position('pending_confirmation' in routine_definition) > 0
         AS has_pending_confirmation
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name = 'mark_completed';
-- Expected: has_pending_confirmation = true


COMMIT;
