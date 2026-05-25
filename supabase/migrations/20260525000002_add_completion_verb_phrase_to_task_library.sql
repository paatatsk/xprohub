-- ============================================================
-- XProHub — Add completion_verb_phrase to task_library
-- Ops-owned past-tense verb phrase per task category.
-- Used on the Receipt screen: "Maria [verb phrase] in Brooklyn —"
--
-- NOT NULL with a safe default so no task renders without a phrase.
-- Phrases locked by Paata 2026-05-25.
-- ============================================================

BEGIN;

ALTER TABLE public.task_library
  ADD COLUMN IF NOT EXISTS completion_verb_phrase TEXT NOT NULL DEFAULT 'completed your job';

-- Populate by category_id (1–20). Phrases verbatim from locked list.
UPDATE task_library SET completion_verb_phrase = 'cleaned your home'                  WHERE category_id = 1;
UPDATE task_library SET completion_verb_phrase = 'ran your errands'                   WHERE category_id = 2;
UPDATE task_library SET completion_verb_phrase = 'cared for your pet'                 WHERE category_id = 3;
UPDATE task_library SET completion_verb_phrase = 'watched your child'                 WHERE category_id = 4;
UPDATE task_library SET completion_verb_phrase = 'cared for your loved one'           WHERE category_id = 5;
UPDATE task_library SET completion_verb_phrase = 'helped you move'                    WHERE category_id = 6;
UPDATE task_library SET completion_verb_phrase = 'tutored your student'               WHERE category_id = 7;
UPDATE task_library SET completion_verb_phrase = 'coached you'                        WHERE category_id = 8;
UPDATE task_library SET completion_verb_phrase = 'helped you get things done'         WHERE category_id = 9;
UPDATE task_library SET completion_verb_phrase = 'serviced your vehicle'              WHERE category_id = 10;
UPDATE task_library SET completion_verb_phrase = 'handled your repairs'               WHERE category_id = 11;
UPDATE task_library SET completion_verb_phrase = 'tended your garden'                 WHERE category_id = 12;
UPDATE task_library SET completion_verb_phrase = 'removed your trash'                 WHERE category_id = 13;
UPDATE task_library SET completion_verb_phrase = 'served at your event'               WHERE category_id = 14;
UPDATE task_library SET completion_verb_phrase = 'handled your electrical repairs'    WHERE category_id = 15;
UPDATE task_library SET completion_verb_phrase = 'fixed your plumbing'                WHERE category_id = 16;
UPDATE task_library SET completion_verb_phrase = 'painted your home'                  WHERE category_id = 17;
UPDATE task_library SET completion_verb_phrase = 'did your carpentry'                 WHERE category_id = 18;
UPDATE task_library SET completion_verb_phrase = 'fixed your tech'                    WHERE category_id = 19;
UPDATE task_library SET completion_verb_phrase = 'serviced your heating and cooling'  WHERE category_id = 20;

COMMIT;
