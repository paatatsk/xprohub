-- ============================================================
-- XProHub — Chunk G-4 + G-5: Reports + User Blocks
--
-- Creates two tables for Apple App Store compliance (Guideline 1.2):
--   reports — user-generated content reporting mechanism
--   user_blocks — user blocking feature
--
-- Includes: GRANT statements per Supabase Data API Oct 2026
-- requirement, RLS policies, CHECK constraints for all enum-like
-- columns + self-referencing prevention + details length limit.
--
-- Locked decisions: docs/CHUNK_G_COMPLIANCE_DESIGN.md
-- "G-4 + G-5 Locked Decisions (2026-05-16 design pass)"
-- ============================================================

BEGIN;


-- ── A. reports table ─────────────────────────────────────────

CREATE TABLE public.reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      UUID NOT NULL REFERENCES profiles(id)
                     ON DELETE NO ACTION,
  reported_user_id UUID NOT NULL REFERENCES profiles(id)
                     ON DELETE NO ACTION,
  content_type     TEXT NOT NULL
    CHECK (content_type IN ('user', 'job', 'message')),
  content_id       UUID,
  reason           TEXT NOT NULL
    CHECK (reason IN ('spam', 'harassment', 'inappropriate',
                      'fraud', 'safety', 'other')),
  details          TEXT CHECK (length(details) <= 1000),
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'actioned',
                      'dismissed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (reporter_id != reported_user_id)
);

-- GRANTs (Supabase Data API requirement, Oct 2026)
GRANT INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

-- RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_insert_own"
  ON public.reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- No SELECT/UPDATE/DELETE for authenticated.
-- Admin reviews reports via service_role (Supabase dashboard or
-- Edge Function). Users cannot read, modify, or delete reports.


-- ── B. user_blocks table ─────────────────────────────────────

CREATE TABLE public.user_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  UUID NOT NULL REFERENCES profiles(id)
                ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES profiles(id)
                ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- GRANTs (Supabase Data API requirement, Oct 2026)
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;

-- RLS
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocks_select_own"
  ON public.user_blocks
  FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "blocks_insert_own"
  ON public.user_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocks_delete_own"
  ON public.user_blocks
  FOR DELETE
  USING (auth.uid() = blocker_id);


COMMIT;
