-- ============================================================
-- XProHub — Rehire-safe: support cancel-then-rehire flow
--
-- After cancel-hire refunds a matched job and reopens it, a new
-- worker can be hired. This migration removes two blockers:
--
-- 1. Payments: add a partial unique index so only ONE active
--    (held/released) payment row exists per job. Refunded rows
--    are history and must not block a fresh charge.
--
-- 2. Chat creation: accept_bid and accept_direct_offer both
--    INSERT INTO chats unconditionally. The original schema has
--    UNIQUE(job_id) on chats, so a re-hire attempt crashes on
--    the surviving chat from the cancelled hire. Fix: reuse the
--    existing chat (UPDATE worker_id + metadata) when one exists,
--    INSERT only when absent.
--
-- No changes to hire-and-charge Edge Function needed — it has
-- no payment pre-check and delegates chat creation to the RPCs.
--
-- No changes to create_payment_record needed — its idempotency
-- key is stripe_payment_intent_id (unique per PI, not per job).
--
-- Migration: 20260725000001_rehire_safe.sql
-- ============================================================

BEGIN;


-- ══════════════════════════════════════════════════════════════
-- A. Partial unique index on payments(job_id)
-- ══════════════════════════════════════════════════════════════
--
-- Prevents two active payment rows for the same job (double-
-- charge safety net). Refunded/disputed rows are excluded —
-- they're historical records that must not block a new charge.
--
-- The non-unique idx_payments_job (from 20260428000001) is kept
-- for general lookups. This adds a stricter partial constraint.

CREATE UNIQUE INDEX IF NOT EXISTS payments_job_id_active_key
  ON payments (job_id)
  WHERE escrow_status IN ('held', 'released');


-- ══════════════════════════════════════════════════════════════
-- B. accept_bid — rehire-safe chat creation
-- ══════════════════════════════════════════════════════════════
--
-- Changes from prior version (20260503000001):
--   Step 9: check for existing chat before inserting. If a chat
--   exists (from a cancelled previous hire), update its worker_id
--   and metadata. Only insert when no chat exists.
--
-- All other logic is identical.

