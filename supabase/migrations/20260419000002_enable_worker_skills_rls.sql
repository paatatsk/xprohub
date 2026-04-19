-- ============================================================
-- XProHub — Enable RLS on worker_skills for Workers Feed
-- Adds public SELECT so Live Market can display worker business cards
-- Adds authenticated INSERT/UPDATE/DELETE restricted to own rows
-- Run once in Supabase SQL Editor.
-- ============================================================

BEGIN;

ALTER TABLE public.worker_skills ENABLE ROW LEVEL SECURITY;

-- Anyone can read worker skills (public directory — business card wall)
CREATE POLICY "worker_skills_public_read"
  ON public.worker_skills
  FOR SELECT
  USING (true);

-- Workers manage their own skills only
CREATE POLICY "worker_skills_insert_own"
  ON public.worker_skills
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "worker_skills_update_own"
  ON public.worker_skills
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "worker_skills_delete_own"
  ON public.worker_skills
  FOR DELETE
  USING (auth.uid() = user_id);

COMMIT;
