# Polish Pass Queue — Deferred Refinements

**Created:** 2026-06-01
**Status:** OPEN — items revisit when polish session opens (post-nav-restructure).
**Author:** Maestro, capturing items surfaced during the Print Shop build (PR 3 → Print Shop arc) and earlier sessions.

---

## Audit findings — Ruling 01 compliance gap

### Star rating in chat
**Status:** REPORTED, not yet investigated.

Paata observed that star ratings are still present in the chat/post-job-completion flow somewhere. Ruling 01 banned star ratings platform-wide as the customer-facing trust signal. WorkerCard and JobCard were audited and corrected, but the chat/post-completion surface was missed.

To do:
1. Investigate where in the codebase star-rating UI still appears (likely `app/(tabs)/job-chat.tsx`, `app/(tabs)/review.tsx`, possibly `receipt.tsx`'s feedback section).
2. Identify whether it's one surface or multiple.
3. Replace with the binary endorse/raise-concern pattern locked in Ruling 01.
4. Document the corrected scope in Brand Audit (extend Ruling 01 entry).

Paata may have a screenshot or specific location reference to share that narrows the investigation.

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

## Self-view in market

Already parked at `docs/SELF_VIEW_IN_MARKET_PROPOSAL_2026-05-31.md`. Will revisit after nav restructure ships. Reference here for completeness — not duplicating the proposal.

---

## Visual Customization Canvas (V1.1+ exploration)

Already parked. Workers customizing visual elements (graphic decoration, color accents) on My ID Card. Out of scope for v1. Revisit post-launch with empirical signal from real workers.

---

## Drag-reorder for superpowers (V1.1+)

Already parked in Print Shop Rev 01 + Slice 4 commit. PanResponder drag-and-drop in React Native has real implementation cost. Featured order = insertion order for v1. Revisit on empirical signal that workers actually want ordering control.

---

## Account tab placeholder

Currently `account.tsx` exists as a settings/legal/sign-out screen. Will be absorbed into the Account tab when nav restructure ships. Not part of the polish pass — part of the nav restructure work.

---

## Notes

- This list is opportunistic, not urgent. None of these items block any current build.
- Each item should be approached individually with its own ruling/spec/build if substantial. Don't batch into a single polish commit unless they're genuinely cosmetic.
- Some items may grow or shrink during investigation (e.g., the star rating audit may surface more than one surface).
- Items get removed from this list when shipped, not on inspection.
