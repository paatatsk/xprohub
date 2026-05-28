-- ============================================================
-- XProHub — Denormalized endorsement count on profiles
-- Mirrors update_profile_xp() pattern: plain plpgsql trigger,
-- AFTER INSERT, no SECURITY DEFINER.
--
-- Order: ALTER → backfill → CREATE FUNCTION → CREATE TRIGGER
-- (trigger only fires on new inserts after backfill is complete)
-- ============================================================

BEGIN;

-- ── 1. Add column ────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS endorsement_count INTEGER DEFAULT 0;

-- ── 2. Backfill from existing endorsements ───────────────────

UPDATE public.profiles
SET endorsement_count = (
  SELECT COUNT(*)
  FROM public.endorsements
  WHERE worker_id = profiles.id
);

-- ── 3. Trigger function ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_profile_endorsement_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET endorsement_count = endorsement_count + 1
  WHERE id = new.worker_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- ── 4. Trigger ───────────────────────────────────────────────

CREATE TRIGGER after_endorsement_insert
  AFTER INSERT ON public.endorsements
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_endorsement_count();

COMMIT;
