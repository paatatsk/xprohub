-- ============================================================
-- XProHub — Atomic create_job_with_tasks
--
-- Inserts a job AND its job_post_tasks rows in a single
-- transaction. On any failure, the entire transaction rolls
-- back — no orphaned job with zero tasks.
--
-- Replaces the two-call client pattern in post.tsx and
-- direct-hire.tsx. Follows the accept_bid SECURITY DEFINER
-- pattern for auth handling.
--
-- Why SECURITY DEFINER:
--   The function inserts into both `jobs` (customer INSERT
--   policy) and `job_post_tasks` (customer-of-job INSERT
--   policy) in a single atomic transaction. Running as the
--   function owner bypasses RLS for both tables, while the
--   explicit auth.uid() check enforces that only the caller
--   can create jobs as themselves.
--
-- Reversible: DROP FUNCTION create_job_with_tasks(...)
-- ============================================================

CREATE OR REPLACE FUNCTION create_job_with_tasks(
  p_title            TEXT,
  p_description      TEXT,
  p_category         TEXT,
  p_budget_min       NUMERIC,
  p_budget_max       NUMERIC,
  p_neighborhood     TEXT,
  p_timing           TEXT,
  p_is_urgent        BOOLEAN,
  p_task_ids         INT[],
  p_worker_id        UUID      DEFAULT NULL,
  p_status           TEXT      DEFAULT 'open'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller   uuid := auth.uid();
  v_job_id   uuid;
  v_task_id  int;
BEGIN
  -- 1. Auth gate — caller must be authenticated
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Validate: at least one task required
  IF p_task_ids IS NULL OR array_length(p_task_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one task is required';
  END IF;

  -- 3. Validate: status must be a legal value
  IF p_status NOT IN ('open', 'matched') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- 4. Insert the job (customer_id = the caller)
  INSERT INTO jobs (
    customer_id, worker_id, title, description, category,
    budget_min, budget_max, neighborhood, timing, is_urgent, status
  ) VALUES (
    v_caller, p_worker_id, p_title, p_description, p_category,
    p_budget_min, p_budget_max, p_neighborhood, p_timing, p_is_urgent, p_status
  )
  RETURNING id INTO v_job_id;

  -- 5. Insert job_post_tasks (one row per task)
  FOREACH v_task_id IN ARRAY p_task_ids LOOP
    INSERT INTO job_post_tasks (job_post_id, task_id)
    VALUES (v_job_id, v_task_id);
  END LOOP;

  -- 6. Return the new job id
  RETURN v_job_id;
END;
$$;


-- ── Grants ────────────────────────────────────────────────────
-- Authenticated users can call (function enforces auth.uid()
-- check internally). Anon excluded — posting requires auth.

REVOKE EXECUTE ON FUNCTION create_job_with_tasks(
  TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, BOOLEAN, INT[], UUID, TEXT
) FROM public, anon;

GRANT EXECUTE ON FUNCTION create_job_with_tasks(
  TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, BOOLEAN, INT[], UUID, TEXT
) TO authenticated;

GRANT EXECUTE ON FUNCTION create_job_with_tasks(
  TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, BOOLEAN, INT[], UUID, TEXT
) TO service_role;


-- ── Verification queries (run in Supabase SQL Editor after apply) ──
--
-- 1. Confirm function exists:
-- SELECT routine_name, security_type
--   FROM information_schema.routines
--   WHERE routine_schema = 'public'
--     AND routine_name = 'create_job_with_tasks';
-- Expected: 1 row, security_type = 'DEFINER'
--
-- 2. Confirm grants:
-- SELECT grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_name = 'create_job_with_tasks'
--     AND privilege_type = 'EXECUTE';
-- Expected: 'authenticated' and 'service_role' only (no 'anon', no 'public')
--
-- Rollback: DROP FUNCTION IF EXISTS create_job_with_tasks(
--   TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, BOOLEAN, INT[], UUID, TEXT
-- );
