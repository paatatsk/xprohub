-- ============================================================
-- XProHub — Cancel Job Function
-- Slice C1: Close-post flow for stale/unwanted open jobs.
--
-- Creates a SECURITY DEFINER function:
--   cancel_job(p_job_id) — atomically cancels an open job and
--                           auto-declines all pending bids.
--
-- Why SECURITY DEFINER:
--   Cancelling requires updating both `jobs` and `bids` in a
--   single atomic transaction. Running as function owner bypasses
--   RLS for both tables, while the explicit auth.uid() check
--   enforces that only the job's customer can cancel.
--
-- Safety: No payment rows can exist for an 'open' job (payment
-- creation gates on status = 'matched'), so no escrow concern.
--
-- NOTE: Apply via SQL Editor as bare CREATE OR REPLACE — do NOT
-- wrap in BEGIN/COMMIT when pasting into the SQL Editor (the
-- editor wraps its own transaction). The file uses BEGIN/COMMIT
-- for migration-file convention only.
--
-- Migration: 20260611000001_cancel_job_function.sql
-- ============================================================

BEGIN;

-- ── cancel_job ───────────────────────────────────────────────
-- Cancels an open job and auto-declines all pending bids.
-- Returns void — client navigates back after success.

CREATE OR REPLACE FUNCTION cancel_job(p_job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job    record;
  v_caller uuid := auth.uid();
BEGIN
  -- 1. Load the job
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  -- 2. Auth gate — only the customer who posted can cancel
  IF v_job.customer_id != v_caller THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 3. Only open jobs can be cancelled
  IF v_job.status != 'open' THEN
    RAISE EXCEPTION 'Job is not open (current status: %)', v_job.status;
  END IF;

  -- 4. Auto-decline all pending bids on this job
  UPDATE bids
    SET status = 'declined'
    WHERE job_id = p_job_id
      AND status = 'pending';

  -- 5. Cancel the job
  UPDATE jobs
    SET status = 'cancelled'
    WHERE id = p_job_id;
END;
$$;

-- ── Grants ────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION cancel_job(UUID) TO authenticated;

COMMIT;
