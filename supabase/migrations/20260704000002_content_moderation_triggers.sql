-- ============================================================
-- XProHub — Content Moderation: Triggers + Constraints (Slice 3)
--
-- Server-side enforcement layer. Four components:
--   A. BEFORE INSERT trigger on messages — profanity check
--   B. BEFORE INSERT trigger on bids — profanity + rate-limit
--   C. Index on messages(sender_id) — future query support
--   D. CHECK constraints on jobs — title/description min-length
--
-- Both trigger functions call check_content() from Slice 1
-- (20260704000001). They are SECURITY DEFINER to guarantee
-- read access to moderation_wordlist and accurate rate-limit
-- counts regardless of RLS context.
--
-- Postgres BEFORE INSERT triggers fire BEFORE constraint checks
-- (FK, UNIQUE, CHECK), so the friendly moderation message is
-- what the user sees — not a raw constraint error.
--
-- CHECK constraints on jobs are NOT VALID (existing rows not
-- checked). Belt-and-suspenders behind the RPC validation
-- added in Slice 2.
-- ============================================================

BEGIN;


-- ── A. Messages trigger ───────────────────────────────────────
-- Checks NEW.content against the wordlist. No rate-limit on
-- messages in v1 (chat naturally runs fast).

CREATE OR REPLACE FUNCTION trg_fn_moderate_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_err TEXT;
BEGIN
  v_err := check_content(NEW.content);
  IF v_err IS NOT NULL THEN
    RAISE EXCEPTION '%', v_err;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_moderate_message
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_moderate_message();


-- ── B. Bids trigger ──────────────────────────────────────────
-- Checks NEW.message (if non-null) against the wordlist.
-- Rate-limit: max 10 bids per hour per worker.
-- Uses existing bids_worker_id_idx for the count query.

CREATE OR REPLACE FUNCTION trg_fn_moderate_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_err          TEXT;
  v_recent_count INT;
BEGIN
  -- 1. Profanity check (only if message is non-null)
  IF NEW.message IS NOT NULL THEN
    v_err := check_content(NEW.message);
    IF v_err IS NOT NULL THEN
      RAISE EXCEPTION '%', v_err;
    END IF;
  END IF;

  -- 2. Rate limit: 10 bids per hour
  SELECT count(*) INTO v_recent_count
  FROM bids
  WHERE worker_id = NEW.worker_id
    AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 10 THEN
    RAISE EXCEPTION 'You''re applying very quickly — please wait a bit before submitting more.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_moderate_bid
  BEFORE INSERT ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_moderate_bid();


-- ── C. Index on messages(sender_id) ──────────────────────────
-- No sender_id index exists. Needed for future sender-based
-- queries (rate-limiting if added, analytics, etc.).

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON public.messages (sender_id);


-- ── D. CHECK constraints on jobs (belt-and-suspenders) ────────
-- NOT VALID: existing rows not checked (some test jobs may have
-- short titles). Enforced on all new INSERTs and UPDATEs.

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_title_min_length
  CHECK (length(trim(title)) >= 3)
  NOT VALID;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_description_min_length
  CHECK (description IS NULL OR length(trim(description)) >= 15)
  NOT VALID;


COMMIT;
