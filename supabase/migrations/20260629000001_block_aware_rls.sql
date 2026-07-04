-- ============================================================
-- XProHub — Block-Aware RLS (RESTRICTIVE SELECT policies)
--
-- Adds server-side enforcement for user blocking on two tables:
--   profiles — hides a profile from users the owner has blocked
--   messages — hides a message from users the sender has blocked
--
-- Both are RESTRICTIVE policies that AND-combine with existing
-- PERMISSIVE policies. A row must pass at least one PERMISSIVE
-- policy AND every RESTRICTIVE policy to be visible.
--
-- DELIBERATELY OMITTED: a jobs RESTRICTIVE policy was designed
-- and rejected during pre-deploy review (2026-06-29). Reason:
-- a customer can block a worker mid-job from the chat overflow
-- (no status gate), which would hide the active job from the
-- assigned worker, remove all lifecycle buttons, block the
-- mark_completed() RPC, and strand escrowed funds with no
-- automated release path. Non-open jobs are already scoped to
-- parties via the existing PERMISSIVE policy (customer_id OR
-- worker_id = auth.uid()). Open-listing filtering from blocked
-- users stays client-side (market.tsx useBlockList hook) for v1.
--
-- Prerequisite app changes (must be live before this migration):
--   receipt.tsx — hard gate relaxed, profile accesses null-safe
--   worker-profile.tsx — copy softened to "PROFILE UNAVAILABLE"
--
-- Relies on: user_blocks table + UNIQUE(blocker_id, blocked_id)
-- index from migration 20260516000001_g4_g5_reports_and_blocks.
-- ============================================================

BEGIN;


-- ── A. profiles — hide profile from blocked users ────────────
--
-- If User A blocks User B, B can no longer see A's profile row.
-- A can still see B's profile (the policy checks blocker = the
-- profile owner, not the viewer).
--
-- Uses the UNIQUE index on user_blocks(blocker_id, blocked_id)
-- for a single index lookup per row — negligible cost.
--
-- Impact: blocked user sees generic fallback labels on screens
-- that join profiles (receipt → "Worker"/"Customer", chat →
-- "User", job detail → "Anonymous", worker profile → "Profile
-- unavailable"). Financial data on receipts is unaffected.

CREATE POLICY "block_hide_profile"
  ON public.profiles AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM user_blocks ub
      WHERE ub.blocker_id = profiles.id
        AND ub.blocked_id = auth.uid()
    )
  );


-- ── B. messages — hide messages from blocked users ───────────
--
-- If User A sends messages in a chat and then blocks User B,
-- B can no longer see A's messages. B's own sent messages
-- remain visible (B is sender, B did not block themselves).
--
-- This is the narrow form: it checks per-message sender, not
-- a blanket "any block exists in this chat." Only the blocker's
-- authored messages are hidden from the blocked user.

CREATE POLICY "block_hide_messages"
  ON public.messages AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM user_blocks ub
      WHERE ub.blocker_id = messages.sender_id
        AND ub.blocked_id = auth.uid()
    )
  );


COMMIT;


-- ══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run in Supabase SQL Editor after apply)
-- ══════════════════════════════════════════════════════════════

-- 1. Confirm both RESTRICTIVE policies exist.
--    Expected: 2 rows, both permissive = 'RESTRICTIVE'.
--
-- SELECT tablename, policyname, permissive, cmd, qual
--   FROM pg_policies
--   WHERE policyname IN ('block_hide_profile', 'block_hide_messages')
--   ORDER BY tablename;

-- 2. Confirm total policy count on affected tables.
--    Expected: profiles = 3 (public read + update own + block_hide)
--              messages = 3 (participant read + participant send + block_hide)
--
-- SELECT tablename, count(*) AS policy_count
--   FROM pg_policies
--   WHERE tablename IN ('profiles', 'messages')
--   GROUP BY tablename
--   ORDER BY tablename;

-- 3. Smoke test: as a normal user with no blocks, confirm
--    profiles and messages still return rows.
--    (Run from the Supabase client or API Explorer, not SQL Editor,
--    to test RLS as an authenticated user, not superuser.)
