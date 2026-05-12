-- =============================================================
-- XProHub — Chunk D: Customer payment method gate flag
-- =============================================================
--
-- Adds a boolean column to profiles tracking whether the user has
-- successfully attached a Stripe payment method to their Customer
-- object. This is the gate flag that post.tsx reads when a user
-- taps Submit on Post a Job.
--
-- Pattern mirrors stripe_charges_enabled on the worker side
-- (added in 20260428000001_step13_payments_schema.sql).
--
-- Webhook lifecycle:
--   setup_intent.succeeded → stripe_payment_method_added = true
--
-- The column is set NOT NULL DEFAULT FALSE so every existing row
-- gets FALSE on column creation. No backfill needed — users who
-- have never added a payment method correctly default to false.
--
-- Related: docs/CHUNK_D_DESIGN.md (commit 3e235ff)
-- =============================================================

BEGIN;

-- ── Add column ──────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_payment_method_added
  BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Verification ────────────────────────────────────────────
-- Expected result after this migration:
--   SELECT column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--   WHERE table_name = 'profiles'
--     AND column_name = 'stripe_payment_method_added';
--
-- Should return:
--   column_name                  | data_type | is_nullable | column_default
--   stripe_payment_method_added  | boolean   | NO          | false
-- ────────────────────────────────────────────────────────────

COMMIT;