CREATE OR REPLACE FUNCTION accept_bid(p_bid_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid        record;
  v_job        record;
  v_caller     uuid := auth.uid();
  v_chat_id    uuid;
  v_first_msg  text;
BEGIN
  -- 1. Load the target bid
  SELECT * INTO v_bid FROM bids WHERE id = p_bid_id;
  IF v_bid IS NULL THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;

  -- 2. Load the associated job
  SELECT * INTO v_job FROM jobs WHERE id = v_bid.job_id;
  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  -- 3. Auth gate — only the customer of the job can accept bids on it
  IF v_job.customer_id != v_caller THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 4. Ensure bid is in an accept-able state
  IF v_bid.status != 'pending' THEN
    RAISE EXCEPTION 'Bid is not pending (current status: %)', v_bid.status;
  END IF;

  -- 5. Ensure job is still open
  IF v_job.status != 'open' THEN
    RAISE EXCEPTION 'Job is not open (current status: %)', v_job.status;
  END IF;

  -- 6. Flip target bid → accepted
  UPDATE bids SET status = 'accepted' WHERE id = p_bid_id;

  -- 7. Auto-decline all other pending bids on this job
  UPDATE bids
    SET status = 'declined'
    WHERE job_id = v_bid.job_id
      AND id     != p_bid_id
      AND status  = 'pending';

  -- 8. Update job → matched + assign worker + lock agreed price
  UPDATE jobs
    SET status       = 'matched',
        worker_id    = v_bid.worker_id,
        agreed_price = v_bid.proposed_price
    WHERE id = v_bid.job_id;

  -- 9. Chat: reuse existing or create new (rehire-safe)
  v_first_msg := 'Application accepted! Let''s coordinate the details.';

  SELECT id INTO v_chat_id FROM chats WHERE job_id = v_bid.job_id;

  IF v_chat_id IS NOT NULL THEN
    -- Reuse surviving chat from a previous (cancelled) hire
    UPDATE chats
      SET worker_id       = v_bid.worker_id,
          last_message    = v_first_msg,
          last_message_at = now()
      WHERE id = v_chat_id;
  ELSE
    -- First hire — create fresh chat
    INSERT INTO chats (job_id, customer_id, worker_id, last_message, last_message_at)
    VALUES (v_bid.job_id, v_caller, v_bid.worker_id, v_first_msg, now())
    RETURNING id INTO v_chat_id;
  END IF;

  -- 10. Insert opening message (non-fatal — chat still succeeds if this fails)
  BEGIN
    INSERT INTO messages (chat_id, sender_id, content, message_type)
    VALUES (v_chat_id, v_caller, v_first_msg, 'text');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- swallow; caller will still see the chat
  END;

  RETURN v_chat_id;
END;
$$;


-- ══════════════════════════════════════════════════════════════
-- C. accept_direct_offer — rehire-safe chat creation
-- ══════════════════════════════════════════════════════════════
--
-- Changes from prior version (20260721000003):
--   Step 10: same reuse-or-create pattern as accept_bid above.
--
-- All other logic (auth gate, self-hire guard, etc.) is identical.

CREATE OR REPLACE FUNCTION accept_direct_offer(p_bid_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid        record;
  v_job        record;
  v_caller     uuid := auth.uid();
  v_chat_id    uuid;
  v_first_msg  text;
BEGIN
  -- 1. Load the target bid
  SELECT * INTO v_bid FROM bids WHERE id = p_bid_id;
  IF v_bid IS NULL THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;

  -- 2. Must be a direct offer
  IF v_bid.is_direct_offer != true THEN
    RAISE EXCEPTION 'Bid is not a direct offer';
  END IF;

  -- 3. Load the associated job
  SELECT * INTO v_job FROM jobs WHERE id = v_bid.job_id;
  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  -- 4. Auth gate — only the targeted worker can accept
  IF v_bid.worker_id != v_caller THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 4b. Self-hire guard — worker and customer must be different people
  IF v_bid.worker_id = v_job.customer_id THEN
    RAISE EXCEPTION 'Self-hire is not allowed';
  END IF;

  -- 5. Ensure bid is in an accept-able state
  IF v_bid.status != 'pending' THEN
    RAISE EXCEPTION 'Bid is not pending (current status: %)', v_bid.status;
  END IF;

  -- 6. Ensure job is still open
  IF v_job.status != 'open' THEN
    RAISE EXCEPTION 'Job is not open (current status: %)', v_job.status;
  END IF;

  -- 7. Flip target bid → accepted
  UPDATE bids SET status = 'accepted' WHERE id = p_bid_id;

  -- 8. Auto-decline all other pending bids on this job (defensive —
  --    targeted jobs should have no other bids, but safe to sweep)
  UPDATE bids
    SET status = 'declined'
    WHERE job_id = v_bid.job_id
      AND id     != p_bid_id
      AND status  = 'pending';

  -- 9. Update job → matched + assign worker + lock agreed price
  UPDATE jobs
    SET status       = 'matched',
        worker_id    = v_bid.worker_id,
        agreed_price = v_bid.proposed_price
    WHERE id = v_bid.job_id;

  -- 10. Chat: reuse existing or create new (rehire-safe)
  v_first_msg := 'Direct hire accepted! Let''s coordinate the details.';

  SELECT id INTO v_chat_id FROM chats WHERE job_id = v_bid.job_id;

  IF v_chat_id IS NOT NULL THEN
    -- Reuse surviving chat from a previous (cancelled) hire
    UPDATE chats
      SET worker_id       = v_bid.worker_id,
          last_message    = v_first_msg,
          last_message_at = now()
      WHERE id = v_chat_id;
  ELSE
    -- First hire — create fresh chat
    INSERT INTO chats (job_id, customer_id, worker_id, last_message, last_message_at)
    VALUES (v_bid.job_id, v_job.customer_id, v_bid.worker_id, v_first_msg, now())
    RETURNING id INTO v_chat_id;
  END IF;

  -- 11. Insert opening message (non-fatal — chat still succeeds if this fails)
  BEGIN
    INSERT INTO messages (chat_id, sender_id, content, message_type)
    VALUES (v_chat_id, v_bid.worker_id, v_first_msg, 'text');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- swallow; caller will still see the chat
  END;

  RETURN v_chat_id;
END;
$$;


COMMIT;


-- ══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run in Supabase SQL Editor after apply)
-- ══════════════════════════════════════════════════════════════

-- 1. Confirm partial unique index on payments:
-- SELECT indexname, indexdef
--   FROM pg_indexes
--   WHERE tablename = 'payments'
--     AND indexname = 'payments_job_id_active_key';
-- Expected: 1 row, indexdef contains WHERE escrow_status

-- 2. Confirm accept_bid has reuse-or-create pattern:
-- SELECT routine_name,
--        position('Reuse surviving chat' in routine_definition) > 0
--          AS has_chat_reuse
--   FROM information_schema.routines
--   WHERE routine_schema = 'public'
--     AND routine_name = 'accept_bid';
-- Expected: has_chat_reuse = true

-- 3. Confirm accept_direct_offer has reuse-or-create pattern:
-- SELECT routine_name,
--        position('Reuse surviving chat' in routine_definition) > 0
--          AS has_chat_reuse
--   FROM information_schema.routines
--   WHERE routine_schema = 'public'
--     AND routine_name = 'accept_direct_offer';
-- Expected: has_chat_reuse = true
