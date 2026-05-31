# XProHub Taxonomy Spec

**The category system is core infrastructure — the shared vocabulary the two flows match on. This document protects it.**

Status: Binding. Subordinate to `XPROHUB_DOCTRINE.md`; implements the Doctrine's "four entries, one spine" by defining the substrate the spine runs on. Where a layout decision would demote, hide, or fragment the taxonomy, this document is the objection.

Author: Paata (founder) · Shaped with Maestro · Grounded in Claude Code investigation · Date: 2026-05-31

---

## 0. Why this document exists

A prior design ruling treated the category grid as a "browse-the-catalogue" surface and marked it superseded — because the grid's role as the matching substrate was not in front of the reviewer. That was nearly a demotion of the single most load-bearing structure in the app. This document states plainly what the taxonomy *is*, so no future ruling erodes it by reasoning about only one of its jobs.

**The taxonomy is not a Home feature, not a browse widget. It is the shared language that lets "a customer needs X" find "a worker offers X." The spine cannot match anyone without it.**

---

## 1. The structure (three levels)

A three-level hierarchy, confirmed in schema:

```
task_categories   (20 rows · immutable seed · SMALLINT id 1–20)
  └── task_library      (188 rows · FK category_id · soft-delete via is_active)
        └── worker_skills   (FK task_id → a worker offers one task)
        └── job_post_tasks  (FK task_id → a job requests one task)
```

Plus one denormalization: `jobs.category` (TEXT) stores the category **name** on each job row, alongside the normalized `job_post_tasks`.

- **Category** — the 20 top-level buckets (Home Cleaning, Plumbing, …). The coarse filter and the human-readable entry point.
- **Task** — the 188 specific offerings within a category (the real unit of work). The precise matching key.
- **Worker skill** — a worker claiming a task (`worker_skills` row); up to 3 marked `is_featured` ("superpowers").
- **Job task** — a task requested in a post (`job_post_tasks` row).

Workers and jobs both resolve to **tasks**. That shared task layer is the join that makes matching possible.

---

## 2. The four jobs the taxonomy does

Three are live in the code today; the fourth is designed and not yet built. All four are protected.

| # | Job | Status | Where it happens |
|---|---|---|---|
| 1 | **Post input** — customer picks category → tasks to create a job | LIVE | post.tsx → writes `jobs.category` (name) + `job_post_tasks` (task ids) |
| 2 | **Card input** — worker picks categories → tasks they offer | LIVE | id.tsx (wizard) + my-card.tsx (lifetime) → writes `worker_skills` |
| 3 | **Filter** — narrowing the market feeds by category | LIVE | market.tsx — Jobs + Talent feeds |
| 4 | **Matching substrate** — pairing customers ↔ workers by task overlap | DESIGNED, NOT BUILT | future RPC/function; `bids.match_score` column exists, nothing computes it |

**Implication for placement:** jobs 1, 2, and 4 require the *taxonomy to exist and be reachable at the right moment in each flow* — they do not require a grid on any particular screen. Job 3 lives in Market. So the taxonomy's importance is independent of whether a category grid is drawn on Home; the grid is one *presentation* of the taxonomy, not the taxonomy itself. (Home's grid is endorsed as the customer's post on-ramp — see §5 — but that is a launchpad choice, not an infrastructure requirement.)

---

## 3. Matching — designed, not built (protect the foundation)

There is **no matching algorithm implemented today.** Current pairing is manual: a worker reads a job and decides to apply.

What exists as scaffolding:
- `bids.match_score` column (unused — no code writes or reads it).
- A documented formula in CLAUDE.md: **Location 25% · Skill Match 35% · Experience 20% · Behavioral 20%.**
- A documented query pattern (join `job_post_tasks` ↔ `worker_skills` on `task_id`, count matched tasks) — a schema comment, never executed.

**The taxonomy is the foundation this unbuilt system will sit on.** Skill Match (35% of the planned score) *is* task overlap. Protecting the three-level structure now protects the matching work later. Any change that flattens Category → Task → Skill, or breaks the shared task key, breaks matching before it is built.

---

## 4. `tier` and the verification columns — what they really do

### tier — classification, not a gate
`tier` is a SMALLINT (1 or 2) on `task_categories`. In the app today it does **exactly one thing**: the Home grid shows a gold "PRO" badge on tier-2 categories. It does **not** gate worker access, trigger checks, affect pricing, or affect matching.

- **Tier 1** (categories 1–14): everyday tasks — cleaning, errands, pet care, tutoring. ~$15–$300.
- **Tier 2** (categories 15–20): skilled trades — electrical, plumbing, painting, carpentry, IT, HVAC. ~$30–$500.

Treat tier as a **display/classification label** until a deliberate decision makes it a gate.

### Unenforced safety columns — a flagged gap, not a bug to fix now
`requires_background_check` (on categories) and `requires_verification` (on tasks) are populated in seed data but **read by no gate logic anywhere.** Notably, **Child Care and Elder Care are flagged `requires_background_check = true`, and nothing enforces it.**

This is recorded as **future safety infrastructure**, not a current feature: when a verification/trust-gate system is built, these columns are where it plugs in. Flagged here so it is a known, deliberate gap rather than a silent one.

> Note: tier does **not** correlate with `requires_background_check` — the two flagged categories (Child/Elder Care) are tier 1, while all tier-2 trades are flagged false. Tier ≠ safety. Do not conflate them when verification is built.

---

## 5. Known inconsistency — the two filter paths

Market filters the two feeds by category through **different data paths**:

- **Jobs feed** filters on `jobs.category` (the denormalized string name).
- **Talent feed** resolves `category_id → task_library.id → worker_skills.task_id` (the normalized path).

Same filter intent, two mechanisms. This works today but is fragile: a category rename would desync the string path from the id path. **Recorded as technical debt** — when matching (job 4) is built on the normalized task layer, consider migrating the Jobs feed off the denormalized string onto the same task-based path, so both feeds and the matcher share one source of truth. Not urgent; flagged so it is a known seam.

---

## 6. What this document binds

- The three-level structure (Category → Task → Worker-skill / Job-task) is **core infrastructure** and must not be flattened or fragmented.
- The shared **task key** is the join matching depends on — protect it.
- The taxonomy's importance is **independent of any single screen's layout**; demoting a *presentation* of it (e.g. a grid) is a UI decision and must never be mistaken for demoting the taxonomy.
- `tier` is a classification label, not a gate, until deliberately changed.
- `requires_background_check` / `requires_verification` are reserved safety infrastructure; Child/Elder Care are flagged and currently unenforced — a known gap.
- The denormalized `jobs.category` string is a known seam to reconcile when matching is built.

---

*Categories are not what the app shows. They are what lets the two sides speak the same language — and therefore find each other.*
