-- ============================================================
-- XProHub — Content Moderation: Wordlist + check_content()
--
-- Single source of truth for blocked words. Used by BOTH:
--   Server — check_content() plpgsql function (called from RPCs
--            and BEFORE INSERT triggers in later slices)
--   Client — fetched on app launch, cached in memory for the
--            session (advisory nudge; server is the real wall)
--
-- Two tiers, kept separate so general profanity can be dialed
-- back later without touching slur enforcement:
--   'slur'      — hate speech, always blocked
--   'profanity'  — unprofessional language, blocked for v1
--
-- Word-boundary matching (Scunthorpe-safe):
--   Postgres: \m (start of word) + \M (end of word) + ~* (case-insensitive)
--   Client TS: \b (word boundary) + RegExp('i') flag
--   "assistant" does NOT match "ass" because \m/\M require word boundaries.
--
-- RLS: authenticated can SELECT (client cache fetch).
--       Only service_role can INSERT/UPDATE/DELETE (admin).
--
-- Wordlist entries are plain lowercase words. Do not add regex
-- metacharacters — they would be interpreted as regex syntax.
-- ============================================================

BEGIN;


-- ── A. moderation_wordlist table ──────────────────────────────

CREATE TABLE public.moderation_wordlist (
  word       TEXT PRIMARY KEY,
  tier       TEXT NOT NULL CHECK (tier IN ('slur', 'profanity')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GRANTs (Supabase Data API requirement)
GRANT SELECT ON public.moderation_wordlist TO authenticated;
GRANT ALL ON public.moderation_wordlist TO service_role;

-- RLS
ALTER TABLE public.moderation_wordlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read wordlist"
  ON public.moderation_wordlist
  FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies for authenticated.
-- Managed via service_role (Supabase dashboard / admin script).


-- ── B. check_content() helper function ────────────────────────
--
-- Returns NULL if text is clean, else a friendly error string.
-- Checks slurs first (higher priority), then profanity.
-- Called from create_job_with_tasks() and BEFORE INSERT triggers.
--
-- STABLE: reads only, results cacheable within a statement.
-- SECURITY DEFINER: guaranteed read access to moderation_wordlist
-- regardless of calling context (trigger, RPC, or direct call).

CREATE OR REPLACE FUNCTION check_content(p_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
BEGIN
  -- NULL or empty text is not a content violation
  IF p_text IS NULL OR trim(p_text) = '' THEN
    RETURN NULL;
  END IF;

  -- Find the highest-priority matching word.
  -- \m = start of word, \M = end of word (Postgres word-boundary).
  -- ~* = case-insensitive regex match.
  SELECT w.tier INTO v_tier
  FROM moderation_wordlist w
  WHERE p_text ~* ('\m' || w.word || '\M')
  ORDER BY CASE w.tier WHEN 'slur' THEN 1 ELSE 2 END
  LIMIT 1;

  IF v_tier = 'slur' THEN
    RETURN 'Please use respectful language.';
  ELSIF v_tier = 'profanity' THEN
    RETURN 'Let''s keep it professional — mind rephrasing?';
  END IF;

  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION check_content(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION check_content(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_content(TEXT) TO service_role;


-- ── C. Seed data ──────────────────────────────────────────────
-- Starter wordlist — expand via service_role INSERT as needed.
-- ON CONFLICT for idempotent re-runs.
--
-- TIER 1: SLURS (hate speech — always blocked)
-- These are terms primarily/exclusively used as hate speech.

INSERT INTO moderation_wordlist (word, tier) VALUES
  ('nigger',    'slur'),
  ('nigga',     'slur'),
  ('chink',     'slur'),
  ('spic',      'slur'),
  ('spick',     'slur'),
  ('kike',      'slur'),
  ('wetback',   'slur'),
  ('beaner',    'slur'),
  ('coon',      'slur'),
  ('raghead',   'slur'),
  ('towelhead',  'slur'),
  ('jigaboo',   'slur'),
  ('darkie',    'slur'),
  ('gook',      'slur'),
  ('faggot',    'slur'),
  ('fag',       'slur'),
  ('dyke',      'slur'),
  ('tranny',    'slur'),
  ('retard',    'slur'),
  ('retarded',  'slur'),
  ('spaz',      'slur'),
  ('spastic',   'slur')
ON CONFLICT (word) DO NOTHING;

-- TIER 2: PROFANITY (unprofessional — blocked for v1, can relax later)
-- Common English profanity that's unprofessional in a work context.
-- Includes key inflected forms (fucking, shitty, etc.) because
-- whole-word matching requires exact word matches.

INSERT INTO moderation_wordlist (word, tier) VALUES
  ('fuck',          'profanity'),
  ('fucking',       'profanity'),
  ('fucker',        'profanity'),
  ('shit',          'profanity'),
  ('shitty',        'profanity'),
  ('asshole',       'profanity'),
  ('bitch',         'profanity'),
  ('bitches',       'profanity'),
  ('bastard',       'profanity'),
  ('dick',          'profanity'),
  ('cock',          'profanity'),
  ('pussy',         'profanity'),
  ('cunt',          'profanity'),
  ('motherfucker',  'profanity'),
  ('bullshit',      'profanity'),
  ('whore',         'profanity'),
  ('slut',          'profanity'),
  ('twat',          'profanity'),
  ('prick',         'profanity'),
  ('jackass',       'profanity')
ON CONFLICT (word) DO NOTHING;


COMMIT;


-- ══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run in Supabase SQL Editor after apply)
-- ══════════════════════════════════════════════════════════════

-- 1. Confirm table + row counts:
-- SELECT tier, count(*) FROM moderation_wordlist GROUP BY tier;
-- Expected: slur = 22, profanity = 20

-- 2. Confirm check_content() works — clean text:
-- SELECT check_content('I need my apartment cleaned');
-- Expected: NULL

-- 3. Confirm check_content() catches a slur:
-- SELECT check_content('Some slur test with nigger in it');
-- Expected: 'Please use respectful language.'

-- 4. Confirm check_content() catches profanity:
-- SELECT check_content('This is bullshit');
-- Expected: 'Let''s keep it professional — mind rephrasing?'

-- 5. SCUNTHORPE TEST — clean word containing banned substring:
-- SELECT check_content('I need an assistant for the class');
-- Expected: NULL (NOT blocked — "ass" is a substring, not a whole word)

-- 6. Confirm RLS — authenticated can SELECT:
-- (Run from API Explorer as authenticated user, not SQL Editor)
-- SELECT * FROM moderation_wordlist;
-- Expected: all rows visible
