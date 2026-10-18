-- ============================================================
-- XProHub — Fix anon auth-bypass in SECURITY DEFINER functions
--
-- Root cause: four functions used `column != auth.uid()` /
-- `auth.uid() <> column` as their ONLY authorization check. In
-- PL/pgSQL, `IF <NULL-condition> THEN ... END IF` treats a NULL
-- condition as false — the branch is silently skipped. An anon-key
-- caller (no user JWT) has auth.uid() = NULL, so the RAISE
-- EXCEPTION never fires and the function proceeds as if authorized.
--
-- Found via live Security Advisor (`rls_disabled_in_public` /
-- `*_security_definer_function_executable`) + manual RPC body
-- audit, 2026-09-19. delete_job was confirmed exploitable by a
-- fully anonymous caller (no account) against every job in the
-- publicly-readable "open" set — the entire live marketplace.
--
-- Fix, all four (accept_direct_offer, decline_direct_offer,
-- delete_job, hide_application):
--   1. Explicit `auth.uid() IS NULL` check first — fails closed
--      with "Not authenticated" instead of silently passing.
--      Matches the pattern already used correctly in
--      create_job_with_tasks (20260604000001).
--   2. Ownership/party comparisons changed from != / <> to
--      IS DISTINCT FROM — NULL-safe even if the upfront check
--      above is ever removed or refactored around.
--
-- Backstop: REVOKE EXECUTE FROM anon on all four. They were
-- never explicitly revoked when created (20260721000001,
-- 20260721000004, 20260721000005 only GRANT ... TO authenticated,
-- never REVOKE ... FROM PUBIC/anon) — so the default PUBLIC
-- EXECUTE grant Postgres applies to every new function was still
-- silently in effect for anon. This matches the pattern already
-- applied to accept_bid/decline_bid/cancel_job/etc. in
-- 20260528000002 and 20260615000002.
--
-- Standing guardrail: ALTER DEFAULT PRIVILEGES so any FUTURE
-- function created in public requires an explicit GRANT to reach
-- anon/PUBLIC, instead of requiring someone to remember an
-- explicit REVOKE after the fact. This does not retroactively
-- change existing functions (handled by the explicit REVOKEs
-- above and in prior hardening migrations) and only binds the
-- role that runs this migration — Supabase CLI/dashboard
-- migrations consistently run as the `postgres` role, so this
-- holds for the normal migration workflow.
--
-- Also: expire_stale_jobs restricted to service_role. pg_cron
-- schedules run as the database owner and bypass grants entirely
-- (per the comment in 20260713000001) — the 0 * * * * schedule is
-- unaffected. This only closes the direct /rest/v1/rpc/ path,
-- which had no real state-machine impact (see investigation notes)
-- but is closed anyway as hygiene.
-- ============================================================

BEGIN;


-- ── A. accept_direct_offer — NULL-safe auth gate ──────────────

