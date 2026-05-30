-- ============================================================
-- XProHub — Normalize profiles.worker_status: backfill NULL, add NOT NULL
--
-- Older rows may have worker_status = NULL from before the column's
-- CHECK constraint was added (migration 20260527000001). The app
-- assumes the column is always 'offline' | 'available' | 'booked';
-- NULL silently breaks status controls and comparisons.
--
-- Part 1: Backfill existing NULLs to 'offline'.
-- Part 2: Add NOT NULL constraint with DEFAULT 'offline'.
-- ============================================================

BEGIN;

-- Part 1 — Backfill
UPDATE profiles
SET worker_status = 'offline'
WHERE worker_status IS NULL;

-- Part 2 — Enforce NOT NULL going forward
ALTER TABLE profiles
  ALTER COLUMN worker_status SET DEFAULT 'offline',
  ALTER COLUMN worker_status SET NOT NULL;

-- ── Verification queries (run in Supabase SQL Editor after apply) ──
--
-- 1. Confirm zero NULLs remain:
-- SELECT count(*) FROM profiles WHERE worker_status IS NULL;
-- Expected: 0
--
-- 2. Confirm NOT NULL constraint is active:
-- SELECT column_name, is_nullable, column_default
--   FROM information_schema.columns
--   WHERE table_name = 'profiles'
--     AND column_name = 'worker_status';
-- Expected: is_nullable = 'NO', column_default = 'offline'

COMMIT;
