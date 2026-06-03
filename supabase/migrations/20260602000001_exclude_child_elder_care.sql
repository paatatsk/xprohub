-- ============================================================
-- XProHub — Exclude Child Care + Elder Care from v1 (safety)
--
-- Soft-deactivate (reversible). Per SAFETY_SPEC_EXCLUDED_CATEGORIES.md:
-- these categories involve vulnerable populations (children, elderly)
-- and must not be offered until a real verification system exists.
--
-- Adds is_active column to task_categories (parallels task_library).
-- Sets is_active = false on categories 4 (Child Care) and 5 (Elder Care).
-- Sets is_active = false on all 17 tasks in those categories.
--
-- Reversal: UPDATE task_categories SET is_active = true WHERE id IN (4,5);
--           UPDATE task_library SET is_active = true WHERE category_id IN (4,5);
-- But ONLY after the verification path in the spec is built (§3).
-- ============================================================

BEGIN;

-- Step 1: Add is_active to task_categories (default true — all existing rows stay active)
ALTER TABLE task_categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Step 2: Deactivate Child Care and Elder Care categories
UPDATE task_categories SET is_active = false WHERE id IN (4, 5);

-- Step 3: Deactivate all 17 tasks in those categories
UPDATE task_library SET is_active = false WHERE category_id IN (4, 5);

-- ── Verification queries (run in Supabase SQL Editor after apply) ──
--
-- 1. Confirm categories deactivated:
-- SELECT id, name, is_active FROM task_categories WHERE id IN (4, 5);
-- Expected: both is_active = false
--
-- 2. Confirm tasks deactivated:
-- SELECT count(*) FROM task_library WHERE category_id IN (4, 5) AND is_active = true;
-- Expected: 0
--
-- 3. Confirm other categories unaffected:
-- SELECT count(*) FROM task_categories WHERE is_active = true;
-- Expected: 18 (20 total minus 2 deactivated)

COMMIT;
