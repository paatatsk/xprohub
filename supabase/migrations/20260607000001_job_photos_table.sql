-- ============================================================
-- XProHub — Job Photos table
-- Shared photo storage for all three stages of the photo system:
--   'listing'  — customer attaches when posting a job
--   'before'   — worker uploads before starting work
--   'after'    — worker uploads as completion evidence
--
-- Photos are immutable evidence — no UPDATE or DELETE in v1.
-- Party-read scoped via subquery into jobs (same pattern as
-- job_post_tasks "Job parties read job tasks" policy).
--
-- Migration: 20260607000001_job_photos_table.sql
-- ============================================================

CREATE TABLE public.job_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  photo_type  TEXT NOT NULL CHECK (photo_type IN ('listing', 'before', 'after')),
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  caption     TEXT,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup: all photos for a job
CREATE INDEX idx_job_photos_job
  ON public.job_photos (job_id);

-- Filtered lookup: photos for a job by type (e.g. only 'after' for Receipt)
CREATE INDEX idx_job_photos_job_type
  ON public.job_photos (job_id, photo_type);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;

-- Read: both parties on the job can see its photos
-- (mirrors "Job parties read job tasks" on job_post_tasks)
CREATE POLICY "Job parties read photos"
  ON public.job_photos FOR SELECT
  USING (
    auth.uid() = (
      SELECT customer_id FROM public.jobs WHERE id = job_id
    )
    OR
    auth.uid() = (
      SELECT worker_id FROM public.jobs WHERE id = job_id
    )
  );

-- Write: job parties can insert photos attributed to themselves
CREATE POLICY "Job parties insert own photos"
  ON public.job_photos FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND (
      auth.uid() = (
        SELECT customer_id FROM public.jobs WHERE id = job_id
      )
      OR
      auth.uid() = (
        SELECT worker_id FROM public.jobs WHERE id = job_id
      )
    )
  );

-- No UPDATE or DELETE policies — photos are immutable evidence

-- ── Grants ───────────────────────────────────────────────────
-- Required per Supabase Data API change (enforced 2026-10-30)

GRANT SELECT, INSERT ON public.job_photos TO authenticated;
GRANT SELECT ON public.job_photos TO anon;
GRANT ALL ON public.job_photos TO service_role;
