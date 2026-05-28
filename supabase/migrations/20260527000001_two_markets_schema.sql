-- ============================================================
-- XProHub — Two Markets Schema Changes
-- PR 1: Drop belt_level, add worker availability columns
-- ============================================================

BEGIN;

-- ── 1. Drop belt_level (dead column — zero code references since commit 0acea74) ──

ALTER TABLE public.profiles DROP COLUMN IF EXISTS belt_level;

-- ── 2. Add worker availability columns ──

-- Worker marketplace status: offline (default), available, or booked
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS worker_status text DEFAULT 'offline'
  CHECK (worker_status IN ('offline', 'available', 'booked'));

-- Today's rate range (USD, nullable — worker sets when publishing)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS today_rate_min integer;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS today_rate_max integer;

-- Today's travel radius in miles (nullable)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS today_radius_mi integer;

-- Today's available skills (denormalized task names for feed query performance)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS today_skills text[] DEFAULT '{}';

-- ── 3. Index for feed queries filtering by status ──

CREATE INDEX IF NOT EXISTS idx_profiles_worker_status
  ON public.profiles (worker_status)
  WHERE worker_status IN ('available', 'booked');

-- ── 4. Grant access (Supabase Data API requirement, enforced 2026-10-30) ──

-- No new table created — profiles already has grants.
-- New columns inherit existing table-level grants automatically.

COMMIT;
