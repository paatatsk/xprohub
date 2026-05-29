# XProHub — NEW Stamp Ruling Brief (for Claude Design)

**Date:** 2026-05-28
**Status:** Threshold locked by Paata. Design rules on the open visual question.
**Routing:** Maestro → Claude Design → back to Maestro for implementation.

---

## Locked by Paata (do not relitigate)

**The NEW stamp on a WorkerCard shows when `jobs_completed < 10`. Nothing else.**

- Keyed off `jobs_completed` only — NOT endorsement count. (NEW = experience signal; "endorsed" count = trust signal. Kept deliberately separate.)
- Threshold rationale: the first ~10 jobs are where a worker learns the core loop — set up the ID card, advertise themselves, apply for jobs, communicate, complete the work, get paid. Past 10, they've run the full loop enough times to own it. Beyond that it's ordinary adaptation to changing situations, not orientation.
- Customer-facing meaning: "still learning the workflow — hire with appropriate awareness." A LOW bar, cleared fast, so it never sits on a visibly capable worker and never reads as a scarlet letter.
- Implementation note: this works now because `jobs_completed` was wired + backfilled on 2026-05-27 (migration `20260527000003`). It returned 0 for everyone before that.

---

## The question for Design

The same gold NEW corner stamp now carries **two meanings** across two card types:

- **JobCard:** NEW = a freshly posted job (urgency / "this is fresh, act on it"). Sits alongside the URGENT variant.
- **WorkerCard:** NEW = a worker under 10 completed jobs (provenance / "still learning the loop").

Both use the identical gold overhang stamp via the shared `components/CornerStamp.tsx` (`variant: 'urgent' | 'new'`).

**Rule on this:** does the shared vocabulary hold, or does the worker version need differentiating?

Considerations to weigh:
- The case FOR shared: "NEW = freshly arrived to this surface" reads consistently in both — a new job, a new worker. One visual vocabulary, less for users to learn.
- The case AGAINST: a customer may read NEW on a WorkerCard as marketing-style "new arrival, check this out!" rather than "unproven, proceed with awareness." The connotations diverge: NEW-on-job is an *invitation*; NEW-on-worker is a *caution*.
- Options if differentiating: keep NEW on jobs, use a different word on workers (e.g. nothing — just omit; or a quieter "NEW TALENT" / provenance treatment); or keep the word but change the visual register (e.g. workers' stamp recedes, jobs' stamp pops).

**Deliverable:** a ruling on the shared-vs-differentiated question, any new copy strings, and a Brand Audit entry documenting the decision. If differentiating, specify the exact treatment so Code can implement without guessing.

---

## Parked for later (NOT part of this ruling) — Worker Orientation Arc

Paata's original instinct was a 50-job threshold. We split it: 50 was too high for a *customer-facing* badge (it would mislabel proven workers), but the underlying idea — that workers go through a real orientation/learning period — is good and worth building **separately**, as worker-facing support rather than a public mark.

Concept to explore post-launch:
- An orientation/progress arc shown to the WORKER (in their own Desk/experience), not to customers.
- Could include: guided flows, tips, a sense of "getting established," progress toward full standing.
- This is a potential retention feature — it makes early workers feel supported through the learning curve rather than judged for it.
- Explicitly distinct from the NEW stamp: NEW is customer-facing and clears at 10 jobs; the orientation arc is worker-facing and could span longer.

This is a future-feature note, not part of the current ruling. Captured here so it isn't lost.
