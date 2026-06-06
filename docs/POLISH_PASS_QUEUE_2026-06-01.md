# Polish Pass Queue — Deferred Refinements

**Created:** 2026-06-01 · **Last refreshed:** 2026-06-04
**Status:** OPEN — items revisit when polish session opens.
**Author:** Maestro, capturing items surfaced during the Print Shop build (PR 3 → Print Shop arc) and earlier sessions.

---

## Print Shop refinements (Slice 1–4 polish)

### Native Alert in Slice 3 remove flow
The Slice 3 `handleRemoveSkill` destructive confirmation uses iOS native `Alert.alert()` instead of the custom branded destructive dialog specified in PRINT_SHOP_SPEC.md Q2. Functionally identical, visually off-brand (platform-default vs. Dark Gold).

Fix later: replace `Alert.alert` with a custom Modal matching the destructive register specified in the spec (gold KEEP IT as default, red REMOVE as the destructive button).

### Strings inlining cleanup
From earlier sessions (Slice 1 NEW stamp differentiation), accessibility labels were inlined as literal strings instead of referencing `constants/strings.ts` keys. The strings exist in the file but aren't pulled in from the locations that use them. Small consistency fix.

### Photo system: "PHOTO" stamp redundancy
When a worker's `avatar_url` is set, the WorkerCard's portrait shows BOTH the rendered image AND the "PHOTO" stamp text overlay. The stamp was originally a placeholder label for the empty state; it should be hidden when an image actually renders. Small visual polish.

### PHOTO badge legibility on small cards
The ADD/EDIT badge on WorkerCard's 72x88 portrait renders at 7px Space Grotesk 700. At arm's length on a phone, this is hard to read. Consider bumping to 9px or 10px while keeping the corner-tuck grammar.

---

## NEW stamp threshold drift documentation

**From the NEW Stamp Differentiation Ruling (D.4, May 29):**

Ruling 01 originally pinned the worker NEW stamp threshold to `endorsement_count === 0` (momentary, JobCard-like). What shipped on hardware is `jobs_completed < 10` (tenure band, lingering weeks). That drift is what tipped the visual differentiation in D.4.

To do: extend Ruling 01's Brand Audit entry to acknowledge the threshold drift formally, so future sessions know the change happened and why. ~5 minutes.

---

---

## Visual Customization Canvas (V1.1+ exploration)

Already parked. Workers customizing visual elements (graphic decoration, color accents) on My ID Card. Out of scope for v1. Revisit post-launch with empirical signal from real workers.

---

## Drag-reorder for superpowers (V1.1+)

Already parked in Print Shop Rev 01 + Slice 4 commit. PanResponder drag-and-drop in React Native has real implementation cost. Featured order = insertion order for v1. Revisit on empirical signal that workers actually want ordering control.

---

## Resolved (shipped — removed from the active queue)

| Item | Resolved by | Date |
|---|---|---|
| Star rating in chat / Ruling 01 gap | review.tsx deleted, star system fully removed (`9f5fb71`). Ruling 01 sealed (`b024669`). job-chat CTA → VIEW RECEIPT. | 2026-06-03 |
| Account tab placeholder | Account ships as peer tab (nav Slice A, `804bcf7`). `account.tsx` is the Account tab destination. | 2026-06-01 |
| Market compose rework | Anchored "+ POST A JOB" bar in Market sticky chrome (`e7b30ee`). Floating ComposeFAB deleted. | 2026-06-02 |
| Child/Elder Care exclusion | Soft-deactivated (is_active=false), SAFETY_SPEC landed (`3219167`). | 2026-06-02 |
| NAV_SPEC reconciliation | Spec matched to shipped code — removed floating FAB, Payout History, YOUR PASS, mode badge (`17fcbee`). | 2026-06-04 |
| Webhook payment_intent.payment_failed | Structured logging implemented (`6b72fc5`). No state change needed — client handles 3DS failure synchronously. | 2026-06-04 |
| Atomic job creation | `create_job_with_tasks` SECURITY DEFINER RPC (`2d94758`). Taskless jobs structurally impossible. | 2026-06-04 |
| Empty-state string fallbacks | Defensive `??` fallbacks on market.tsx string references (`0903e91`). | 2026-06-04 |
| Release-payment console.error (job-chat ~388) | INVESTIGATED and CONSCIOUSLY SKIPPED. Auto-release cron + transfer.created webhook fully cover the path. Money never lost/stuck. Edge Function logs server-side. Client console.error is noise but harmless. | 2026-06-04 |
| Test-data cleanup | 8 test jobs deleted via SQL Editor (jobs 28 → 20). No stale Child/Elder Care test jobs remain. | 2026-06-04 |
| Self-view in market | Both Talent + Jobs feeds show self with markers + swapped affordances (`d01dbae`). Proposal marked SHIPPED. | 2026-06-06 |

---

## Notes

- This list is opportunistic, not urgent. None of these items block any current build.
- Each item should be approached individually with its own ruling/spec/build if substantial. Don't batch into a single polish commit unless they're genuinely cosmetic.
- Some items may grow or shrink during investigation (e.g., the star rating audit may surface more than one surface).
- Items get removed from this list when shipped, not on inspection.
