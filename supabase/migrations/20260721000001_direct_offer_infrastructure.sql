-- ============================================================
-- XProHub — Direct Offer Infrastructure
-- Slice 1: Schema + RPCs for charge-on-acceptance direct hire.
--
-- Design: Direct Hire now creates a targeted open job + a
-- "direct offer" bid row (is_direct_offer = true). The worker
-- sees the offer in My Applications and can accept or decline.
-- Accepting triggers hire-and-charge (Slice 2), which charges
-- the CUSTOMER's card off-session before flipping the job to
-- matched — preserving the "Hire Moment = Charge Moment"
-- invariant. Declining cancels the targeted job (it was never
-- in the public market, so there's nothing to return it to).
--
-- This migration provides:
--   A. is_direct_offer column on bids (boolean, default false)
--   B. RLS policy: customers may INSERT direct-offer bids on
--      their own jobs (existing worker INSERT policy untouched)
--   C. accept_direct_offer(p_bid_id) — worker-authorized,
--      mirrors accept_bid's atomic structure (bid→accepted,
--      job→matched, chat+message creation)
--   D. decline_direct_offer(p_bid_id) — worker-authorized,
--      declines bid AND cancels the targeted job
--
-- Why decline cancels the job:
--   A direct-hire job is targeted at one specific worker. If
--   the worker declines, there's no bidding pool to fall back
--   to. The job was never visible in Live Market (status=open
--   but worker_id is set). Cancelling is the honest outcome —
--   the customer can re-post or target another worker.
--
-- Reversible:
--   DROP FUNCTION IF EXISTS accept_direct_offer(UUID);
--   DROP FUNCTION IF EXISTS decline_direct_offer(UUID);
--   DROP POLICY IF EXISTS "Customers create direct offers" ON bids;
--   ALTER TABLE bids DROP COLUMN IF EXISTS is_direct_offer;
-- ============================================================

BEGIN;


-- ── A. Column ────────────────────────────────────────────────

ALTER TABLE bids
  ADD COLUMN IF NOT EXISTS is_direct_offer BOOLEAN NOT NULL DEFAULT false;


-- ── B. RLS policy — customer-side INSERT for direct offers ───
-- Existing policy "Workers submit bids" (auth.uid() = worker_id)
-- is untouched. This new policy allows the job's customer to
-- insert a bid row only when is_direct_offer = true.

CREATE POLICY "Customers create direct offers" ON bids FOR INSERT
  WITH CHECK (
    is_direct_offer = true
    AND auth.uid() IN (
      SELECT customer_id FROM jobs WHERE id = job_id
    )
  );


-- ── C. accept_direct_offer ───────────────────────────────────
-- Worker accepts a direct offer. Mirrors accept_bid's atomic
-- structure: bid→accepted, auto-decline sweep (defensive),
-- job→matched with agreed_price, chat + first message.
--
-- Auth: caller must be the WORKER on the bid (not the customer).
-- Returns the new chat_id for client navigation.

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


-- ── D. decline_direct_offer ──────────────────────────────────
-- Worker declines a direct offer. Declines the bid AND cancels
-- the targeted job (no bidding pool to fall back to).
--
-- Auth: caller must be the WORKER on the bid.

CREATE OR REPLACE FUNCTION decline_direct_offer(p_bid_id UUID)
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

  -- 2. Must be a direct offer
  IF v_bid.is_direct_offer != true THEN
    RAISE EXCEPTION 'Bid is not a direct offer';
  END IF;

  -- 3. Load the associated job
  SELECT * INTO v_job FROM jobs WHERE id = v_bid.job_id;
  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  -- 4. Auth gate — only the targeted worker can decline
  IF v_bid.worker_id != v_caller THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 5. Only pending bids can be declined
  IF v_bid.status != 'pending' THEN
    RAISE EXCEPTION 'Bid is not pending (current status: %)', v_bid.status;
  END IF;

  -- 6. Flip bid → declined
  UPDATE bids SET status = 'declined' WHERE id = p_bid_id;

  -- 7. Cancel the targeted job (no public market to return to)
  UPDATE jobs
    SET status = 'cancelled'
    WHERE id = v_bid.job_id
      AND status = 'open';
END;
$$;


-- ── E. Grants ────────────────────────────────────────────────
-- Authenticated users can call both functions. Functions enforce
-- worker-only auth via auth.uid() checks internally.
-- Anon excluded — direct offer management requires auth.

GRANT EXECUTE ON FUNCTION accept_direct_offer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_direct_offer(UUID) TO authenticated;


COMMIT;


-- ══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run after applying)
-- ══════════════════════════════════════════════════════════════

-- 1. Confirm is_direct_offer column exists:
-- SELECT column_name, data_type, column_default, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'bids' AND column_name = 'is_direct_offer';
-- Expected: 1 row — boolean, default false, NO

-- 2. Confirm both INSERT policies on bids:
-- SELECT policyname FROM pg_policies
--   WHERE tablename = 'bids' AND cmd = 'INSERT';
-- Expected: "Workers submit bids" + "Customers create direct offers"

-- 3. Confirm both functions exist with DEFINER security:
-- SELECT routine_name, security_type
--   FROM information_schema.routines
--   WHERE routine_schema = 'public'
--     AND routine_name IN ('accept_direct_offer', 'decline_direct_offer');
-- Expected: 2 rows, both security_type = 'DEFINER'
