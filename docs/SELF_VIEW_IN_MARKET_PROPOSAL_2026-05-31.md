# Self-View in Live Market — Proposal (SHIPPED)

**Date:** 2026-05-31
**Status:** SHIPPED — `d01dbae`, 2026-06-06. Position C implemented for both Talent + Jobs feeds.
**Author:** Maestro, surfaced from Paata's product instinct during Slice 1 hardware verification.

---

## The instinct

Today `market.tsx` filters out the current user's own card from the Talent feed (`auth.uid()` excluded). When a worker signs in and opens Live Market → TALENT, they see everyone except themselves.

Paata raised the concern: workers are the authors of their own commercial presentation (the Print Shop principle). A designer with no way to see their printed business card in the actual marketplace, next to competitors' cards, is designing blind. To self-iterate effectively, they need to see how their card actually appears in the feed — bio length, photo crop, skill chip order, alongside the visual mass of every other card in their category.

The current behavior forces workers to:
1. Sign out
2. Sign in as a different account
3. Browse Talent
4. See their card from a customer's perspective
5. Sign back in to edit

That's broken.

---

## Three positions, one recommended

**Position A — Hide self (current behavior).** Market is "who's available for me to hire." Self-noise filtered. Standard marketplace UX (LinkedIn, Uber, most platforms).

**Position B — Always show self.** Card appears in feed identical to any other worker's card. Simple. But: workers could accidentally tap HIRE on themselves; visual experience is confusing without affordance differentiation.

**Position C — Show self with "(you)" marker. ← RECOMMENDED.** Card appears in the feed, visually identified as the viewer's own card. Tappable for self-edit (routes to my-card) instead of hire. The customer-facing experience is unchanged because customers never see this state.

Position C honors the print-shop principle (the worker can see their published work) while keeping the customer-side affordance honest.

---

## Four open implementation questions for Design

Before Code can build Position C, Design needs to rule on:

1. **State display.** Does the worker's own card appear at the top of the feed, in normal sort position, or visually pinned somewhere distinct? (Recommendation: normal sort position — the worker should see their card next to actual competitors, not floating above the fray.)

2. **HIRE button replacement.** Three sub-options:
   a. Hide the HIRE button entirely on the self-view card
   b. Replace HIRE with an EDIT pill (routes to /(tabs)/my-card)
   c. Leave HIRE visible but disabled

3. **Visual differentiation.** How is "this is your card" signaled? Options:
   - Subtle "(you)" suffix in the name treatment
   - A small gold badge in the credential stripe
   - The card itself remains visually identical and only HIRE→EDIT signals it
   - Different background tint
   (Maestro lean: minimal — a subtle pill on the credential stripe like "(you)" reads honestly without breaking the credential dignity.)

4. **Customer mode behavior.** When the worker switches to customer mode (browsing TALENT to potentially hire someone), do they still see themselves? Likely no — the customer-mode lens treats them as a customer searching for help, where seeing themselves is meaningless. (Recommendation: filter self out in customer mode, show self in worker mode.)

---

## Why this is parked

The Print Shop spec (PRINT_SHOP_SPEC.md, Rev 01) is the primary architectural delivery. Slices 1-4 (photo, bio, roster, superpowers) ship the worker's edit surface. Self-view-in-market is a complementary surface — workers iterate via the Print Shop, validate via the Talent feed — but adding it now would fork attention mid-build.

Estimated cost when ready: small Design conversation (~30 min for the four rulings) + small Code change (~30 min to remove the auth.uid() filter and apply the self-affordances). Revisit after Slice 4 ships.

---

## How the four questions resolved (2026-06-06)

All four Design questions resolved during implementation. No separate Design ruling needed — decisions made jointly by Paata + Code based on investigation findings.

1. **Sort position:** Natural sort position, no pinning. The worker sees their card next to actual competitors, not floating above the fray. Original recommendation followed.

2. **HIRE button replacement:** Option (b) — HIRE replaced with EDIT CARD pill (same Oswald button register, same styling). Routes to `/(tabs)/my-card`. No overflow `···` menu on self-view card.

3. **Visual differentiation:** Two markers, one per feed:
   - **Talent feed (WorkerCard):** "· YOU" appended to the existing credential stripe ("XPROHUB · WORKER PASS · YOU"). Same Oswald/gold treatment. Subtle — the EDIT CARD button is the primary signal.
   - **Jobs feed (JobCard):** "YOUR POST" gold Oswald eyebrow between category divider and title, matching the card's existing label furniture.

4. **Customer mode behavior:** MOOT. No mode concept exists in the app (confirmed by investigation — no `customer_mode`, `worker_mode`, `activeMode`, or `userMode` anywhere in codebase). Self-view is always-on for everyone. A worker browsing competition sees themselves (useful). A customer who also has skills sees themselves in Talent (harmless — EDIT CARD button makes it obvious). Revisit only if a mode system is ever built.

Additionally: an independent self-hire guard was added to `direct-hire.tsx` as a backstop, blocking the `worker_id === auth.uid()` case even if the UI button swap ever regresses. Render sequence is safe — loading state masks the async auth check window.

---

## Implementation notes (shipped at `d01dbae`)

- The `excluded` Set in market.tsx was split: `blockedIds` still filters, but `currentUserId` is no longer excluded. Self is handled by the affordance swap, not by exclusion.
- The `onEdit` prop was added to WorkerCard instead of the originally proposed `viewMode` prop — simpler, same result. When `onEdit` is present, the stripe shows "· YOU" and the footer renders EDIT CARD. When absent, standard HIRE behavior.
- JobCard received an `isOwnPost` boolean prop for the "YOUR POST" eyebrow + route swap (card tap → `job-bids` instead of `job-detail`).
- No RLS, query, or migration changes — component + client-filter work only.
- Hardware verified on iPhone: own card in Talent, own post in Jobs, blocked users still filtered, other users' cards unchanged.
