-- ============================================================
-- XProHub — Fix create_payment_record state gate
--
-- Problem: the status guard required status = 'matched' exactly.
-- Stripe's payment_intent.succeeded webhook can land after the
-- worker has already advanced the job (matched → in_progress or
-- beyond). When that happens, create_payment_record raises
-- "Job not in matched state" and every Stripe retry also fails,
-- leaving a valid charge with no payments row.
--
-- Fix: widen the guard to accept any post-hire, pre-completion
-- status: matched, in_progress, pending_confirmation. These all
-- represent a job where a charge has succeeded and the active
-- lifecycle is underway.
--
-- Still rejected (unchanged):
--   open              — not yet hired, no charge should exist
--   completed         — job done, row should already exist
--   cancelled/expired — no valid charge
--   disputed          — row should already exist
--
-- Idempotency unchanged: ON CONFLICT (stripe_payment_intent_id)
-- DO NOTHING prevents duplicate rows regardless of how many
-- times Stripe retries.
--
-- Single-writer unchanged: EXECUTE is revoked from public, anon,
-- authenticated (migration 20260528000001). Only the webhook
-- Edge Function via service_role can call this.
--
-- Reversible: re-run the original CREATE OR REPLACE from
-- migration 20260428000001.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION create_payment_record(
  p_job_id                   UUID,
  p_stripe_payment_intent_id TEXT,
  p_amount                   NUMERIC,
  p_platform_fee             NUMERIC,
  p_worker_payout            NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job        record;
  v_payment_id uuid;
BEGIN
  -- 1. Load the job to pull customer_id and worker_id
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;

  -- 2. State gate — job must be in a post-hire, pre-completion state.
  --    Webhook delivery can lag behind the worker advancing the job
  --    (matched → in_progress → pending_confirmation), so all three
  --    are valid. The payment is real in any of these states.
  IF v_job.status NOT IN ('matched', 'in_progress', 'pending_confirmation') THEN
    RAISE EXCEPTION 'Job not in a valid post-hire state (current: %)', v_job.status;
  END IF;

  -- 3. Idempotent insert — ON CONFLICT DO NOTHING handles duplicate
  --    webhook delivery atomically. RETURNING populates v_payment_id
  --    on a fresh insert; stays NULL if the conflict fired.
  INSERT INTO payments (
    job_id,
    customer_id,
    worker_id,
    amount,
    platform_fee,
    worker_payout,
    stripe_payment_intent_id,
    escrow_status
  ) VALUES (
    p_job_id,
    v_job.customer_id,
    v_job.worker_id,
    p_amount,
    p_platform_fee,
    p_worker_payout,
    p_stripe_payment_intent_id,
    'held'
  )
  ON CONFLICT (stripe_payment_intent_id) DO NOTHING
  RETURNING id INTO v_payment_id;

  -- 4. If conflict fired (existing row), fetch the existing id
  IF v_payment_id IS NULL THEN
    SELECT id INTO v_payment_id
      FROM payments
      WHERE stripe_payment_intent_id = p_stripe_payment_intent_id;
  END IF;

  RETURN v_payment_id;
END;
$$;

COMMIT;


-- ══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run after applying)
-- ══════════════════════════════════════════════════════════════

-- 1. Confirm function body contains the widened gate:
-- SELECT routine_name,
--        position('NOT IN' in routine_definition) > 0 AS has_not_in,
--        position('in_progress' in routine_definition) > 0 AS has_in_progress,
--        position('pending_confirmation' in routine_definition) > 0 AS has_pending_confirmation
--   FROM information_schema.routines
--   WHERE routine_schema = 'public'
--     AND routine_name = 'create_payment_record';
-- Expected: all three = true
