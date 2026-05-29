-- ============================================================
-- XProHub — Pre-launch Security Hardening
--
-- Fixes flagged by Supabase Security Advisor (35 warnings).
--
-- Part 1 (P0): REVOKE public EXECUTE on two SECURITY DEFINER
--   payment functions that have NO internal auth.uid() check.
--   Both are called exclusively from Edge Functions using the
--   service_role key, which bypasses EXECUTE grants entirely.
--   Without the revoke, any authenticated (or anon) user could
--   call create_payment_record / release_payment via .rpc().
--
-- Part 2 (P1–P2): SET search_path = public, pg_temp on all 7
--   trigger functions missing it. Prevents search_path injection
--   where unqualified table names could resolve to a malicious
--   schema. Especially important for handle_new_user, which is
--   SECURITY DEFINER and runs with the function owner's privs.
--
-- Expected result: Supabase Advisor drops from 35 warnings to
-- ~3–5 (unfixable PostGIS/rls_auto_enable platform noise).
--
-- Verification plan (run on hardware before production):
--   1. Edge Function release flow still works (hire → complete → pay)
--   2. Normal user signup still works (handle_new_user trigger)
--   3. Endorsement creation increments profiles.endorsement_count
--   4. Job completion increments profiles.jobs_completed
-- ============================================================

BEGIN;

-- ══════════════════════════════════════════════════════════════
-- PART 1 — REVOKE public EXECUTE on server-only payment functions
-- ══════════════════════════════════════════════════════════════

-- create_payment_record: called by stripe-webhook Edge Function
-- (payment_intent.succeeded handler). No auth.uid() check inside.
REVOKE EXECUTE ON FUNCTION public.create_payment_record(
  UUID, TEXT, NUMERIC, NUMERIC, NUMERIC
) FROM public, anon, authenticated;

-- release_payment: called by release-payment Edge Function and
-- stripe-webhook (transfer.created handler). No auth.uid() check.
REVOKE EXECUTE ON FUNCTION public.release_payment(
  UUID, TEXT, NUMERIC, NUMERIC
) FROM public, anon, authenticated;


-- ══════════════════════════════════════════════════════════════
-- PART 2 — SET search_path on trigger functions
-- ══════════════════════════════════════════════════════════════

-- handle_new_user (SECURITY DEFINER — highest priority)
-- Trigger: AFTER INSERT on auth.users
ALTER FUNCTION public.handle_new_user()
  SET search_path = public, pg_temp;

-- handle_updated_at
-- Trigger: BEFORE UPDATE on profiles, jobs
ALTER FUNCTION public.handle_updated_at()
  SET search_path = public, pg_temp;

-- set_updated_at
-- Trigger: BEFORE UPDATE on task_library
ALTER FUNCTION public.set_updated_at()
  SET search_path = public, pg_temp;

-- update_profile_xp
-- Trigger: AFTER INSERT on xp_transactions
ALTER FUNCTION public.update_profile_xp()
  SET search_path = public, pg_temp;

-- update_profile_rating
-- Trigger: AFTER INSERT on reviews
ALTER FUNCTION public.update_profile_rating()
  SET search_path = public, pg_temp;

-- update_profile_endorsement_count
-- Trigger: AFTER INSERT on endorsements
ALTER FUNCTION public.update_profile_endorsement_count()
  SET search_path = public, pg_temp;

-- update_profile_jobs_completed
-- Trigger: AFTER UPDATE OF status on jobs
ALTER FUNCTION public.update_profile_jobs_completed()
  SET search_path = public, pg_temp;


-- ══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run in Supabase SQL Editor after apply)
-- ══════════════════════════════════════════════════════════════

-- 1. Confirm EXECUTE revoked on payment functions.
--    Expected: no rows for anon/authenticated on either function.
--
-- SELECT grantee, routine_name, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_schema = 'public'
--     AND routine_name IN ('create_payment_record', 'release_payment')
--     AND grantee IN ('anon', 'authenticated', 'public')
--   ORDER BY routine_name, grantee;

-- 2. Confirm search_path set on all 7 trigger functions.
--    Expected: 7 rows, all showing 'public, pg_temp'.
--
-- SELECT p.proname AS function_name,
--        pg_catalog.array_to_string(p.proconfig, ', ') AS config
--   FROM pg_catalog.pg_proc p
--   JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public'
--     AND p.proname IN (
--       'handle_new_user',
--       'handle_updated_at',
--       'set_updated_at',
--       'update_profile_xp',
--       'update_profile_rating',
--       'update_profile_endorsement_count',
--       'update_profile_jobs_completed'
--     )
--   ORDER BY p.proname;

COMMIT;
