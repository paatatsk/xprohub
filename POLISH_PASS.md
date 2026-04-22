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
