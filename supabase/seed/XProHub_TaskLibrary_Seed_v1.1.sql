-- ============================================================
-- XProHub Task Library — Master Seed File v1.1
-- 20 Categories · 188 Tasks
-- Source of Truth: XProHub_TaskLibrary_Master.md
-- Run AFTER main Supabase schema migration
--
-- Changelog v1.1:
--   - Added updated_at column + trigger to task_library
--   - Fixed Category 2 billing_type: 'per_job' → 'mixed' (task 0206 is per_hour)
--   - Removed 'urgent' from difficulty CHECK; urgency expressed via is_urgent_eligible
--   - Tasks 1509, 1610: difficulty 'urgent' → 'skilled' (is_urgent_eligible = true retained)
--   - Task 1301: est_time_max corrected 0.5 → 1.0
--   - Task 1609 (Radiator Bleeding): requires_verification corrected false → true
--   - Added COMMENT statements documenting units and field intent
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1: Create Tables
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS task_categories (
  id               SMALLINT PRIMARY KEY,
  name             TEXT NOT NULL,
  icon_slug        TEXT,
  tier             SMALLINT NOT NULL CHECK (tier IN (1, 2)),
  -- 'mixed' means tasks within this category use different billing types
  billing_type     TEXT NOT NULL CHECK (billing_type IN ('per_job','per_hour','per_visit_day','mixed')),
  price_min        INTEGER NOT NULL,   -- USD
  price_max        INTEGER NOT NULL,   -- USD
  difficulty_range TEXT NOT NULL,
  requires_background_check BOOLEAN DEFAULT false,
  sort_order       SMALLINT
);

COMMENT ON COLUMN task_categories.billing_type    IS 'mixed = tasks within category vary; check task_library.billing_type for the authoritative value';
COMMENT ON COLUMN task_categories.price_min       IS 'USD — lowest price_min across tasks in this category';
COMMENT ON COLUMN task_categories.price_max       IS 'USD — highest price_max across tasks in this category';
COMMENT ON COLUMN task_categories.requires_background_check IS 'Category-level flag; individual task verification is controlled by task_library.requires_verification';

