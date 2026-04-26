-- ============================================================
-- XProHub — Job Lifecycle Functions
-- Step 11: Job progression for both customer and worker
--
-- Creates two SECURITY DEFINER functions:
--   mark_in_progress(p_job_id) — transitions job matched → in_progress,
--                                sets started_at = now().
--   mark_completed(p_job_id)   — transitions job in_progress → completed,
--                                sets completed_at = now().
--
-- Why SECURITY DEFINER:
--   The existing RLS policy "Customers update own jobs" only allows
--   customers to UPDATE jobs. Workers have no UPDATE policy on jobs.
--   Both functions need to be callable by either party (customer or
--   worker). Running as the function owner bypasses RLS, while the
--   explicit auth.uid() check inside each function enforces that only
--   a legitimate party (customer_id OR worker_id) can call them.
--   This mirrors the pattern established by accept_bid / decline_bid
--   in migration 20260424000001.
-- ============================================================

BEGIN;

-- ── Schema: add started_at ────────────────────────────────────
-- completed_at already exists from the original schema.
-- started_at was not in the initial schema — adding it now.

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS started_at timestamptz;


-- ── mark_in_progress ──────────────────────────────────────────
-- Either party (customer or worker) can mark a matched job as
-- in progress once the worker has arrived and work has begun.

CREATE OR REPLACE FUNCTION mark_in_progress(p_job_id UUID)
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

  -- 3. State gate — job must be in matched state
  IF v_job.status != 'matched' THEN
    RAISE EXCEPTION 'Job not in matched state (current: %)', v_job.status;
  END IF;

  -- 4. Transition job → in_progress, record start time
  UPDATE jobs
    SET status     = 'in_progress',
        started_at = now()
    WHERE id = p_job_id;
END;
$$;


-- ── mark_completed ────────────────────────────────────────────
-- Either party (customer or worker) can mark an in-progress job
-- as completed once the work is done.

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

  -- 4. Transition job → completed, record completion time
  UPDATE jobs
    SET status       = 'completed',
        completed_at = now()
    WHERE id = p_job_id;
END;
$$;


-- ── Grants ────────────────────────────────────────────────────
-- Allow authenticated users to call both functions.
-- anon role intentionally excluded — lifecycle changes require auth.

GRANT EXECUTE ON FUNCTION mark_in_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_completed(UUID)   TO authenticated;


COMMIT;
