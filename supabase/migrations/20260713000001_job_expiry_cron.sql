-- ============================================================
-- XProHub — Job Expiry Cron (pg_cron)
--
-- Automatically transitions stale open jobs to 'expired' status.
-- Jobs get expires_at = now() + 7 days on creation (column default).
-- This cron sweeps hourly and flips any open job past its expiry.
--
-- Why hourly: the expiry window is 7 days. Minute-precision is
-- unnecessary — an hour's lag on a week-old post is immaterial.
-- The client-side complement (market.tsx + index.tsx feed filters
-- using .gte('expires_at', now())) provides immediate visual
-- removal; this cron is the authoritative status transition so
-- accept_bid() correctly rejects bids on expired jobs.
--
-- No GRANTs needed: pg_cron jobs run as the database owner
-- (superuser), which bypasses RLS and has full EXECUTE rights
-- on all functions. expire_stale_jobs() is SECURITY DEFINER
-- for explicit search_path control, not for privilege escalation.
--
-- accept_bid() already gates on status = 'open', so bids on
-- expired jobs fail cleanly with "Job is not open."
-- ============================================================

BEGIN;

-- ── Enable pg_cron extension ──────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── Expiry function ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION expire_stale_jobs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE jobs
    SET status = 'expired'
    WHERE status = 'open'
      AND expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ── Schedule: every hour on the hour ──────────────────────────

SELECT cron.schedule(
  'expire-stale-jobs',
  '0 * * * *',
  'SELECT expire_stale_jobs()'
);

COMMIT;


-- ══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run after applying)
-- ══════════════════════════════════════════════════════════════

-- 1. Confirm cron job exists:
-- SELECT * FROM cron.job WHERE jobname = 'expire-stale-jobs';
-- Expected: 1 row, schedule = '0 * * * *'

-- 2. Manual test run:
-- SELECT expire_stale_jobs();
-- Expected: returns the number of jobs transitioned

-- 3. Confirm expired jobs:
-- SELECT id, title, status, expires_at FROM jobs WHERE status = 'expired';
-- Expected: previously-stale open jobs now show status = 'expired'
