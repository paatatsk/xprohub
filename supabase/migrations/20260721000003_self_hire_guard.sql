-- ============================================================
-- XProHub — Self-hire guard on accept_direct_offer
--
-- Defense in depth: prevents accepting a direct offer where the
-- worker and customer are the same person. The client-side guard
-- in direct-hire.tsx blocks self-targeting at send time, but this
-- server-side guard ensures that even if a self-offer bid somehow
-- exists, it cannot be accepted/charged.
--
-- Only change: adds step 4b after the auth gate — raises if
-- bid.worker_id = job.customer_id. All other logic is identical
-- to migration 20260721000001.
--
-- Signature unchanged: accept_direct_offer(UUID) RETURNS UUID.
-- CREATE OR REPLACE preserves the existing GRANT to authenticated.
-- ============================================================

BEGIN;

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

  -- 10. Create chat for the matched pair
  v_first_msg := 'Direct hire accepted! Let''s coordinate the details.';
  INSERT INTO chats (job_id, customer_id, worker_id, last_message, last_message_at)
  VALUES (v_bid.job_id, v_job.customer_id, v_bid.worker_id, v_first_msg, now())
  RETURNING id INTO v_chat_id;

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
