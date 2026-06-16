-- ============================================================
-- XProHub — Tighten EXECUTE grants on SECURITY DEFINER functions (round 2)
--
-- Least-privilege hardening: removes unused anon/PUBLIC EXECUTE
-- grants to satisfy the Supabase Security Advisor. All four
-- functions are already self-defending (internal auth.uid()
-- checks or trigger-type safety), so this is defense-in-depth,
-- not a vulnerability fix.
--
-- These four were either created after the prior hardening pass
-- (20260528000002_tighten_rpc_grants.sql) or explicitly deferred
-- by it:
--   cancel_job           — created in 20260611000001, after prior pass
--   create_job_with_tasks — created in 20260604000001, after prior pass
--   handle_new_user      — deferred as "trigger function, not client RPC"
--   rls_auto_enable      — deferred as "Supabase/PostGIS"
--
-- Pattern per function (matches 20260528000002):
--   REVOKE EXECUTE ... FROM public, anon;
--   GRANT  EXECUTE ... TO authenticated;  (client RPCs only)
--
-- Migration: 20260615000002_tighten_rpc_grants_round2.sql
-- ============================================================

BEGIN;

-- ── cancel_job ──────────────────────────────────────────────
-- Auth check: customer_id = auth.uid()
REVOKE EXECUTE ON FUNCTION public.cancel_job(uuid) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.cancel_job(uuid) TO authenticated;

-- ── create_job_with_tasks ───────────────────────────────────
-- Auth check: auth.uid() IS NOT NULL (caller becomes customer_id)
REVOKE EXECUTE ON FUNCTION public.create_job_with_tasks(text, text, text, numeric, numeric, text, text, boolean, integer[], uuid, text) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.create_job_with_tasks(text, text, text, numeric, numeric, text, text, boolean, integer[], uuid, text) TO authenticated;

-- ── handle_new_user ─────────────────────────────────────────
-- Trigger function (AFTER INSERT ON auth.users). Revoking
-- anon/PUBLIC EXECUTE does not affect trigger invocation —
-- triggers run as the owning role (postgres), not the caller.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon;

-- ── rls_auto_enable ─────────────────────────────────────────
-- Event trigger function (ddl_command_end). Revoking
-- anon/PUBLIC EXECUTE does not affect event trigger invocation —
-- event triggers run as the owning role, not the caller.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public, anon;

COMMIT;
