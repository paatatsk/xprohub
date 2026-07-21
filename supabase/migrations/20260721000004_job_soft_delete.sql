-- ============================================================
-- XProHub — Job Soft Delete Infrastructure
--
-- Adds deleted_at column + delete_job RPC + updated SELECT policy.
--
-- Design:
--   - deleted_at column: NULL = live, non-NULL = soft-deleted.
--   - delete_job RPC: customer-only, blocks deletion on active
--     hires (matched/in_progress/pending_confirmation/disputed).
--     Allowed on: open, completed, cancelled, expired.
--   - Updated SELECT policy: deleted jobs vanish from public
--     browse (status='open' AND deleted_at IS NULL) but remain
--     visible to owner (customer_id) and worker (worker_id) for
--     receipt/history integrity.
--
-- Reversible:
--   DROP FUNCTION IF EXISTS delete_job(UUID);
--   DROP POLICY IF EXISTS "Open jobs are public" ON jobs;
--   CREATE POLICY "Open jobs are public" ON jobs FOR SELECT
--     USING (status = 'open' OR customer_id = auth.uid() OR worker_id = auth.uid());
--   ALTER TABLE jobs DROP COLUMN IF EXISTS deleted_at;
-- ============================================================

BEGIN;


-- ── A. Column ────────────────────────────────────────────────

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deleted_at timestamptz;


-- ── B. delete_job RPC ────────────────────────────────────────

CREATE OR REPLACE FUNCTION delete_job(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job jobs%ROWTYPE;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF v_job.customer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the job owner can delete';
  END IF;

  IF v_job.status IN ('matched', 'in_progress', 'pending_confirmation', 'disputed') THEN
    RAISE EXCEPTION 'Cannot delete a job with an active hire';
  END IF;

  UPDATE jobs
    SET deleted_at = now(),
        updated_at = now()
    WHERE id = p_job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_job(uuid) TO authenticated;


-- ── C. Updated SELECT policy ─────────────────────────────────
-- Deleted jobs vanish from public browse but remain visible to
-- the owner (customer_id) and assigned worker (worker_id) for
-- receipt and history integrity.

DROP POLICY IF EXISTS "Open jobs are public" ON jobs;

CREATE POLICY "Open jobs are public" ON jobs FOR SELECT
  USING (
    (status = 'open' AND deleted_at IS NULL)
    OR customer_id = auth.uid()
    OR worker_id = auth.uid()
  );


COMMIT;
