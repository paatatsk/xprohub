-- ============================================================
-- XProHub — Worker Portfolio table
-- Stores worker self-promotion assets: photos, certificates,
-- and references. All three types share one table with a type
-- discriminator. This slice ships photo upload/display; cert
-- and reference UI follows in B3.
--
-- RLS: public-read for all authenticated users (lesson from
-- A1 — party-scoped reads broke non-owner photo display).
-- Owner insert/delete only. No UPDATE (immutable; delete +
-- re-add to change).
--
-- NOTE: The 'worker-portfolio' Storage bucket (Public) and its
-- INSERT policy were created manually in the Supabase dashboard.
-- A fresh project rebuild MUST recreate both.
--
-- Migration: 20260610000002_worker_portfolio.sql
-- ============================================================

BEGIN;

CREATE TABLE public.worker_portfolio (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('photo', 'certificate', 'reference')),
  url         TEXT NOT NULL,
  caption     TEXT,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup: all portfolio items for a worker
CREATE INDEX idx_worker_portfolio_user
  ON public.worker_portfolio (user_id);

-- Filtered lookup: items by type (e.g. only photos for the strip)
CREATE INDEX idx_worker_portfolio_user_type
  ON public.worker_portfolio (user_id, type);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE public.worker_portfolio ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated user can view portfolio items (public trust layer)
CREATE POLICY "Authenticated users read portfolio"
  ON public.worker_portfolio FOR SELECT
  TO authenticated
  USING (true);

-- Insert: owner only
CREATE POLICY "Owner inserts own portfolio items"
  ON public.worker_portfolio FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Delete: owner only
CREATE POLICY "Owner deletes own portfolio items"
  ON public.worker_portfolio FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- No UPDATE policy — immutable; delete + re-add to change

-- ── Grants ───────────────────────────────────────────────────
-- Required per Supabase Data API change (enforced 2026-10-30)

GRANT SELECT ON public.worker_portfolio TO anon;
GRANT SELECT, INSERT, DELETE ON public.worker_portfolio TO authenticated;
GRANT ALL ON public.worker_portfolio TO service_role;

COMMIT;
