-- ============================================================
-- XProHub — Tighten EXECUTE grants on client-callable RPCs
--
-- All 6 functions already have internal auth.uid() checks that
-- enforce authorization. This migration is defense-in-depth:
-- revoke the default PUBLIC grant (which includes anon) and
-- restrict EXECUTE to authenticated only.
--
-- Pattern per function:
--   REVOKE EXECUTE ... FROM public, anon;
--   GRANT  EXECUTE ... TO authenticated;
--
-- The GRANT TO authenticated already exists from the original
-- migrations, but is re-stated explicitly for clarity after the
-- revoke changes the baseline.
--
-- Functions NOT touched here (handled elsewhere or not ours):
--   create_payment_record, release_payment — revoked in
--     20260528000001 (service_role only, no auth check)
--   handle_new_user — trigger function, not client RPC
--   rls_auto_enable, st_estimatedextent — Supabase/PostGIS
-- ============================================================

BEGIN;

-- ── accept_bid ───────────────────────────────────────────────
-- Auth check: customer_id = auth.uid()
REVOKE EXECUTE ON FUNCTION public.accept_bid(UUID) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.accept_bid(UUID) TO authenticated;

-- ── decline_bid ──────────────────────────────────────────────
-- Auth check: customer_id = auth.uid()
REVOKE EXECUTE ON FUNCTION public.decline_bid(UUID) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.decline_bid(UUID) TO authenticated;

-- ── mark_in_progress ─────────────────────────────────────────
-- Auth check: caller = customer_id OR worker_id
REVOKE EXECUTE ON FUNCTION public.mark_in_progress(UUID) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.mark_in_progress(UUID) TO authenticated;

-- ── mark_completed ───────────────────────────────────────────
-- Auth check: caller = worker_id (worker only)
REVOKE EXECUTE ON FUNCTION public.mark_completed(UUID) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.mark_completed(UUID) TO authenticated;

-- ── confirm_completion ───────────────────────────────────────
-- Auth check: caller = customer_id (customer only)
REVOKE EXECUTE ON FUNCTION public.confirm_completion(UUID) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.confirm_completion(UUID) TO authenticated;

-- ── raise_dispute ────────────────────────────────────────────
-- Auth check: caller = customer_id (customer only)
REVOKE EXECUTE ON FUNCTION public.raise_dispute(UUID, TEXT) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.raise_dispute(UUID, TEXT) TO authenticated;


-- ══════════════════════════════════════════════════════════════
-- VERIFICATION QUERY (run in Supabase SQL Editor after apply)
-- ══════════════════════════════════════════════════════════════

-- Confirm: each function shows ONLY 'authenticated' as grantee.
-- No rows for 'anon' or 'public'.
--
-- SELECT routine_name, grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_schema = 'public'
--     AND routine_name IN (
--       'accept_bid', 'decline_bid',
--       'mark_in_progress', 'mark_completed',
--       'confirm_completion', 'raise_dispute'
--     )
--     AND privilege_type = 'EXECUTE'
--   ORDER BY routine_name, grantee;

COMMIT;
