-- ============================================================
-- XProHub — accept_bid: populate agreed_price on job
-- Finding #11 from discrepancy investigation 2026-05-03.
--
-- Problem: accept_bid() set jobs.status and jobs.worker_id but
-- did not set jobs.agreed_price. The column stayed NULL after
-- bid acceptance, which will break Step 13 payment flow (needs
-- a non-NULL amount to charge). SESSION_HANDOUT.md documented
-- agreed_price as "populated when bid is accepted (Step 8)" but
-- the implementation missed it.
--
-- Fix: Add agreed_price = v_bid.proposed_price to the job UPDATE
-- in step 8 of the function. One line added. All other logic is
-- identical to migration 20260424000001.
--
-- Signature unchanged: accept_bid(UUID) RETURNS UUID.
-- CREATE OR REPLACE preserves the existing GRANT to authenticated.
-- ============================================================

BEGIN;

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


-- ── Verification query ───────────────────────────────────────
-- Run in Supabase SQL Editor after applying. Confirms the
-- function body contains the agreed_price assignment:
SELECT routine_name,
       position('agreed_price' in routine_definition) > 0
         AS has_agreed_price
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name   = 'accept_bid';
-- Expected: has_agreed_price = true


COMMIT;
