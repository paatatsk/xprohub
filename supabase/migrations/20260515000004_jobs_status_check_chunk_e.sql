-- ============================================================
-- XProHub — Chunk E-12: Fix jobs_status_check constraint
--
-- The original schema's CHECK constraint on jobs.status only
-- allows: open, matched, in_progress, completed, cancelled,
-- expired. Chunk E-1 added two new statuses (pending_confirmation,
-- disputed) via mark_completed and raise_dispute functions, but
-- did not update the constraint. This migration fixes that.
--
-- Bug discovered during E-12 iPhone testing: worker tapped
-- MARK COMPLETED → mark_completed set status='pending_confirmation'
-- → Postgres rejected the INSERT with "new row for relation 'jobs'
-- violates check constraint 'jobs_status_check'".
-- ============================================================

BEGIN;

-- Drop existing constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

-- Recreate with full status list including Chunk E additions
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
  CHECK (status = ANY (ARRAY[
    'open',
    'matched',
    'in_progress',
    'pending_confirmation',
    'completed',
    'disputed',
    'cancelled',
    'expired'
  ]));

COMMIT;
