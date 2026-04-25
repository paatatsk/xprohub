-- ============================================================
-- XProHub — Bid Accept / Decline Functions
-- Step 8: Customer-side bid management
--
-- Creates two SECURITY DEFINER functions:
--   accept_bid(p_bid_id)  — atomically accepts one bid, auto-declines
--                           all other pending bids on the same job,
--                           transitions job → matched, and opens a chat.
--                           Returns the new chat_id for client navigation.
--   decline_bid(p_bid_id) — declines a single pending bid explicitly.
--
-- Why SECURITY DEFINER:
--   Accepting a bid requires updating both `bids` (no RLS UPDATE policy)
--   and `jobs` in a single atomic transaction, then inserting into `chats`
--   and `messages`. Running as the function owner bypasses RLS for all
--   four tables, while the explicit auth.uid() check inside each function
--   enforces that only the job's customer can call them.
-- ============================================================

BEGIN;

-- ── accept_bid ────────────────────────────────────────────────
-- Accepts one bid, auto-declines all other pending bids on the
-- same job, transitions the job to matched, and opens a chat.
-- Returns the new chat_id.

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

  -- 8. Update job → matched + assign worker
  UPDATE jobs
    SET status    = 'matched',
        worker_id = v_bid.worker_id
    WHERE id = v_bid.job_id;

  -- 9. Create chat for the matched pair
  v_first_msg := 'Application accepted! Let''s coordinate the details.';
  INSERT INTO chats (job_id, customer_id, worker_id, last_message, last_message_at)
  VALUES (v_bid.job_id, v_caller, v_bid.worker_id, v_first_msg, now())
  RETURNING id INTO v_chat_id;

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


-- ── decline_bid ───────────────────────────────────────────────
-- Declines a single pending bid explicitly.
-- Worker is notified via the notification system (future step).

CREATE OR REPLACE FUNCTION decline_bid(p_bid_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid    record;
  v_job    record;
  v_caller uuid := auth.uid();
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

  -- 3. Auth gate — only the job's customer can decline bids
  IF v_job.customer_id != v_caller THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 4. Only pending bids can be declined
  IF v_bid.status != 'pending' THEN
    RAISE EXCEPTION 'Bid is not pending';
  END IF;

  -- 5. Flip bid → declined
  UPDATE bids SET status = 'declined' WHERE id = p_bid_id;
END;
$$;


-- ── Grants ────────────────────────────────────────────────────
-- Allow authenticated users to call both functions.
-- anon role intentionally excluded — bid management requires auth.

GRANT EXECUTE ON FUNCTION accept_bid(UUID)  TO authenticated;
GRANT EXECUTE ON FUNCTION decline_bid(UUID) TO authenticated;


COMMIT;
