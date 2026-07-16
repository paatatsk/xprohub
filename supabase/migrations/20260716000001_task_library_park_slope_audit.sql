-- ============================================================
-- XProHub — Park Slope launch curation 2026-07-16
--
-- Narrow-and-deep: 171 → 109 active tasks. Soft-delete only —
-- task_codes preserved, reactivation is a single UPDATE.
--
-- Holiday tasks (1402, 1403) intentionally deactivated now;
-- reactivate for November seasonal window.
--
-- Per-market activation parked for v1.1 expansion.
-- ============================================================

BEGIN;

UPDATE task_library SET is_active = false WHERE task_code IN (
  -- Errands (3)
  '0208','0207','0209',
  -- Moving (1)
  '0610',
  -- Trash (1)
  '1308',
  -- Painting (2)
  '1702','1706',
  -- Tutoring (3)
  '0708','0711','0710',
  -- Plumbing (3)
  '1610','1606','1604',
  -- Pet Care (4)
  '0302','0308','0309','0310',
  -- Gardening (4)
  '1201','1208','1207','1205',
  -- IT (3)
  '1904','1908','1906',
  -- Electrical (6)
  '1504','1506','1505','1507','1508','1509',
  -- HVAC (5)
  '2009','2003','2007','2002','2005',
  -- Personal Training (7)
  '0811','0806','0809','0804','0805','0807','0808',
  -- Personal Assistance (7, keeping 0901 + 0907)
  '0904','0902','0905','0909','0903','0906','0908',
  -- Events (5)
  '1406','1407','1405','1402','1403',
  -- Vehicle Care (4)
  '1006','1005','1007','1004',
  -- Carpentry (4)
  '1804','1806','1807','1808'
);

COMMIT;


-- ══════════════════════════════════════════════════════════════
-- VERIFICATION
-- ══════════════════════════════════════════════════════════════

-- Total active (expect 109):
-- SELECT count(*) FROM task_library WHERE is_active = true;

-- Per-category breakdown:
-- SELECT tc.name, count(*) FILTER (WHERE tl.is_active) AS active
--   FROM task_library tl
--   JOIN task_categories tc ON tc.id = tl.category_id
--   GROUP BY tc.name ORDER BY active DESC, tc.name;
