-- ============================================================
-- XProHub — Add first_name to profiles
-- User-owned display name for receipts, greetings, and copy.
-- Replaces the runtime split(' ')[0] pattern on full_name.
--
-- Backfill: one-time v1.0 migration populates existing rows
-- by splitting full_name on first space. New users will set
-- first_name directly at profile-setup.
-- ============================================================

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT;

-- One-time backfill for existing rows.
-- split_part('Maria Reyes', ' ', 1) → 'Maria'
-- split_part('Daniel', ' ', 1) → 'Daniel' (no space = full string)
UPDATE public.profiles
  SET first_name = split_part(full_name, ' ', 1)
  WHERE first_name IS NULL
    AND full_name IS NOT NULL;

COMMIT;
