-- ============================================================
-- XProHub — Content Moderation: Job Post RPC (Slice 2)
--
-- Amends create_job_with_tasks() to add a validation block
-- BEFORE the INSERT:
--   1. Profanity check on title + description (via check_content)
--   2. Min-length on title (≥3) and description (≥15, if non-null)
--   3. Rate-limit: max 5 job posts per hour per customer
--
-- CREATE OR REPLACE preserves the existing signature (11 params)
-- and grants (authenticated + service_role). No REVOKE/GRANT
-- needed — Postgres preserves grants across OR REPLACE.
--
-- Depends on: check_content() from 20260704000001.
-- Uses: jobs_customer_id_idx for rate-limit count query.
--
-- Friendly copy in RAISE EXCEPTION messages matches the client
-- nudge strings and the check_content() return values.
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
  v_caller       uuid := auth.uid();
  v_job_id       uuid;
  v_task_id      int;
  v_content_err  text;
  v_recent_count int;
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

  -- ── Content moderation block ────────────────────────────────
  -- Fires before the INSERT so the user gets a friendly message,
  -- not a raw CHECK constraint error.

  -- 4a. Min-length: title
  IF length(trim(p_title)) < 3 THEN
    RAISE EXCEPTION 'Please give your job a slightly longer title.';
  END IF;

  -- 4b. Min-length: description (only if provided)
  IF p_description IS NOT NULL AND length(trim(p_description)) < 15 THEN
    RAISE EXCEPTION 'Add a bit more detail (at least 15 characters).';
  END IF;

  -- 4c. Profanity: title
  v_content_err := check_content(p_title);
  IF v_content_err IS NOT NULL THEN
    RAISE EXCEPTION '%', v_content_err;
  END IF;

  -- 4d. Profanity: description (only if provided)
  IF p_description IS NOT NULL THEN
    v_content_err := check_content(p_description);
    IF v_content_err IS NOT NULL THEN
      RAISE EXCEPTION '%', v_content_err;
    END IF;
  END IF;

  -- 4e. Rate limit: max 5 job posts per hour
  SELECT count(*) INTO v_recent_count
  FROM jobs
  WHERE customer_id = v_caller
    AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 5 THEN
    RAISE EXCEPTION 'You''re posting a lot of jobs quickly — please wait a bit before posting more.';
  END IF;

  -- ── End moderation block ────────────────────────────────────

  -- 5. Insert the job (customer_id = the caller)
  INSERT INTO jobs (
    customer_id, worker_id, title, description, category,
    budget_min, budget_max, neighborhood, timing, is_urgent, status
  ) VALUES (
    v_caller, p_worker_id, p_title, p_description, p_category,
    p_budget_min, p_budget_max, p_neighborhood, p_timing, p_is_urgent, p_status
  )
  RETURNING id INTO v_job_id;

  -- 6. Insert job_post_tasks (one row per task)
  FOREACH v_task_id IN ARRAY p_task_ids LOOP
    INSERT INTO job_post_tasks (job_post_id, task_id)
    VALUES (v_job_id, v_task_id);
  END LOOP;

  -- 7. Return the new job id
  RETURN v_job_id;
END;
$$;


-- No REVOKE/GRANT needed — CREATE OR REPLACE preserves existing
-- grants (authenticated + service_role). Verify with:
--
-- SELECT grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_name = 'create_job_with_tasks'
--     AND privilege_type = 'EXECUTE';
-- Expected: 'authenticated' and 'service_role' only