CREATE OR REPLACE FUNCTION public.accept_direct_offer(p_bid_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_bid        record;
  v_job        record;
  v_caller     uuid := auth.uid();
  v_chat_id    uuid;
  v_first_msg  text;
BEGIN
  -- 0. Auth gate — must be authenticated at all
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Load the target bid
  SELECT * INTO v_bid FROM bids WHERE id = p_bid_id;
  IF v_bid IS NULL THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;

  -- 2. Must be a direct offer
  IF v_bid.is_direct_offer != true THEN
    RAISE EXCEPTION 'Bid is not a direct offer';
  END IF;

  -- 3. Load the associated job
  SELECT * INTO v_job FROM jobs WHERE id = v_bid.job_id;
  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  -- 4. Auth gate — only the targeted worker can accept
  IF v_bid.worker_id IS DISTINCT FROM v_caller THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 4b. Self-hire guard — worker and customer must be different people
  IF v_bid.worker_id = v_job.customer_id THEN
    RAISE EXCEPTION 'Self-hire is not allowed';
  END IF;

  -- 5. Ensure bid is in an accept-able state
  IF v_bid.status != 'pending' THEN
    RAISE EXCEPTION 'Bid is not pending (current status: %)', v_bid.status;
  END IF;

  -- 6. Ensure job is still open
  IF v_job.status != 'open' THEN
    RAISE EXCEPTION 'Job is not open (current status: %)', v_job.status;
  END IF;

  -- 7. Flip target bid → accepted
  UPDATE bids SET status = 'accepted' WHERE id = p_bid_id;

  -- 8. Auto-decline all other pending bids on this job (defensive —
  --    targeted jobs should have no other bids, but safe to sweep)
  UPDATE bids
    SET status = 'declined'
    WHERE job_id = v_bid.job_id
      AND id     != p_bid_id
      AND status  = 'pending';

  -- 9. Update job → matched + assign worker + lock agreed price
  UPDATE jobs
    SET status       = 'matched',
        worker_id    = v_bid.worker_id,
        agreed_price = v_bid.proposed_price
    WHERE id = v_bid.job_id;

  -- 10. Chat: reuse existing or create new (rehire-safe)
  v_first_msg := 'Direct hire accepted! Let''s coordinate the details.';

  SELECT id INTO v_chat_id FROM chats WHERE job_id = v_bid.job_id;

  IF v_chat_id IS NOT NULL THEN
    -- Reuse surviving chat from a previous (cancelled) hire
    UPDATE chats
      SET worker_id       = v_bid.worker_id,
          last_message    = v_first_msg,
          last_message_at = now()
      WHERE id = v_chat_id;
  ELSE
    -- First hire — create fresh chat
    INSERT INTO chats (job_id, customer_id, worker_id, last_message, last_message_at)
    VALUES (v_bid.job_id, v_job.customer_id, v_bid.worker_id, v_first_msg, now())
    RETURNING id INTO v_chat_id;
  END IF;

  -- 11. Insert opening message (non-fatal — chat still succeeds if this fails)
  BEGIN
    INSERT INTO messages (chat_id, sender_id, content, message_type)
    VALUES (v_chat_id, v_bid.worker_id, v_first_msg, 'text');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- swallow; caller will still see the chat
  END;

  RETURN v_chat_id;
END;
$function$;


-- ── B. decline_direct_offer — NULL-safe auth gate ─────────────

CREATE OR REPLACE FUNCTION public.decline_direct_offer(p_bid_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_bid    record;
  v_job    record;
  v_caller uuid := auth.uid();
BEGIN
  -- 0. Auth gate — must be authenticated at all
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Load the target bid
  SELECT * INTO v_bid FROM bids WHERE id = p_bid_id;
  IF v_bid IS NULL THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;

  -- 2. Must be a direct offer
  IF v_bid.is_direct_offer != true THEN
    RAISE EXCEPTION 'Bid is not a direct offer';
  END IF;

  -- 3. Load the associated job
  SELECT * INTO v_job FROM jobs WHERE id = v_bid.job_id;
  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  -- 4. Auth gate — only the targeted worker can decline
  IF v_bid.worker_id IS DISTINCT FROM v_caller THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 5. Only pending bids can be declined
  IF v_bid.status != 'pending' THEN
    RAISE EXCEPTION 'Bid is not pending (current status: %)', v_bid.status;
  END IF;

  -- 6. Flip bid → declined
  UPDATE bids SET status = 'declined' WHERE id = p_bid_id;

  -- 7. Cancel the targeted job (no public market to return to)
  UPDATE jobs
    SET status = 'cancelled'
    WHERE id = v_bid.job_id
      AND status = 'open';
END;
$function$;


-- ── C. delete_job — NULL-safe auth gate ───────────────────────

CREATE OR REPLACE FUNCTION public.delete_job(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job    jobs%ROWTYPE;
  v_caller uuid := auth.uid();
BEGIN
  -- 0. Auth gate — must be authenticated at all
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF v_job.customer_id IS DISTINCT FROM v_caller THEN
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
$function$;


-- ── D. hide_application — NULL-safe auth gate ─────────────────

CREATE OR REPLACE FUNCTION public.hide_application(p_bid_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_bid    bids%ROWTYPE;
  v_job    jobs%ROWTYPE;
  v_caller uuid := auth.uid();
BEGIN
  -- 0. Auth gate — must be authenticated at all
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_bid FROM bids WHERE id = p_bid_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  IF v_bid.worker_id IS DISTINCT FROM v_caller THEN
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
$function$;


-- ── E. Grant backstop — revoke anon, restate authenticated ────

REVOKE EXECUTE ON FUNCTION public.accept_direct_offer(uuid)  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decline_direct_offer(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_job(uuid)           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.hide_application(uuid)     FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.accept_direct_offer(uuid)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_direct_offer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_job(uuid)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.hide_application(uuid)     TO authenticated;


-- ── F. expire_stale_jobs — restrict to service_role/cron only ─

REVOKE EXECUTE ON FUNCTION public.expire_stale_jobs() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.expire_stale_jobs() TO service_role;


-- ── G. Standing guardrail — anon-closed by default ────────────
-- Any function created in public from now on (by the role that
-- runs this migration) starts with EXECUTE revoked from PUBLIC.
-- A future migration must explicitly GRANT to authenticated (or
-- service_role) — omitting that grant now fails closed instead
-- of silently defaulting open.

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

COMMIT;


-- ══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run after applying)
-- ══════════════════════════════════════════════════════════════

-- 1. Confirm anon EXECUTE is gone on all five touched functions.
--    Expected: no rows.
--
-- SELECT routine_name, grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_schema = 'public'
--     AND routine_name IN (
--       'accept_direct_offer', 'decline_direct_offer',
--       'delete_job', 'hide_application', 'expire_stale_jobs'
--     )
--     AND grantee IN ('anon', 'public')
--     AND privilege_type = 'EXECUTE';

-- 2. Confirm authenticated still has EXECUTE on the four RPCs
--    (not expire_stale_jobs — that one is service_role only now).
--    Expected: 4 rows.
--
-- SELECT routine_name, grantee
--   FROM information_schema.routine_privileges
--   WHERE routine_schema = 'public'
--     AND routine_name IN (
--       'accept_direct_offer', 'decline_direct_offer',
--       'delete_job', 'hide_application'
--     )
--     AND grantee = 'authenticated';

-- 3. Confirm the default-privileges guardrail is recorded.
--
-- SELECT defaclrole::regrole, defaclnamespace::regnamespace, defaclacl
--   FROM pg_default_acl
--   WHERE defaclnamespace = 'public'::regnamespace;
