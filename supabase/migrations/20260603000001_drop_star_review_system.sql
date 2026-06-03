-- ============================================================
-- XProHub — Drop the 5-star review system
--
-- Per Ruling 01 (binary endorse-only). The star review system was
-- a dead-end pipe: rating_avg was computed by trigger but never
-- displayed to any user. The endorse/concern system on the Receipt
-- screen is the live, rendered quality signal.
--
-- Drops: trigger after_review_insert, function update_profile_rating(),
-- table reviews, column profiles.rating_avg.
--
-- Preserves: endorsements table, endorsement_count, the receipt's
-- endorse/concern UI, the reports/concern path.
-- ============================================================

BEGIN;

-- Step 1: Drop the trigger (depends on the function)
DROP TRIGGER IF EXISTS after_review_insert ON public.reviews;

-- Step 2: Drop the function
DROP FUNCTION IF EXISTS public.update_profile_rating();

-- Step 3: Drop the reviews table
DROP TABLE IF EXISTS public.reviews;

-- Step 4: Drop the rating_avg column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS rating_avg;

-- ── Verification queries (run in Supabase SQL Editor after apply) ──
--
-- 1. Confirm reviews table is gone:
-- SELECT count(*) FROM reviews;
-- Expected: ERROR (relation "reviews" does not exist)
--
-- 2. Confirm rating_avg column is gone:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'profiles' AND column_name = 'rating_avg';
-- Expected: 0 rows
--
-- 3. Confirm endorsements table is UNTOUCHED:
-- SELECT count(*) FROM endorsements;
-- Expected: whatever count existed before (should succeed)

COMMIT;
