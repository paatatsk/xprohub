-- ============================================================
-- XProHub — Task Library v1.1 Migration
-- Replaces flat skills/user_skills with 4-table task structure
-- Run once against the live Supabase project.
-- ============================================================

BEGIN;

-- ── Part A: Drop old tables (empty of real data) ─────────────

DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;

-- ── Part B: Create 4 new tables ──────────────────────────────

CREATE TABLE task_categories (
  id                        SMALLINT    PRIMARY KEY,
  name                      TEXT        NOT NULL,
  icon_slug                 TEXT,
  tier                      SMALLINT    NOT NULL CHECK (tier IN (1, 2)),
  billing_type              TEXT        NOT NULL
                              CHECK (billing_type IN ('per_job','per_hour','per_visit_day','mixed')),
  price_min                 INTEGER     NOT NULL,
  price_max                 INTEGER     NOT NULL,
  difficulty_range          TEXT        NOT NULL,
  requires_background_check BOOLEAN     NOT NULL DEFAULT false,
  sort_order                SMALLINT    NOT NULL DEFAULT 0
);

CREATE TABLE task_library (
  id                    SERIAL      PRIMARY KEY,
  task_code             TEXT        UNIQUE NOT NULL,
  category_id           SMALLINT    NOT NULL REFERENCES task_categories(id),
  name                  TEXT        NOT NULL,
  description           TEXT        NOT NULL,
  tags                  TEXT[]      NOT NULL DEFAULT '{}',
  price_min             INTEGER     NOT NULL,
  price_max             INTEGER     NOT NULL,
  est_time_min_hrs      NUMERIC,
  est_time_max_hrs      NUMERIC,
  difficulty            TEXT        NOT NULL
                          CHECK (difficulty IN ('easy','medium','skilled')),
  billing_type          TEXT        NOT NULL
                          CHECK (billing_type IN ('per_job','per_hour','per_visit_day')),
  requires_verification BOOLEAN     NOT NULL DEFAULT false,
  is_urgent_eligible    BOOLEAN     NOT NULL DEFAULT false,
  is_active             BOOLEAN     NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE worker_skills (
  id          SERIAL      PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id     INTEGER     NOT NULL REFERENCES task_library(id),
  years_exp   SMALLINT,
  is_featured BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, task_id)
);

CREATE TABLE job_post_tasks (
  id          SERIAL  PRIMARY KEY,
  job_post_id UUID    NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  task_id     INTEGER NOT NULL REFERENCES task_library(id),
  UNIQUE (job_post_id, task_id)
);

-- ── Part C: Trigger function + updated_at trigger ────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_task_library_updated_at
  BEFORE UPDATE ON task_library
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Part D: Indexes ──────────────────────────────────────────

-- Full category scan
CREATE INDEX idx_task_library_category
  ON task_library(category_id);

-- Partial: fast lookup of active tasks (used on home/browse screens)
CREATE INDEX idx_task_library_active
  ON task_library(category_id)
  WHERE is_active = true;

-- Partial: fast lookup of urgent-eligible tasks (used on Live Market)
CREATE INDEX idx_task_library_urgent
  ON task_library(id)
  WHERE is_urgent_eligible = true;

-- Worker skill lookups
CREATE INDEX idx_worker_skills_user  ON worker_skills(user_id);
CREATE INDEX idx_worker_skills_task  ON worker_skills(task_id);

-- Job task lookups
CREATE INDEX idx_job_post_tasks_job  ON job_post_tasks(job_post_id);

-- ── Part E: Row Level Security ───────────────────────────────

-- task_categories: anyone (including anon) may read all rows
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_categories_public_read"
  ON task_categories
  FOR SELECT
  USING (true);

-- task_library: anyone (including anon) may read active rows
ALTER TABLE task_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_library_active_read"
  ON task_library
  FOR SELECT
  USING (is_active = true);

-- ── Part F: Column comments ──────────────────────────────────

COMMENT ON COLUMN task_categories.tier
  IS '1 = standard everyday category; 2 = skilled or premium category';

COMMENT ON COLUMN task_categories.requires_background_check
  IS 'True if all workers in this category must pass a background check before accepting jobs';

COMMENT ON COLUMN task_library.price_min
  IS 'USD minimum price for this task (customer-facing estimate)';

COMMENT ON COLUMN task_library.price_max
  IS 'USD maximum price for this task (customer-facing estimate)';

COMMENT ON COLUMN task_library.est_time_min_hrs
  IS 'Estimated minimum hours to complete this task (NULL = open-ended or overnight)';

COMMENT ON COLUMN task_library.est_time_max_hrs
  IS 'Estimated maximum hours to complete this task (NULL = open-ended or overnight)';

COMMENT ON COLUMN task_library.requires_verification
  IS 'True if worker must pass ID verification or background check for this specific task';

COMMENT ON COLUMN task_library.is_urgent_eligible
  IS 'True if this task can appear in the Urgent / Same-Day job feed on Live Market';

COMMENT ON COLUMN worker_skills.is_featured
  IS 'True for up to 3 tasks marked as the worker''s Superpowers, shown prominently on their profile card';

COMMIT;
