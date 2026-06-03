# XProHub Decision Record — Ruling 01: Endorse-Only, No Star Ratings

**XProHub uses binary endorse/concern, not star ratings. This was reaffirmed and the star system fully removed on 2026-06-03. Do not reintroduce stars without reading this document first.**

Status: Binding invariant. Subordinate to `XPROHUB_DOCTRINE.md`. Governs every quality-signal surface (Receipt, WorkerCard, job feeds, profile).

History: Ruling 01 set early (binary endorse-only). A vestigial 5-star system shipped in code by oversight and was removed at commit `9f5fb71` (2026-06-03). This record captures *why*, so the decision survives.

---

## The decision

Workers are not rated on a 1–5 star scale. The single quality signal is **binary**: a customer either **ENDORSES** completed work (a positive, visible mark) or **raises a concern** (routed privately to review, not a public score). The endorsement *count* — "N endorsed" — is what appears on a worker's card. There is no average, no star, no number that one bad interaction can drag down.

---

## Why endorse, not stars (the reasoning that must not be lost)

**1. The mission.** XProHub exists as a dignity-preserving income cushion for people in economic precarity. Star averages are documented to be cruel to workers in exactly that position: a single unfair 1-star from a difficult customer can tank a livelihood; averages encode customer bias (workers from certain backgrounds receive systematically lower stars for identical work); and platforms routinely weaponize the average (e.g. deactivation below 4.7). A binary positive signal cannot be used this way. This is the mission showing up in a design decision.

**2. The Receipt is the brand lighthouse, and it is built on endorse.** The Receipt screen — the product's signature surface — shows ENDORSE THIS WORK, never stars. Switching to stars would require rebuilding the lighthouse's identity. The quality model and the brand's signature screen are the same decision.

**3. The familiar argument is real but loses.** Stars are familiar and low-friction; that pull is genuine and will recur. But familiarity is not worth betraying the people the platform exists to protect. When quality-filtering feels insufficient, the answer is to strengthen *positive* signals (endorsement count, repeat-hire rate, completion reliability, response time) — never to add a punitive average.

**4. The star system was already dead.** When removed, the 5-star system was a dead-end pipe: review.tsx wrote ratings, a trigger computed `profiles.rating_avg`, market.tsx fetched it — and WorkerCard silently discarded it. No customer had ever seen a star average. Keeping it would have meant *building a new punitive surface*, not preserving a working one. Removing it was both mission-aligned and the smaller change (~500 lines deleted, zero new code).

---

## What this binds

- No star ratings, anywhere — not on the Receipt, WorkerCard, feeds, or profile.
- The quality signal is binary endorse + private concern. The public number is the endorsement *count*, never an average.
- The Receipt's ENDORSE/concern flow is the single feedback path for a completed job.
- "Verified"-style quality claims and rating mechanics are reserved; stars specifically are prohibited.
- **If a future session is tempted to add stars** (because they're "familiar," "expected," or "weed out pretenders"): that instinct is anticipated here. Re-read sections 1–3. The need for quality-filtering is real; the answer is better *positive* signals, not stars. Reintroducing a star average reverses a founding invariant and re-opens the cruelty it was designed to prevent.

---

*A rating system is not neutral infrastructure. It encodes who the platform is willing to hurt. XProHub chose not to build a number that a single bad day can use against someone who needs the work.*