CREATE TABLE IF NOT EXISTS task_library (
  id                    SERIAL PRIMARY KEY,
  task_code             TEXT UNIQUE NOT NULL,
  category_id           SMALLINT NOT NULL REFERENCES task_categories(id),
  name                  TEXT NOT NULL,
  description           TEXT NOT NULL,
  tags                  TEXT[] NOT NULL,
  price_min             INTEGER NOT NULL,   -- USD
  price_max             INTEGER NOT NULL,   -- USD
  -- Hours (decimal). e.g. 0.5 = 30 min, 1.5 = 90 min
  est_time_min_hrs      NUMERIC,
  est_time_max_hrs      NUMERIC,
  -- 'urgent' removed: urgency is expressed via is_urgent_eligible flag only
  difficulty            TEXT NOT NULL CHECK (difficulty IN ('easy','medium','skilled')),
  billing_type          TEXT NOT NULL CHECK (billing_type IN ('per_job','per_hour','per_visit_day')),
  requires_verification BOOLEAN DEFAULT false,
  is_urgent_eligible    BOOLEAN DEFAULT false,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN task_library.price_min          IS 'USD';
COMMENT ON COLUMN task_library.price_max          IS 'USD';
COMMENT ON COLUMN task_library.est_time_min_hrs   IS 'Estimated minimum job duration in hours (0.5 = 30 min)';
COMMENT ON COLUMN task_library.est_time_max_hrs   IS 'Estimated maximum job duration in hours';
COMMENT ON COLUMN task_library.difficulty         IS 'Skill level required: easy | medium | skilled. Urgency/priority is separate — see is_urgent_eligible';
COMMENT ON COLUMN task_library.requires_verification IS 'Worker must pass platform identity/credential verification before offering this task';
COMMENT ON COLUMN task_library.is_urgent_eligible IS 'Task can be posted and fulfilled as an urgent/same-day job (higher rate applies)';

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_library_updated_at ON task_library;
CREATE TRIGGER trg_task_library_updated_at
  BEFORE UPDATE ON task_library
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Worker skills: tasks a worker offers
CREATE TABLE IF NOT EXISTS worker_skills (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id     INTEGER NOT NULL REFERENCES task_library(id),
  years_exp   SMALLINT,
  is_featured BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Job post tasks: tasks a customer is requesting
CREATE TABLE IF NOT EXISTS job_post_tasks (
  id          SERIAL PRIMARY KEY,
  job_post_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  task_id     INTEGER NOT NULL REFERENCES task_library(id),
  UNIQUE(job_post_id, task_id)
);

-- Useful indexes for matching performance
CREATE INDEX IF NOT EXISTS idx_task_library_category ON task_library(category_id);
CREATE INDEX IF NOT EXISTS idx_task_library_active   ON task_library(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_task_library_urgent   ON task_library(is_urgent_eligible) WHERE is_urgent_eligible = true;
CREATE INDEX IF NOT EXISTS idx_worker_skills_user    ON worker_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_skills_task    ON worker_skills(task_id);
CREATE INDEX IF NOT EXISTS idx_job_post_tasks_job    ON job_post_tasks(job_post_id);

-- ------------------------------------------------------------
-- STEP 2: Seed Categories (20)
-- FIX: Category 2 billing_type corrected to 'mixed' (task 0206 uses per_hour)
-- ------------------------------------------------------------

INSERT INTO task_categories (id, name, icon_slug, tier, billing_type, price_min, price_max, difficulty_range, requires_background_check, sort_order) VALUES
-- Tier 1
(1,  'Home Cleaning',               'home-cleaning',    1, 'per_job',       30,  300, 'Easy → Medium',    false, 1),
(2,  'Errands & Delivery',          'errands-delivery', 1, 'mixed',         15,  120, 'Easy',             false, 2),  -- mixed: most tasks per_job; task 0206 is per_hour
(3,  'Pet Care',                    'pet-care',         1, 'mixed',         15,  100, 'Easy → Medium',    false, 3),
(4,  'Child Care',                  'child-care',       1, 'per_hour',      18,   60, 'Easy → Skilled',   true,  4),
(5,  'Elder Care',                  'elder-care',       1, 'per_hour',      20,   60, 'Easy → Skilled',   true,  5),
(6,  'Moving & Labor',              'moving-labor',     1, 'per_job',       40,  300, 'Easy → Medium',    false, 6),
(7,  'Tutoring & Education',        'tutoring',         1, 'per_hour',      20,   80, 'Easy → Skilled',   false, 7),
(8,  'Personal Training & Coaching','coaching',         1, 'per_hour',      30,  100, 'Medium → Skilled', false, 8),
(9,  'Personal Assistance',         'personal-asst',    1, 'mixed',         18,  120, 'Easy → Medium',    false, 9),
(10, 'Vehicle Care',                'vehicle-care',     1, 'per_job',       20,  150, 'Easy → Medium',    false, 10),
(11, 'Handyman Services',           'handyman',         1, 'per_job',       25,  200, 'Easy → Medium',    false, 11),
(12, 'Gardening & Landscaping',     'gardening',        1, 'per_job',       30,  200, 'Easy → Skilled',   false, 12),
(13, 'Trash Removal & Recycling',   'trash-recycling',  1, 'per_job',       20,  200, 'Easy',             false, 13),
(14, 'Events & Special Occasions',  'events',           1, 'mixed',         30,  200, 'Easy → Medium',    false, 14),
-- Tier 2
(15, 'Electrical',                  'electrical',       2, 'per_job',       50,  500, 'Skilled',          false, 15),
(16, 'Plumbing',                    'plumbing',         2, 'per_job',       50,  500, 'Medium → Skilled', false, 16),
(17, 'Painting',                    'painting',         2, 'per_job',       50,  500, 'Easy → Skilled',   false, 17),
(18, 'Carpentry & Woodwork',        'carpentry',        2, 'per_job',       60,  500, 'Medium → Skilled', false, 18),
(19, 'IT & Tech Support',           'it-tech',          2, 'per_job',       30,  180, 'Easy → Medium',    false, 19),
(20, 'HVAC & Home Systems',         'hvac',             2, 'per_job',       40,  500, 'Easy → Skilled',   false, 20)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- STEP 3: Seed Tasks (188)
-- Column order: task_code, category_id, name, description, tags,
--               price_min, price_max, est_time_min_hrs, est_time_max_hrs,
--               difficulty, billing_type, requires_verification, is_urgent_eligible
-- ------------------------------------------------------------

INSERT INTO task_library
  (task_code, category_id, name, description, tags, price_min, price_max, est_time_min_hrs, est_time_max_hrs, difficulty, billing_type, requires_verification, is_urgent_eligible)
VALUES

-- ── 01 · Home Cleaning (12 tasks) ──────────────
('0101', 1, 'Regular House Cleaning',           'Dusting, vacuuming, mopping, and surface cleaning throughout the home.',                              ARRAY['Vacuuming','Mopping','Dusting'],              40,  100, 2, 4,  'easy',   'per_job', false, false),
('0102', 1, 'Deep Cleaning',                    'Thorough kitchen and bathroom scrub, appliances, tiles, grout, and baseboards.',                      ARRAY['Deep Scrub','Oven','Grout'],                  80,  250, 4, 8,  'medium', 'per_job', false, false),
('0103', 1, 'Move-In Cleaning',                 'Full property clean before moving in — floors, cabinets, appliances, bathrooms.',                     ARRAY['Move-In','Full Property','Pre-Tenancy'],      100, 280, 3, 7,  'medium', 'per_job', false, false),
('0104', 1, 'Move-Out Cleaning',                'Landlord-standard clean to recover security deposit.',                                               ARRAY['Move-Out','Deposit','Inspection'],            100, 300, 4, 8,  'medium', 'per_job', false, false),
('0105', 1, 'Kitchen & Bathroom Deep Scrub',    'Focused deep clean of kitchens or bathrooms only.',                                                   ARRAY['Kitchen','Bathroom','Scrubbing'],             50,  150, 2, 4,  'easy',   'per_job', false, false),
('0106', 1, 'Oven & Appliance Cleaning',        'Interior oven, microwave, fridge, dishwasher deep clean.',                                           ARRAY['Oven','Fridge','Appliances'],                 40,  120, 1, 3,  'easy',   'per_job', false, false),
('0107', 1, 'Window Cleaning (Interior)',        'Inside-only window cleaning for apartments and homes.',                                              ARRAY['Windows','Interior','Streak-Free'],           30,  100, 1, 3,  'easy',   'per_job', false, false),
('0108', 1, 'Laundry & Folding',                'Washing, drying, folding, and basic ironing in-home or via laundromat.',                             ARRAY['Laundry','Folding','Ironing'],                30,  80,  1, 3,  'easy',   'per_job', false, false),
('0109', 1, 'Organizing & Decluttering',        'Closets, pantries, garages, storage spaces — declutter and systemize.',                              ARRAY['Organizing','Declutter','Systems'],           50,  150, 2, 5,  'easy',   'per_job', false, false),
('0110', 1, 'Post-Party Cleanup',               'Clearing up after gatherings, dishes, trash, and surfaces.',                                         ARRAY['Post-Event','Dishes','Quick Turnaround'],     50,  150, 2, 4,  'easy',   'per_job', false, false),
('0111', 1, 'Post-Construction Cleanup',        'Dust, debris, and material removal after renovation work.',                                           ARRAY['Post-Reno','Dust','Debris'],                  100, 300, 3, 7,  'medium', 'per_job', false, false),
('0112', 1, 'Airbnb Short-Term Rental Turnover','Rapid turnover clean between guest stays, linen change, restocking.',                                ARRAY['Airbnb','Turnover','Linens'],                 60,  150, 1, 3,  'easy',   'per_job', false, false),

-- ── 02 · Errands & Delivery (10 tasks) ──────────────
('0201', 2, 'Grocery Shopping & Delivery',      'Shopping for groceries and delivering to the customer''s home.',                                      ARRAY['Grocery','Shopping','Delivery'],              20,  60,  1,   2,   'easy', 'per_job',  false, false),
('0202', 2, 'Package Delivery (Local)',          'Same-day local delivery of packages, documents, small items.',                                       ARRAY['Same-Day','Local','Parcels'],                 20,  60,  1,   2,   'easy', 'per_job',  false, false),
('0203', 2, 'Pharmacy Pickup',                  'Prescription collection and delivery from pharmacy.',                                                 ARRAY['Pharmacy','Prescription','Pickup'],           20,  50,  1,   2,   'easy', 'per_job',  false, false),
('0204', 2, 'Dry Cleaning Pickup & Drop',       'Collecting and dropping off dry cleaning or alterations.',                                            ARRAY['Dry Clean','Pickup','Drop'],                  20,  45,  1,   2,   'easy', 'per_job',  false, false),
('0205', 2, 'Post Office & Bank Runs',          'Queuing and handling tasks at post offices or banks.',                                                ARRAY['Post Office','Bank','Queuing'],               20,  50,  1,   2,   'easy', 'per_job',  false, false),
('0206', 2, 'Waiting in Line (DMV Government)', 'Waiting at DMV, city offices, or permit desks on customer''s behalf.',                               ARRAY['DMV','Govt','Waiting'],                       25,  80,  1,   5,   'easy', 'per_hour', false, false),
('0207', 2, 'Gift Shopping & Wrapping',         'Sourcing, purchasing, and wrapping gifts for events or holidays.',                                   ARRAY['Gifts','Wrapping','Holidays'],                25,  80,  1,   3,   'easy', 'per_job',  false, false),
('0208', 2, 'Restaurant Food Pickup',           'Personal food pickup from restaurants (non-app delivery).',                                           ARRAY['Food Pickup','Restaurant','Personal'],        15,  40,  0.5, 1,   'easy', 'per_job',  false, false),
('0209', 2, 'Document Courier',                 'Hand-delivering documents, contracts, signatures locally.',                                           ARRAY['Documents','Courier','Secure'],               25,  80,  1,   3,   'easy', 'per_job',  false, false),
('0210', 2, 'Walk-Up Delivery Assist',          'Carrying heavy or bulky items up 4+ floor walk-up apartments.',                                      ARRAY['Walk-Up','Stairs','Heavy Lift'],              25,  80,  0.5, 2,   'easy', 'per_job',  false, false),

-- ── 03 · Pet Care (10 tasks) ──────────────
('0301', 3, 'Dog Walking (Solo)',                   'Individual dog walks of 30–90 minutes.',                                                         ARRAY['Solo','Walk','Dogs'],                         20,  45,  0.5, 1.5, 'easy',   'per_job',        false, false),
('0302', 3, 'Dog Walking (Group)',                  'Group walks for socialized dogs.',                                                                ARRAY['Group','Social','Pack'],                      15,  30,  0.5, 1.5, 'medium', 'per_job',        false, false),
('0303', 3, 'Pet Sitting (In-Home, Owner''s House)','Staying at the owner''s home to care for pets during travel.',                                   ARRAY['In-Home','Overnight','Travel Cover'],         50,  100, 8,   24,  'easy',   'per_visit_day',   false, false),
('0304', 3, 'Pet Sitting (Worker''s Home)',         'Hosting pets in the worker''s home during owner''s travel.',                                     ARRAY['Host','Boarding','Daily'],                    40,  80,  8,   24,  'medium', 'per_visit_day',   false, false),
('0305', 3, 'Feeding & Watering Check-In Visits',  'Short drop-in visits to feed, water, and check on pets.',                                        ARRAY['Check-In','Feeding','Short Visit'],           20,  40,  0.5, 1,   'easy',   'per_visit_day',   false, false),
('0306', 3, 'Cat Check-In Visits',                 'Dedicated cat care — feeding, litter, companionship.',                                           ARRAY['Cats','Litter','Feeding'],                    20,  40,  0.5, 1,   'easy',   'per_visit_day',   false, false),
('0307', 3, 'Vet Transportation',                  'Transporting pets to and from vet appointments.',                                                 ARRAY['Vet','Transport','Care'],                     30,  60,  1,   2,   'easy',   'per_job',        false, false),
('0308', 3, 'Basic Pet Grooming',                  'Brushing, nail trimming, basic bathing at owner''s home.',                                       ARRAY['Brushing','Nails','Bath'],                    35,  70,  1,   2,   'medium', 'per_job',        false, false),
('0309', 3, 'Basic Obedience Training',            'Puppy socialization, sit/stay/recall basics.',                                                    ARRAY['Puppy','Obedience','Basics'],                 40,  80,  1,   2,   'medium', 'per_hour',       false, false),
('0310', 3, 'Pet Waste Removal (Yard)',             'Regular yard cleanup for dog owners with outdoor space.',                                        ARRAY['Yard','Waste','Recurring'],                   20,  50,  0.5, 1,   'easy',   'per_job',        false, false),

-- ── 04 · Child Care (9 tasks — all requires_verification = true) ──────────────
('0401', 4, 'Babysitting',                      'Evening, weekend, and date-night childcare in the family home.',                                     ARRAY['Evenings','Weekends','In-Home'],              20, 45, 2,   8,  'easy',   'per_hour', true, false),
('0402', 4, 'After-School Care',                'Pickup, supervision, snacks, and homework help until parents return.',                               ARRAY['Pickup','Homework','Supervision'],            20, 40, 2,   4,  'easy',   'per_hour', true, false),
('0403', 4, 'School Drop-Off & Pickup',         'Safe transportation of children to and from school.',                                               ARRAY['School Run','Transport','Safe'],              25, 50, 0.5, 1,  'easy',   'per_hour', true, false),
('0404', 4, 'Overnight Babysitting',            'Overnight childcare when parents are away or working late shifts.',                                  ARRAY['Overnight','Sleeping','Extended'],            25, 50, 8,   12, 'easy',   'per_hour', true, false),
('0405', 4, 'Parent Helper (Newborn, Non-Medical)','Non-medical help with newborns — soothing, diaper changes, laundry support.',                   ARRAY['Newborn','Helper','Non-Medical'],             22, 45, 2,   6,  'easy',   'per_hour', true, false),
('0406', 4, 'Meal Prep for Kids',               'Preparing healthy, age-appropriate meals and snacks.',                                              ARRAY['Cooking','Healthy','Kids'],                   20, 40, 1,   2,  'easy',   'per_hour', true, false),
('0407', 4, 'Educational Play & Reading',       'Structured play, reading, arts and crafts with children.',                                          ARRAY['Play','Reading','Crafts'],                    18, 40, 1,   3,  'easy',   'per_hour', true, false),
('0408', 4, 'Homework Supervision',             'Supervising school-age homework without deep subject tutoring.',                                     ARRAY['Homework','Supervision','School-Age'],        18, 35, 1,   2,  'easy',   'per_hour', true, false),
('0409', 4, 'Special Needs Childcare',          'Experienced care for children with autism, ADHD, or other needs.',                                  ARRAY['Special Needs','Autism','ADHD'],              30, 60, 2,   8,  'skilled','per_hour', true, false),

-- ── 05 · Elder Care (8 tasks — all requires_verification = true) ──────────────
('0501', 5, 'Companionship & Conversation',         'Friendly company, conversation, and presence for elderly clients.',                             ARRAY['Companion','Social','Friendly'],              20, 35, 1, 4,  'easy',   'per_hour', true, false),
('0502', 5, 'Medication Reminders',                 'Prompting medications at the right time (reminders only, not administration).',                 ARRAY['Reminders','Schedule','Non-Medical'],         20, 35, 1, 2,  'easy',   'per_hour', true, false),
('0503', 5, 'Meal Preparation for Seniors',         'Nutritious meal cooking and mealtime company.',                                                 ARRAY['Cooking','Nutrition','Meals'],                22, 40, 1, 3,  'easy',   'per_hour', true, false),
('0504', 5, 'Light Housekeeping for Elderly',       'Gentle cleaning, tidying, laundry in senior''s home.',                                         ARRAY['Cleaning','Tidying','Gentle'],                22, 40, 1, 3,  'easy',   'per_hour', true, false),
('0505', 5, 'Medical Appointment Transport',        'Safe, reliable transport to doctor, hospital, or therapy.',                                     ARRAY['Transport','Medical','Appointments'],         30, 60, 1, 4,  'easy',   'per_hour', true, false),
('0506', 5, 'Grocery & Prescription Pickup (Seniors)','Shopping and pharmacy runs on behalf of elderly clients.',                                    ARRAY['Errands','Grocery','Pharmacy'],               20, 40, 1, 2,  'easy',   'per_hour', true, false),
('0507', 5, 'Tech Help for Seniors',                'Patient help with phones, video calls, email, basic computer use.',                             ARRAY['Phones','Video Calls','Patient'],             20, 40, 1, 2,  'easy',   'per_hour', true, false),
('0508', 5, 'Overnight Elder Care (Non-Medical)',   'Overnight companionship and non-medical monitoring.',                                            ARRAY['Overnight','Non-Medical','Monitoring'],       25, 45, 8, 12, 'medium', 'per_hour', true, false),

-- ── 06 · Moving & Labor (10 tasks) ──────────────
('0601', 6, 'Moving Day Help (Loading & Unloading)','Loading and unloading trucks, heavy lifting, and carrying.',                                    ARRAY['Loading','Heavy Lift','Truck'],               50,  180, 3, 8, 'easy',   'per_job', false, false),
('0602', 6, 'Furniture Moving (Within Home)',       'Moving heavy furniture within a home or between floors.',                                       ARRAY['Furniture','Heavy','Interior Move'],          40,  120, 1, 3, 'easy',   'per_job', false, false),
('0603', 6, 'Full Packing Service',                 'Carefully packing household items including fragile and specialist items.',                     ARRAY['Packing','Fragile','Labeling'],               60,  200, 3, 8, 'easy',   'per_job', false, false),
('0604', 6, 'Unpacking & Setup',                   'Unpacking boxes, organizing belongings in the new home.',                                        ARRAY['Unpacking','Organizing','Setup'],             50,  150, 2, 6, 'easy',   'per_job', false, false),
('0605', 6, 'Furniture Disassembly & Reassembly (Move)','Taking apart and rebuilding furniture for a move.',                                        ARRAY['Disassembly','Rebuild','Move'],               60,  180, 2, 5, 'medium', 'per_job', false, false),
('0606', 6, 'Heavy Lifting & Hauling',              'General heavy lifting for one-off needs (appliances, equipment).',                              ARRAY['Heavy','Appliances','Hauling'],               40,  150, 1, 4, 'easy',   'per_job', false, false),
('0607', 6, 'Storage Unit Loading / Unloading',     'Loading, organizing, or emptying a storage unit.',                                              ARRAY['Storage','Organize','Loading'],               50,  150, 2, 5, 'easy',   'per_job', false, false),
('0608', 6, 'Single Item Delivery',                 'Moving one large item (sofa, fridge, wardrobe) locally.',                                      ARRAY['Single Item','Local','Large'],                40,  120, 1, 2, 'easy',   'per_job', false, false),
('0609', 6, 'Walk-Up Moving Premium',               'Moves involving 4+ floor walk-up buildings.',                                                   ARRAY['Walk-Up','Stairs','NYC'],                     80,  250, 3, 8, 'medium', 'per_job', false, false),
('0610', 6, 'Bulk Junk Removal (Moving Context)',   'Large-scale clearing before or after a move.',                                                  ARRAY['Junk','Clearing','Large'],                    100, 300, 2, 6, 'easy',   'per_job', false, false),

-- ── 07 · Tutoring & Education (11 tasks) ──────────────
('0701', 7, 'Math Tutoring',                    'Elementary through high school math, including algebra and geometry.',                               ARRAY['Math','Algebra','Geometry'],                  25, 65, 1, 2, 'medium', 'per_hour', false, false),
('0702', 7, 'Science Tutoring',                 'Biology, chemistry, physics, earth science tutoring.',                                              ARRAY['Biology','Chemistry','Physics'],              25, 70, 1, 2, 'medium', 'per_hour', false, false),
('0703', 7, 'English & Reading Help',           'Reading, writing, grammar, and essay support.',                                                     ARRAY['English','Essays','Reading'],                 22, 55, 1, 2, 'medium', 'per_hour', false, false),
('0704', 7, 'Foreign Language Tutoring',        'Spanish, Mandarin, French, Arabic, Russian, and other language lessons.',                           ARRAY['Languages','Conversational','Multi-Language'], 25, 60, 1, 2, 'medium', 'per_hour', false, false),
('0705', 7, 'ESL — English as a Second Language','English instruction for non-native speakers, adults or children.',                                 ARRAY['ESL','Conversational','All Ages'],            22, 55, 1, 2, 'medium', 'per_hour', false, false),
('0706', 7, 'SAT / ACT Prep',                  'Standardized test preparation for college admissions.',                                              ARRAY['SAT','ACT','College Prep'],                   40, 80, 1, 2, 'skilled','per_hour', false, false),
('0707', 7, 'SHSAT & NYC High School Admissions Prep','NYC Specialized High School Admissions Test preparation.',                                   ARRAY['SHSAT','NYC','High School Prep'],             35, 75, 1, 2, 'skilled','per_hour', false, false),
('0708', 7, 'College Application Help',         'Essay review, application guidance, interview prep.',                                               ARRAY['College Apps','Essays','Interviews'],         35, 75, 1, 2, 'skilled','per_hour', false, false),
('0709', 7, 'Homework Help (General)',          'General homework support across subjects for school-age children.',                                  ARRAY['Homework','All Subjects','K-12'],             20, 40, 1, 2, 'easy',   'per_hour', false, false),
('0710', 7, 'Study Skills & Essay Writing',    'Study techniques, time management, academic writing.',                                               ARRAY['Study','Writing','Academic'],                 25, 55, 1, 2, 'medium', 'per_hour', false, false),
('0711', 7, 'Computer Basics for Adults',      'Basic computer literacy for adult learners (non-senior).',                                           ARRAY['Computer','Basics','Adult'],                  25, 50, 1, 2, 'easy',   'per_hour', false, false),

-- ── 08 · Personal Training & Coaching (11 tasks) ──────────────
('0801', 8, 'Personal Training (In-Home)',      'One-on-one strength and cardio training at the client''s home.',                                    ARRAY['Strength','Cardio','In-Home'],                50, 100, 1, 2,   'skilled','per_hour', false, false),
('0802', 8, 'Outdoor Workouts & Bootcamps',    'Park-based workouts, bootcamps, and outdoor training.',                                              ARRAY['Park','Outdoor','Group'],                     35, 80,  1, 1.5, 'skilled','per_hour', false, false),
('0803', 8, 'Yoga & Pilates',                  'Private yoga or pilates sessions at home or outdoors.',                                              ARRAY['Yoga','Pilates','Mobility'],                  45, 90,  1, 1.5, 'skilled','per_hour', false, false),
('0804', 8, 'Running & Cardio Coaching',       'Running plans and outdoor cardio coaching.',                                                         ARRAY['Running','Cardio','Plans'],                   35, 70,  1, 1.5, 'medium', 'per_hour', false, false),
('0805', 8, 'Sports Coaching (Adult)',         'Tennis, basketball, soccer, golf coaching for adults.',                                              ARRAY['Tennis','Basketball','Soccer'],               40, 90,  1, 1.5, 'skilled','per_hour', false, false),
('0806', 8, 'Kids Sports Training',            'Youth sports skills training and development.',                                                       ARRAY['Youth','Sports','Skills'],                    35, 70,  1, 1.5, 'skilled','per_hour', false, false),
('0807', 8, 'Swim Lessons (Kids & Adults)',    'Private swim instruction at client''s pool or shared facility.',                                     ARRAY['Swimming','Kids','Adults'],                   40, 80,  0.5, 1, 'skilled','per_hour', false, false),
('0808', 8, 'Post-Injury Recovery Coaching',  'Mobility, stretching, rehab work after injury or surgery.',                                           ARRAY['Rehab','Mobility','Recovery'],                50, 90,  1, 1.5, 'skilled','per_hour', false, false),
('0809', 8, 'Nutrition Coaching',             'Meal planning, diet advice, and nutrition guidance.',                                                  ARRAY['Nutrition','Meal Plans','Diet'],              40, 80,  1, 1.5, 'medium', 'per_hour', false, false),
('0810', 8, 'Music Lessons',                  'Piano, guitar, voice, and other instrument lessons.',                                                  ARRAY['Piano','Guitar','Voice'],                     35, 85,  0.5, 1, 'skilled','per_hour', false, false),
('0811', 8, 'Art Lessons',                    'Drawing, painting, and general art instruction.',                                                      ARRAY['Drawing','Painting','Art'],                   30, 70,  1, 1.5, 'skilled','per_hour', false, false),

-- ── 09 · Personal Assistance (9 tasks) ──────────────
('0901', 9, 'General Personal Assistance',         'Flexible help with ad-hoc personal tasks.',                                                     ARRAY['Ad-Hoc','Flexible','Varied'],                 25, 50, 2,   6, 'easy',   'per_hour', false, false),
('0902', 9, 'Calendar & Scheduling Help',          'Managing appointments, scheduling, and reminders.',                                              ARRAY['Calendar','Scheduling','Admin'],              20, 40, 1,   3, 'easy',   'per_hour', false, false),
('0903', 9, 'Research Tasks',                      'Focused research for purchases, travel, or decisions.',                                          ARRAY['Research','Shopping','Decisions'],            25, 50, 1,   4, 'easy',   'per_hour', false, false),
('0904', 9, 'Appointment Booking',                 'Booking appointments, restaurants, reservations, services.',                                     ARRAY['Appointments','Reservations','Bookings'],     20, 40, 0.5, 2, 'easy',   'per_hour', false, false),
('0905', 9, 'Event Planning Help',                 'Assisting with birthdays, parties, small event coordination.',                                   ARRAY['Events','Parties','Coordination'],            30, 60, 2,   6, 'medium', 'per_hour', false, false),
('0906', 9, 'Travel Planning',                     'Researching and booking travel, itineraries, accommodations.',                                   ARRAY['Travel','Itinerary','Booking'],               30, 60, 2,   5, 'medium', 'per_hour', false, false),
('0907', 9, 'Waiting for Deliveries / Repair Workers','Staying at the home to receive deliveries or let in workers.',                               ARRAY['Waiting','Deliveries','Access'],              20, 40, 1,   4, 'easy',   'per_hour', false, false),
('0908', 9, 'Translating & Interpreting',          'Written translation or in-person interpreting for meetings, appointments.',                     ARRAY['Translation','Interpreting','Multilingual'],  35, 90, 1,   4, 'medium', 'per_hour', false, false),
('0909', 9, 'General Labour (Extra Pair of Hands)','Any task not covered elsewhere — flexible, willing, general help.',                             ARRAY['Flexible','Labor','Catch-All'],               20, 45, 1,   8, 'easy',   'per_hour', false, false),

-- ── 10 · Vehicle Care (7 tasks) ──────────────
('1001', 10, 'Mobile Car Wash',          'Exterior car wash at the customer''s location.',                                                           ARRAY['Mobile','Wash','Exterior'],                   25, 60,  1,   2, 'easy',   'per_job', false, false),
('1002', 10, 'Interior Detailing',       'Thorough interior cleaning, vacuum, trim, and surfaces.',                                                  ARRAY['Interior','Vacuum','Detail'],                 50, 150, 2,   4, 'easy',   'per_job', false, false),
('1003', 10, 'Exterior Detailing',       'Full exterior detail — wash, wax, polish, tire shine.',                                                    ARRAY['Wax','Polish','Exterior'],                    60, 150, 2,   4, 'medium', 'per_job', false, false),
('1004', 10, 'Tire Pressure & Fluid Check','Basic maintenance checks — tires, oil, fluids, wipers.',                                               ARRAY['Maintenance','Tires','Fluids'],               25, 60,  0.5, 1, 'easy',   'per_job', false, false),
('1005', 10, 'Vehicle Transportation',   'Driving a customer''s car from A to B on their behalf.',                                                   ARRAY['Drive','Transport','Personal Driver'],         35, 100, 1,   3, 'easy',   'per_job', false, false),
('1006', 10, 'Airport Car Drop-Off',     'Driving customer to airport and returning car home.',                                                      ARRAY['Airport','Drop-Off','Return'],                40, 120, 1,   3, 'easy',   'per_job', false, false),
('1007', 10, 'Car Organization',         'Decluttering and organizing a car''s interior and trunk.',                                                 ARRAY['Organize','Declutter','Interior'],            25, 60,  1,   2, 'easy',   'per_job', false, false),

-- ── 11 · Handyman Services (10 tasks) ──────────────
-- Note: task 1106 is is_urgent_eligible = true — broken locks/security are time-sensitive
('1101', 11, 'General Handyman Fixes',                  'Small repairs — tightening, adjusting, patching minor damage.',                            ARRAY['Repairs','Fixing','Tools'],                   35, 100, 1,   3,   'easy',   'per_job', false, false),
('1102', 11, 'Furniture Assembly',                      'IKEA and flat-pack assembly — beds, desks, wardrobes, shelves.',                           ARRAY['IKEA','Flat-Pack','Assembly'],                35, 120, 1,   4,   'easy',   'per_job', false, false),
('1103', 11, 'TV Mounting',                             'Wall-mounting TVs and sound systems with proper anchors.',                                  ARRAY['TV Mount','Drilling','Brackets'],             60, 150, 1,   2,   'easy',   'per_job', false, false),
('1104', 11, 'Shelf & Picture Hanging',                 'Hanging shelves, pictures, mirrors, and wall decor.',                                      ARRAY['Shelves','Pictures','Mirrors'],               35, 90,  1,   2,   'easy',   'per_job', false, false),
('1105', 11, 'Curtain & Blind Fitting',                 'Installing curtain rails, blinds, rods, and tracks.',                                     ARRAY['Curtains','Blinds','Rails'],                  35, 90,  1,   2,   'easy',   'per_job', false, false),
('1106', 11, 'Door & Window Adjustments',               'Fixing locks, hinges, weatherstripping, minor adjustments.',                              ARRAY['Locks','Hinges','Weatherstrip'],              50, 150, 1,   3,   'medium', 'per_job', false, true),
('1107', 11, 'Caulking & Sealing',                      'Re-caulking tubs, sinks, windows, minor sealing work.',                                    ARRAY['Caulking','Sealing','Tub'],                   40, 100, 1,   2,   'easy',   'per_job', false, false),
('1108', 11, 'Smart Home Device Setup (Non-Electrical)','Installing plug-in smart devices, speakers, thermostats, doorbells.',                     ARRAY['Smart Home','Plug-In','Devices'],             40, 100, 1,   2,   'easy',   'per_job', false, false),
('1109', 11, 'Window AC Install & Removal',             'Installing or removing window air conditioners with bracket support.',                     ARRAY['Window AC','NYC','Seasonal'],                 50, 120, 0.5, 1.5, 'medium', 'per_job', false, false),
('1110', 11, 'Basic Drywall Patching',                  'Small hole patches, surface prep for paint.',                                              ARRAY['Drywall','Patching','Holes'],                 40, 120, 1,   3,   'easy',   'per_job', false, false),

-- ── 12 · Gardening & Landscaping (10 tasks) ──────────────
('1201', 12, 'Lawn Mowing & Edging',            'Grass cutting, edging, lawn tidying. Regular or one-off.',                                         ARRAY['Mowing','Edging','Lawn'],                     35,  90,  1, 3, 'easy',   'per_job', false, false),
('1202', 12, 'Garden Clearance',                'Clearing overgrown areas, weeding, general garden tidying.',                                       ARRAY['Clearing','Weeding','Overgrowth'],            50,  150, 2, 6, 'easy',   'per_job', false, false),
('1203', 12, 'Hedge & Tree Trimming',           'Trimming hedges, shaping bushes, pruning small trees.',                                            ARRAY['Hedges','Pruning','Trees'],                   45,  150, 1, 4, 'medium', 'per_job', false, false),
('1204', 12, 'Pressure Washing',                'Cleaning driveways, patios, siding, fences with pressure washer.',                                 ARRAY['Pressure Wash','Driveway','Patio'],           50,  180, 1, 4, 'easy',   'per_job', false, false),
('1205', 12, 'Gutter Cleaning',                 'Clearing blocked gutters and downpipes.',                                                          ARRAY['Gutters','Downpipes','Ladders'],              40,  120, 1, 3, 'easy',   'per_job', false, false),
('1206', 12, 'Landscaping & Planting',          'Garden design, turf, planting, raised beds, hard landscaping.',                                    ARRAY['Design','Planting','Landscape'],              80,  200, 3, 8, 'skilled','per_job', false, false),
('1207', 12, 'Mulching & Bed Edging',           'Mulch installation, bed edging, soil top-up.',                                                     ARRAY['Mulch','Bed Edge','Soil'],                    40,  120, 1, 3, 'easy',   'per_job', false, false),
('1208', 12, 'Leaf Removal',                    'Seasonal leaf raking, bagging, removal.',                                                          ARRAY['Leaves','Raking','Seasonal'],                 40,  120, 1, 4, 'easy',   'per_job', false, false),
('1209', 12, 'Seasonal Garden Cleanup (Spring/Fall)','End-of-season cleanup, winterization, bed prep.',                                             ARRAY['Seasonal','Cleanup','Prep'],                  60,  180, 2, 5, 'easy',   'per_job', false, false),
('1210', 12, 'Terrace & Rooftop Garden Setup', 'Setting up planters, furniture, and greenery on NYC terraces.',                                      ARRAY['Terrace','Rooftop','NYC'],                    60,  200, 2, 5, 'medium', 'per_job', false, false),

-- ── 13 · Trash Removal & Recycling (8 tasks) ──────────────
-- FIX 1301: est_time_max corrected from 0.5 to 1.0 (min=max=0.5 was a data entry error)
('1301', 13, 'Household Trash Takeout (Recurring)',       'Regular trash takeout for those unable to carry out themselves.',       ARRAY['Recurring','Trash','Assist'],              20,  40,  0.5, 1, 'easy', 'per_job', false, false),
('1302', 13, 'Recycling Drop-Off',                       'Sorting and dropping off recycling at appropriate facilities.',         ARRAY['Recycling','Drop-Off','Sort'],             25,  60,  1,   2, 'easy', 'per_job', false, false),
('1303', 13, 'E-Waste Disposal',                         'Electronics disposal at certified e-waste centers.',                    ARRAY['E-Waste','Electronics','Certified'],       30,  80,  1,   2, 'easy', 'per_job', false, false),
('1304', 13, 'Mattress Disposal',                        'NYC-compliant mattress removal and disposal.',                          ARRAY['Mattress','Removal','NYC Compliant'],      50,  150, 1,   2, 'easy', 'per_job', false, false),
('1305', 13, 'Appliance Removal',                        'Removal and disposal of old appliances.',                              ARRAY['Appliance','Removal','Bulky'],             60,  180, 1,   3, 'easy', 'per_job', false, false),
('1306', 13, 'Bulk Junk Removal',                        'Large-scale junk removal from apartments or homes.',                   ARRAY['Bulk','Junk','Large-Scale'],               80,  200, 2,   5, 'easy', 'per_job', false, false),
('1307', 13, 'Donation Runs',                            'Taking items to Goodwill, Housing Works, or other donation centers.',  ARRAY['Donations','Charity','Drop-Off'],          30,  80,  1,   3, 'easy', 'per_job', false, false),
('1308', 13, 'Hazardous Waste Drop (Paint/Batteries/Chemicals)','Safe disposal of household hazardous waste.',                   ARRAY['Hazardous','Paint','Batteries'],           40,  100, 1,   2, 'easy', 'per_job', false, false),

-- ── 14 · Events & Special Occasions (7 tasks) ──────────────
('1401', 14, 'Party Setup & Breakdown',         'Setting up and clearing after parties, birthdays, gatherings.',                                    ARRAY['Setup','Breakdown','Parties'],                40,  150, 2, 6, 'easy',   'per_job',  false, false),
('1402', 14, 'Holiday Decorating (Install)',    'Installing seasonal decorations — Christmas lights, wreaths, displays.',                            ARRAY['Holiday','Install','Decor'],                  40,  150, 1, 4, 'easy',   'per_job',  false, false),
('1403', 14, 'Holiday Decoration Takedown',    'Removing and storing holiday decorations.',                                                          ARRAY['Takedown','Storage','Post-Holiday'],          35,  100, 1, 3, 'easy',   'per_job',  false, false),
('1404', 14, 'Event Serving & Bar Staff',       'Serving food and drinks at private events, weddings, corporate gatherings.',                       ARRAY['Serving','Bar','Events'],                     35,  75,  3, 8, 'easy',   'per_hour', false, false),
('1405', 14, 'Gift Wrapping (In-Home Service)', 'In-home gift wrapping for holidays, weddings, birthdays.',                                         ARRAY['Wrapping','Holidays','In-Home'],              30,  80,  1, 3, 'easy',   'per_job',  false, false),
('1406', 14, 'DJ & Music Help (Small Events)',  'Music setup and DJ for small private events.',                                                      ARRAY['DJ','Music','Small Events'],                  75,  200, 3, 6, 'medium', 'per_job',  false, false),
('1407', 14, 'Event Photography Help',          'Casual photography for small events and family gatherings.',                                        ARRAY['Photography','Events','Casual'],              60,  180, 2, 4, 'medium', 'per_job',  false, false),

-- ── 15 · Electrical (9 tasks — all requires_verification = true) ──────────────
-- FIX 1509: difficulty changed from 'urgent' to 'skilled'; urgency expressed by is_urgent_eligible = true
('1501', 15, 'Outlet Installation & Repair',  'Replacing outlets, USB outlets, GFCI outlets.',                                                      ARRAY['Outlets','GFCI','USB'],                       70,  180, 1, 2, 'skilled','per_job', true, false),
('1502', 15, 'Light Fixture Installation',    'Installing ceiling lights, chandeliers, pendant lights.',                                             ARRAY['Fixtures','Chandeliers','Lights'],            80,  250, 1, 3, 'skilled','per_job', true, false),
('1503', 15, 'Ceiling Fan Installation',      'Installing or replacing ceiling fans with light kits.',                                               ARRAY['Ceiling Fan','Install','Replace'],            100, 250, 1, 3, 'skilled','per_job', true, false),
('1504', 15, 'Electrical Panel Upgrades',     'Service panel upgrades, breaker box replacement.',                                                    ARRAY['Panel','Breaker Box','Service'],              200, 500, 4, 8, 'skilled','per_job', true, false),
('1505', 15, 'Circuit Breaker Repair',        'Diagnosing and repairing circuit breaker issues.',                                                    ARRAY['Breaker','Diagnose','Repair'],                100, 250, 1, 3, 'skilled','per_job', true, false),
('1506', 15, 'Wiring & Rewiring',             'New wiring runs, partial rewiring, code compliance.',                                                 ARRAY['Wiring','Rewire','Code'],                     150, 500, 3, 8, 'skilled','per_job', true, false),
('1507', 15, 'EV Charger Installation',       'Home EV charger installation — Level 1 and Level 2.',                                                 ARRAY['EV Charger','Level 2','Install'],             200, 500, 3, 6, 'skilled','per_job', true, false),
('1508', 15, 'Outdoor Lighting (Hardwired)',  'Landscape and porch lighting with hardwired install.',                                                ARRAY['Outdoor','Landscape','Hardwired'],            120, 300, 2, 5, 'skilled','per_job', true, false),
('1509', 15, 'Emergency Electrical Repair',   'Same-day response for power outages, sparking outlets, dangerous faults.',                           ARRAY['Emergency','Power Out','Dangerous'],          150, 500, 1, 4, 'skilled','per_job', true, true),

-- ── 16 · Plumbing (10 tasks — all requires_verification = true) ──────────────
-- FIX 1609: requires_verification corrected false → true (consistent with category; non-electrical but licensed work)
-- FIX 1610: difficulty changed from 'urgent' to 'skilled'; urgency expressed by is_urgent_eligible = true
('1601', 16, 'Leaky Faucet Repair',                      'Fixing dripping or leaking faucets.',                                                     ARRAY['Faucet','Leak','Drip'],                       70,  180, 1, 2, 'medium', 'per_job', true, false),
('1602', 16, 'Drain Unclogging',                         'Clearing clogged sinks, tubs, showers, toilets.',                                         ARRAY['Drain','Clog','Clear'],                       80,  220, 1, 2, 'medium', 'per_job', true, false),
('1603', 16, 'Toilet Repair & Replacement',              'Fixing or swapping toilets, internal parts, wax rings.',                                  ARRAY['Toilet','Repair','Replace'],                  100, 280, 1, 3, 'medium', 'per_job', true, false),
('1604', 16, 'Pipe Repair',                              'Repairing leaking or damaged pipes.',                                                     ARRAY['Pipes','Leak','Repair'],                      100, 300, 1, 4, 'skilled','per_job', true, false),
('1605', 16, 'Garbage Disposal Install',                 'Installing or replacing garbage disposals.',                                              ARRAY['Disposal','Install','Kitchen'],               100, 250, 1, 2, 'medium', 'per_job', true, false),
('1606', 16, 'Water Heater Service',                     'Water heater repair, maintenance, or replacement.',                                       ARRAY['Water Heater','Service','Replace'],           150, 500, 2, 5, 'skilled','per_job', true, false),
('1607', 16, 'Sink Installation',                        'Installing kitchen or bathroom sinks.',                                                   ARRAY['Sink','Install','Kitchen/Bath'],              120, 280, 2, 4, 'medium', 'per_job', true, false),
('1608', 16, 'Shower & Tub Repair',                      'Fixing leaks, caulking, valve replacements.',                                            ARRAY['Shower','Tub','Valve'],                       120, 280, 2, 4, 'skilled','per_job', true, false),
('1609', 16, 'Radiator Bleeding & Adjusting (NYC Pre-War)','Bleeding radiators, valve adjustments in steam-heated buildings.',                     ARRAY['Radiator','Steam','Pre-War'],                 60,  150, 1, 2, 'medium', 'per_job', true, false),
('1610', 16, 'Emergency Plumbing Repair',                'Same-day response for burst pipes, major leaks, flooding.',                               ARRAY['Emergency','Burst Pipe','Flood'],             150, 500, 1, 4, 'skilled','per_job', true, true),

-- ── 17 · Painting (9 tasks) ──────────────
('1701', 17, 'Interior Room Painting',              'Painting walls, ceilings, and trim in rooms.',                                                 ARRAY['Interior','Walls','Trim'],                    120, 300, 4,  8,  'medium', 'per_job', false, false),
('1702', 17, 'Exterior Painting',                   'Outdoor painting — siding, trim, doors.',                                                      ARRAY['Exterior','Siding','Outdoor'],                150, 500, 6,  12, 'medium', 'per_job', false, false),
('1703', 17, 'Touch-Up Painting',                   'Small touch-ups, color matching, minor repairs.',                                              ARRAY['Touch-Up','Small','Quick'],                   50,  150, 1,  3,  'easy',   'per_job', false, false),
('1704', 17, 'Cabinet Painting & Refinishing',      'Kitchen cabinet painting, staining, refinishing.',                                             ARRAY['Cabinets','Kitchen','Refinish'],              200, 500, 8,  16, 'skilled','per_job', false, false),
('1705', 17, 'Accent & Feature Wall',               'Single-wall statement painting, patterns, textures.',                                          ARRAY['Accent','Feature','Statement'],               80,  200, 2,  5,  'medium', 'per_job', false, false),
('1706', 17, 'Deck & Fence Staining',               'Outdoor wood staining and sealing.',                                                           ARRAY['Deck','Fence','Stain'],                       150, 300, 4,  10, 'medium', 'per_job', false, false),
('1707', 17, 'Wallpaper Removal',                   'Stripping old wallpaper, wall prep.',                                                          ARRAY['Wallpaper','Strip','Remove'],                 100, 250, 3,  8,  'medium', 'per_job', false, false),
('1708', 17, 'Ceiling Painting',                    'Ceilings only — smooth or textured.',                                                          ARRAY['Ceiling','Paint','Overhead'],                 100, 250, 2,  6,  'medium', 'per_job', false, false),
('1709', 17, 'Apartment Move-Out Paint Restoration','Restoring walls to landlord-standard white for security deposit recovery.',                    ARRAY['Move-Out','Landlord','NYC'],                  150, 300, 4,  8,  'medium', 'per_job', false, false),

-- ── 18 · Carpentry & Woodwork (10 tasks) ──────────────
('1801', 18, 'Furniture Repair',                         'Repairing broken furniture — joints, legs, surfaces.',                                    ARRAY['Furniture','Repair','Joints'],                80,  220, 2,  5,  'medium', 'per_job', false, false),
('1802', 18, 'Custom Shelf & Cabinet Installation',      'Building and installing custom shelves, cabinets, storage.',                              ARRAY['Custom','Shelves','Cabinets'],                150, 300, 3,  8,  'skilled','per_job', false, false),
('1803', 18, 'Door Repair & Hanging',                    'Fixing or hanging interior/exterior doors.',                                              ARRAY['Doors','Hanging','Repair'],                   100, 280, 2,  5,  'medium', 'per_job', false, false),
('1804', 18, 'Deck Building & Repair',                   'Building or repairing outdoor decks.',                                                   ARRAY['Deck','Build','Repair'],                      200, 500, 6,  16, 'skilled','per_job', false, false),
('1805', 18, 'Trim & Molding Installation',              'Crown molding, baseboards, window casings.',                                              ARRAY['Trim','Molding','Crown'],                     150, 300, 3,  8,  'skilled','per_job', false, false),
('1806', 18, 'Fence Building & Repair',                  'Installing new fences or repairing existing.',                                           ARRAY['Fence','Build','Repair'],                     150, 500, 4,  10, 'medium', 'per_job', false, false),
('1807', 18, 'Flooring Installation',                    'Hardwood, laminate, or tile floor installation.',                                        ARRAY['Flooring','Hardwood','Laminate'],             200, 500, 6,  16, 'skilled','per_job', false, false),
('1808', 18, 'Stair Repair',                             'Fixing squeaky stairs, broken treads, handrails.',                                       ARRAY['Stairs','Treads','Handrails'],                100, 280, 2,  6,  'skilled','per_job', false, false),
('1809', 18, 'Custom Closet Build-Outs',                 'Maximizing small NYC closets with custom storage systems.',                              ARRAY['Closet','Custom','NYC'],                      200, 500, 4,  10, 'skilled','per_job', false, false),
('1810', 18, 'Rental-Friendly Mounting (Pressure & Tension)','Pressure-mounted and no-drill installation for renters.',                            ARRAY['Renter','No-Drill','Pressure'],               60,  150, 1,  3,  'medium', 'per_job', false, false),

-- ── 19 · IT & Tech Support (9 tasks) ──────────────
('1901', 19, 'Computer Setup & Repair',              'New computer setup, fixing slow machines, hardware basics.',                                   ARRAY['Computer','Setup','Repair'],                  50,  150, 1, 3, 'medium', 'per_job', false, false),
('1902', 19, 'WiFi & Network Setup',                 'Router setup, WiFi extenders, network troubleshooting.',                                      ARRAY['WiFi','Router','Network'],                    50,  150, 1, 3, 'medium', 'per_job', false, false),
('1903', 19, 'Virus Removal & Cleanup',              'Malware removal, security cleanup, system restore.',                                          ARRAY['Virus','Malware','Cleanup'],                  60,  180, 1, 3, 'medium', 'per_job', false, false),
('1904', 19, 'Phone & Tablet Repair',                'Screen repairs, battery replacement, device troubleshooting.',                                ARRAY['Phone','Tablet','Screen'],                    50,  180, 1, 3, 'medium', 'per_job', false, false),
('1905', 19, 'Printer Setup & Troubleshooting',      'Installing printers, driver setup, wireless printing.',                                       ARRAY['Printer','Drivers','Wireless'],               40,  100, 1, 2, 'easy',   'per_job', false, false),
('1906', 19, 'Data Backup & Transfer',               'Backing up files, transferring between devices.',                                             ARRAY['Backup','Transfer','Data'],                   50,  150, 1, 3, 'medium', 'per_job', false, false),
('1907', 19, 'Security Camera Setup',                'Installing CCTV, smart cameras, doorbell cameras.',                                           ARRAY['CCTV','Cameras','Security'],                  80,  180, 2, 4, 'medium', 'per_job', false, false),
('1908', 19, 'Software Installation & Training',     'Installing and training on new software.',                                                    ARRAY['Software','Install','Training'],              40,  100, 1, 2, 'easy',   'per_job', false, false),
('1909', 19, 'Device Setup & Training (New Devices)','Setting up and training on new phones, tablets, smart TVs.',                                  ARRAY['New Device','Setup','Training'],              40,  100, 1, 2, 'easy',   'per_job', false, false),

-- ── 20 · HVAC & Home Systems (9 tasks) ──────────────
('2001', 20, 'AC Service & Maintenance',   'Seasonal AC service, cleaning, inspection.',                                                             ARRAY['AC','Service','Maintenance'],                 100, 250, 1,   3, 'skilled','per_job', true,  false),
('2002', 20, 'Central AC Repair',          'Repairing central air conditioning systems.',                                                            ARRAY['Central AC','Repair','HVAC'],                 150, 500, 2,   5, 'skilled','per_job', true,  false),
('2003', 20, 'Furnace Inspection & Repair','Annual furnace inspection and repair.',                                                                  ARRAY['Furnace','Inspection','Repair'],              120, 300, 2,   5, 'skilled','per_job', true,  false),
('2004', 20, 'Filter Replacement',         'HVAC and appliance filter swaps.',                                                                       ARRAY['Filter','Swap','Simple'],                     40,  80,  0.5, 1, 'easy',   'per_job', false, false),
('2005', 20, 'Duct Cleaning',              'Cleaning HVAC ducts and vents.',                                                                         ARRAY['Ducts','Vents','Clean'],                      150, 300, 2,   5, 'medium', 'per_job', false, false),
('2006', 20, 'Thermostat Installation',    'Installing or replacing thermostats (smart and standard).',                                              ARRAY['Thermostat','Smart','Install'],               60,  150, 1,   2, 'medium', 'per_job', false, false),
('2007', 20, 'Water Heater Maintenance',   'Flushing tanks, testing elements, anode rod service.',                                                   ARRAY['Water Heater','Maintenance','Flush'],         100, 220, 1,   3, 'skilled','per_job', true,  false),
('2008', 20, 'Dryer Vent Cleaning',        'Clearing dryer vents for safety and efficiency.',                                                        ARRAY['Dryer Vent','Safety','Clean'],                60,  150, 1,   2, 'easy',   'per_job', false, false),
('2009', 20, 'Boiler Service (NYC Pre-War)','Boiler inspection, service, minor repair for steam systems.',                                           ARRAY['Boiler','Steam','Pre-War'],                   150, 500, 2,   5, 'skilled','per_job', true,  false)

ON CONFLICT (task_code) DO NOTHING;

-- ------------------------------------------------------------
-- STEP 4: Verification Queries
-- ------------------------------------------------------------

-- Run after seeding to confirm totals and catch regressions:

-- SELECT COUNT(*) AS total_categories FROM task_categories;
-- -- Expected: 20

-- SELECT COUNT(*) AS total_tasks FROM task_library;
-- -- Expected: 188

-- SELECT tier, COUNT(*) FROM task_categories GROUP BY tier ORDER BY tier;
-- -- Expected: Tier 1 = 14, Tier 2 = 6

-- SELECT c.name, COUNT(t.id) AS task_count
--   FROM task_categories c
--   LEFT JOIN task_library t ON t.category_id = c.id
--   GROUP BY c.id, c.name, c.sort_order
--   ORDER BY c.sort_order;

-- Verify billing_type consistency: categories marked as non-mixed should only contain matching task billing types
-- SELECT c.name, c.billing_type AS cat_billing, t.billing_type AS task_billing, COUNT(*)
--   FROM task_categories c
--   JOIN task_library t ON t.category_id = c.id
--   WHERE c.billing_type != 'mixed' AND c.billing_type != t.billing_type
--   GROUP BY c.name, c.billing_type, t.billing_type;
-- -- Expected: 0 rows

-- Verify no urgent difficulty remains (removed in v1.1)
-- SELECT task_code, name, difficulty FROM task_library WHERE difficulty = 'urgent';
-- -- Expected: 0 rows

-- Verify urgent-eligible tasks
-- SELECT task_code, name, difficulty, is_urgent_eligible
--   FROM task_library WHERE is_urgent_eligible = true ORDER BY task_code;
-- -- Expected: 1106, 1509, 1610

-- Verify all verification flags are consistent with comments
-- SELECT c.name, COUNT(*) FILTER (WHERE t.requires_verification = true) AS verified,
--        COUNT(*) AS total
--   FROM task_categories c JOIN task_library t ON t.category_id = c.id
--   GROUP BY c.id, c.name ORDER BY c.id;

-- ============================================================
-- END OF SEED FILE
-- 20 Categories · 188 Tasks · XProHub Task Library v1.1
-- ============================================================
