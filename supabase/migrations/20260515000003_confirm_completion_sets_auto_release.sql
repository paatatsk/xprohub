-- ============================================================
-- XProHub — Chunk E-7a: confirm_completion sets auto_release_at
--
-- Amends confirm_completion to set payments.auto_release_at = now()
-- on successful confirmation. This ensures that if the release-payment
-- Edge Function fails after confirm_completion succeeds, the cron
-- (E-11) catches the recovery within 15 minutes instead of waiting
-- up to 72 hours for the original timer to expire.
--
-- Same signature, same gates. Only adds a single UPDATE to payments
-- as a side effect of successful job completion.
-- ============================================================

BEGIN;

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

  -- 7. Set auto_release_at = now() so the cron catches this payment
  --    on its next tick (~15 min) if release-payment Edge Function
  --    fails after this function succeeds.
  UPDATE payments
    SET auto_release_at = now()
    WHERE job_id = p_job_id
      AND escrow_status = 'held';
END;
$$;

COMMIT;


-- ── Verification query (run manually in Supabase SQL Editor) ──
-- Confirm the function sets auto_release_at:
--
-- SELECT routine_name,
--        position('auto_release_at = now()' in routine_definition) > 0
--          AS sets_auto_release
--   FROM information_schema.routines
--   WHERE routine_schema = 'public'
--     AND routine_name = 'confirm_completion';
-- Expected: sets_auto_release = true
