-- ============================================================
-- XProHub — Wire profiles.jobs_completed via trigger
--
-- The column existed since the original schema (DEFAULT 0) but
-- was never incremented by any code path. This migration adds
-- a trigger that fires on the status transition to 'completed'
-- (both confirm_completion and release_payment auto-release
-- paths) and a backfill for historical data.
--
-- Pattern: matches update_profile_xp() — plain plpgsql trigger,
-- no SECURITY DEFINER.
--
-- Order: CREATE FUNCTION → CREATE TRIGGER → backfill UPDATE
-- Backfill runs last so it sets the absolute count from COUNT(*),
-- which is the source of truth regardless of trigger ordering.
-- ============================================================

BEGIN;

-- ── 1. Trigger function ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_profile_jobs_completed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET jobs_completed = jobs_completed + 1
  WHERE id = NEW.worker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 2. Trigger ───────────────────────────────────────────────
-- AFTER UPDATE OF status: only fires when the status column changes.
-- WHEN clause: IS DISTINCT FROM is NULL-safe (handles OLD.status = NULL).
-- Catches both confirm_completion() and release_payment() auto-complete.

CREATE TRIGGER after_job_completed
  AFTER UPDATE OF status ON public.jobs
  FOR EACH ROW
  WHEN (
    NEW.status = 'completed'
    AND OLD.status IS DISTINCT FROM 'completed'
    AND NEW.worker_id IS NOT NULL
  )
  EXECUTE FUNCTION public.update_profile_jobs_completed();

-- ── 3. Backfill ──────────────────────────────────────────────

UPDATE public.profiles
SET jobs_completed = (
  SELECT COUNT(*)
  FROM public.jobs
  WHERE status = 'completed'
    AND worker_id = profiles.id
);

COMMIT;
