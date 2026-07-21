-- ============================================================
-- XProHub — Bid Hide (worker-side cleanup)
--
-- Lets workers hide ended applications from their My Applications
-- list. Soft-hide only — the bid row remains for audit/history.
--
-- Hideable when the application is truly ended:
--   - bid.status IN ('declined', 'withdrawn'), OR
--   - job.status IN ('completed', 'cancelled', 'expired')
-- Active applications (pending/accepted on live jobs) cannot be hidden.
--
-- Reversible:
--   DROP FUNCTION IF EXISTS hide_application(UUID);
--   ALTER TABLE bids DROP COLUMN IF EXISTS hidden_by_worker_at;
-- ============================================================

BEGIN;


-- ── A. Column ────────────────────────────────────────────────

ALTER TABLE bids ADD COLUMN IF NOT EXISTS hidden_by_worker_at timestamptz;


-- ── B. hide_application RPC ──────────────────────────────────

CREATE OR REPLACE FUNCTION hide_application(p_bid_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid bids%ROWTYPE;
  v_job jobs%ROWTYPE;
BEGIN
  SELECT * INTO v_bid FROM bids WHERE id = p_bid_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  IF v_bid.worker_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the applicant can hide this';
  END IF;

  SELECT * INTO v_job FROM jobs WHERE id = v_bid.job_id;

  -- Hideable only when the application is truly ended
  IF NOT (
    v_bid.status IN ('declined', 'withdrawn')
    OR v_job.status IN ('completed', 'cancelled', 'expired')
  ) THEN
    RAISE EXCEPTION 'Active applications cannot be hidden';
  END IF;

  UPDATE bids SET hidden_by_worker_at = now() WHERE id = p_bid_id;
END;
$$;

GRANT EXECUTE ON FUNCTION hide_application(uuid) TO authenticated;


COMMIT;
