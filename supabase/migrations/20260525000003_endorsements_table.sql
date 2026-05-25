-- ============================================================
-- XProHub — Endorsements table
-- Binary confidence vote: customer endorses worker's completed job.
-- Immutable once cast — no edit, no delete, no un-endorse.
-- One endorsement per job (customer can only endorse once).
--
-- Endorsement is a trust signal on the worker's profile.
-- "Raise a concern" is a separate action via the reports table.
-- The two are mutually exclusive at the UI level but stored in
-- separate tables — endorsements for the positive signal,
-- reports for concerns.
--
-- worker_id is denormalized from jobs.worker_id at endorse time
-- for fast profile lookups without joining jobs.
-- ============================================================

BEGIN;

CREATE TABLE public.endorsements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES public.jobs(id),
  endorser_id UUID NOT NULL REFERENCES public.profiles(id),
  worker_id   UUID NOT NULL REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One endorsement per job — prevents double-tap
CREATE UNIQUE INDEX idx_endorsements_job
  ON public.endorsements (job_id);

-- Lookup: all endorsements a worker has received
CREATE INDEX idx_endorsements_worker
  ON public.endorsements (worker_id);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;

-- Read: both parties on the job can see the endorsement
CREATE POLICY "Endorsement parties can read"
  ON public.endorsements FOR SELECT
  USING (
    auth.uid() = endorser_id OR auth.uid() = worker_id
  );

-- Write: only the endorser (customer) can insert
CREATE POLICY "Endorser can insert"
  ON public.endorsements FOR INSERT
  WITH CHECK (
    auth.uid() = endorser_id
  );

-- No UPDATE or DELETE policies — endorsements are immutable

-- ── Grants ───────────────────────────────────────────────────
-- Required per Supabase Data API change (enforced 2026-10-30)

GRANT SELECT, INSERT ON public.endorsements TO authenticated;
GRANT SELECT ON public.endorsements TO anon;
GRANT ALL ON public.endorsements TO service_role;

COMMIT;
