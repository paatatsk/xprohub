-- ============================================================
-- XProHub — Chunk E-5: Amend release_payment for auto-release
--
-- Relaxes the state gate on release_payment() to accept both
-- 'completed' AND 'pending_confirmation' job statuses.
--
-- When the job is 'pending_confirmation' (auto-release path),
-- the function also transitions the job to 'completed' with
-- completed_at = now(). This makes the auto-release a single
-- atomic operation: Transfer succeeds → release_payment is
-- called → job completes AND payment releases in one DB call.
--
-- The customer-confirm path (E-7 UI) calls confirm_completion
-- first (pending_confirmation → completed), then calls
-- release-payment Edge Function, which calls release_payment()
-- with job already in 'completed' state. Both paths converge.
--
-- All other behavior unchanged from migration 20260428000001.
-- Same signature, same idempotency, same search_path.
-- ============================================================

BEGIN;

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

  -- 2. State gate — job must be completed or pending_confirmation.
  --    'completed' = customer confirmed (Path A).
  --    'pending_confirmation' = auto-release timer expired (Path B).
  IF v_job.status NOT IN ('completed', 'pending_confirmation') THEN
    RAISE EXCEPTION 'Job not in releasable state (current: %)', v_job.status;
  END IF;

  -- 3. If job is pending_confirmation, auto-complete it now.
  --    The auto-release IS the completion (by timer expiry).
  IF v_job.status = 'pending_confirmation' THEN
    UPDATE jobs
      SET status       = 'completed',
          completed_at = now()
      WHERE id = p_job_id;
  END IF;

  -- 4. Load the payment row for this job
  SELECT * INTO v_payment FROM payments WHERE job_id = p_job_id;
  IF v_payment IS NULL THEN
    RAISE EXCEPTION 'Payment record not found for job: %', p_job_id;
  END IF;

  -- 5. Idempotency — already released means re-delivery; exit clean
  IF v_payment.escrow_status = 'released' THEN
    RETURN;
  END IF;

  -- 6. State gate — payment must be held before it can be released
  IF v_payment.escrow_status != 'held' THEN
    RAISE EXCEPTION 'Payment not in held state (current: %)', v_payment.escrow_status;
  END IF;

  -- 7. Flip to released, record transfer details and final amounts
  UPDATE payments
    SET escrow_status      = 'released',
        stripe_transfer_id = p_stripe_transfer_id,
        worker_payout      = p_worker_payout,
        platform_fee       = p_platform_fee,
        released_at        = now()
    WHERE job_id = p_job_id;
END;
$$;

COMMIT;


-- ── Verification query (run manually in Supabase SQL Editor) ──
-- Confirm the function accepts pending_confirmation:
--
-- SELECT routine_name,
--        position('pending_confirmation' in routine_definition) > 0
--          AS accepts_pending_confirmation
--   FROM information_schema.routines
--   WHERE routine_schema = 'public'
--     AND routine_name = 'release_payment';
-- Expected: accepts_pending_confirmation = true
