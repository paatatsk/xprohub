# Self-View in Live Market — Proposal (Parked)

**Date:** 2026-05-31
**Status:** PARKED — revisit after Print Shop Slices 2-4 ship.
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

## Implementation notes (for future Code session)

- The auth.uid() filter in market.tsx is the single behavioral knob. Remove it for "show self," keep it for "hide self."
- The WorkerCard component already accepts an onHire prop. The self-view variant passes onEdit instead (routes to my-card).
- TypeScript: add a viewMode prop to WorkerCard (`'public' | 'self' | 'preview'`) so the call site can deliberately request the right affordance set rather than inferring from prop presence.
- Hardware verification: sign in as a worker with skills, open Talent, find self at expected sort position. Tap EDIT — opens my-card. Confirm no HIRE button visible on self.
