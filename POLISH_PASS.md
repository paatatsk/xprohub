# XProHub — Polish Pass Parking Lot

> Good UX ideas and refinements captured during the build, to be
> addressed in a dedicated polish pass AFTER core functionality
> is complete (all of Milestone 2 done).
>
> Do not attempt these during feature building. They wait.

## UX Refinements

- **Budget sliders on Post a Job** — replace typed MIN/MAX inputs
  with dual-handle slider. Needs: max value cap (logarithmic?),
  tick marks, haptic feedback. Captured 2026-04-19.

## Add more as we discover them

---

## Semantic Category Color System

**Captured:** 2026-04-25 (Paata's idea during week 2 build, locked Dark Gold era)

**Concept:** Accent colors applied to category tiles based on difficulty/risk tier. Color becomes *information*, not decoration — a glance tells users how serious a category is.

**Color Spectrum:**
- **Green / teal** → easy, low-stakes categories
  - Home Cleaning, Errands & Delivery, Pet Care (basics), Personal Assistance, Trash & Recycling
- **Amber / gold** → moderate skill
  - Moving & Labor, Tutoring & Education, Personal Training & Coaching, Gardening, Vehicle Care, Events
- **Orange / red** → skilled, regulated, or high-responsibility
  - Electrical, Plumbing, HVAC, Carpentry, IT/Tech, Child Care, Elder Care

**Design Rules:**
- Use color as **subtle accent only** — 3–4px left edge bar on tile, OR border on tier badge. Not tile background.
- **Dark Gold stays the hero color.** Semantic colors are supporting cast.
- Applies to category grid on Home screen, category filter strip on Live Market, and worker card belt/skill display.

**Data Source (no new schema needed):**
Derive tier from existing fields:
- `task_categories.tier` (1 = standard, 2 = skilled/premium)
- `task_categories.requires_background_check` (boolean)
- `task_library.difficulty` (easy / medium / skilled) — aggregate the category's tasks

**Implementation Sketch:**
1. Add a helper function `getCategoryAccent(tier, requiresBgCheck)` returning a hex color
2. Apply to the left edge of each category tile component
3. Accessibility check: make sure the accent is redundant (emoji + name still communicate everything), so colorblind users lose no info

**Why This Is a Design Upgrade, Not Decoration:**
Currently categories distinguish by emoji alone. Adding semantic color adds a second dimension: *how serious it is*. Reinforces the Belt System, difficulty tiers, and Level 2 Gate logic already in the schema. The color *is* the business logic made visual.

---

## Marketplace Health — Application Caps (Phase 2)

**Captured:** 2026-04-26 (Paata's idea during Step 6 planning)

**Problem:** Without caps, two failure modes emerge at scale:
- Customer posts a job → 20+ workers apply → customer paralyzed, ghosts the thread, trust in platform drops
- Workers blast every job without intent → spam behavior → customer feed becomes noise
- Winning worker is isolated; 19 others feel rejected, platform sentiment tanks

**Why not now:** With current test data (2 users, 2 jobs), caps are meaningless. We need real usage volume to calibrate numbers. Also requires belt + review data that doesn't exist yet.

**Four Approaches (combine as needed):**

### Approach A — Job Application Cap (top priority when implemented)
Cap applications per job at **5–7**.
- Once cap hit, job displays "FULL — Customer reviewing. Check back if not matched."
- Apply button disabled with clear messaging
- Job remains visible but un-applyable
- Mirrors real hiring — nobody reviews 47 applicants for a cleaning job

### Approach B — Worker Active Application Cap
Cap simultaneous active applications per worker at **3**.
- Worker must wait for decision or withdraw old application before applying to new jobs
- Prevents spam-apply behavior, forces intention, protects customers from low-effort bidders

### Approach C — Both Caps Together (recommended combination)
Implement A + B simultaneously. 5-application job cap + 3-application worker cap.

### Approach D — Belt-Tiered Worker Caps
Scale the Worker Active Application Cap by Belt Level:
- Newcomer / White Belt: 1 active application
- Yellow Belt: 2
- Orange+: 3
- Blue+: 4
- Black/Red: 5

Creates meaningful progression — earning belts unlocks real throughput.

**Implementation Notes (when ready):**
- New column on `jobs`: `application_count` (or count live from bids table)
- New RLS check on `bids.insert`: count existing bids for this job, reject if >= cap
- New RLS check on `bids.insert`: count worker's active (status='pending') bids, reject if >= their tier cap
- UI: Apply button shows `{n}/{cap} applied` as visual hint before hitting cap
- UI: if cap hit, show clear messaging with timing estimate

**Rollout Sequence:**
1. Launch without caps, collect data for 1-2 months
2. Analyze actual application-per-job distribution
3. Set cap at 90th percentile
4. Add worker cap with Belt tiering once Belt System is live
5. Monitor and adjust

**Related Considerations:**
- Withdraw flow — UI for worker to cancel an active bid
- Expiry — auto-expire unaccepted bids after N days to free slots
- Customer's "no thanks" button — clears a bid politely, frees the slot
