# XProHub — Navigation IA Proposal

**Date:** 2026-05-28
**Status:** LOCKED. All four structural questions resolved with Paata. Ready for Claude Design + Claude Code.
**Author:** Maestro (chat-Claude), structure co-developed with Paata.

---

## The one decision that gates everything else

Paata's sketch nests Desk inside Account (`Home > Account > Desk`). Maestro pushes back: make Desk a **peer tab**, not a child of Account.

**Why peer, not nested.** For a dual-role gig worker, "my active jobs + my money" is among the highest-frequency destinations in the whole app. A bottom tab bar exists to put the top 3–5 destinations one tap away. Nesting Desk under Account puts it two taps deep (tab → Account → Desk) and forces the user through a "settings"-flavored screen to reach their live work and earnings. That fails the Load-Bearing Principle — it makes the common thing harder.

**Recommendation:** four peer tabs — `HOME · MARKET · DESK · ACCOUNT`.

---

## The structural spine: separate by tense, not topic

Four tabs risk feeling like four versions of "my stuff." The fix is to give each a distinct *tense and purpose* so the user can always predict where something lives:

- **Home** — *present tense.* What's happening right now.
- **Market** — *the platform.* The only tab that isn't about "me."
- **Desk** — *past tense + money.* My records, receipts, earnings — the ledger.
- **Account** — *identity + configuration.* Who I am and how the app behaves.

If a feature answers "what's happening now" it goes Home. If it answers "what did I do / what did I earn" it goes Desk. If it answers "who am I / how is this configured" it goes Account.

---

## Tab by tab

**HOME — present tense.** Status at a glance (your `worker_status`, jobs in flight), a glanceable summary of active work across both roles, quick actions (post a job, go available), and what needs your attention. Home is a dashboard, not a destination for depth — everything on it taps through to the tab that owns the detail.

**MARKET — the marketplace.** The Jobs / Laborers toggle (already built), browse, filter, post, find. This is the open platform — not "me." No change to current direction.

**DESK — my workspace.** Where your work and your records live. Contents: live/active jobs across both roles (posted-by-you awaiting bids, taken-by-you in progress) at the top, then job history, the Receipt screen (the brand lighthouse), earnings, and payout history. This is where IBM Plex Mono — the locked "ledger voice" — does its job. "Desk" reads as the place you work *and* the place you keep the books, not a filing cabinet alone. Jobs you create via the global compose `+` land in this tab's active list.

**ACCOUNT — identity + config.** Profile, My ID Card (the `my-card.tsx` self-view), payout destination (Stripe Connect), notification settings, legal (Termly), help, sign out.

---

## The two boundaries that will blur if we don't draw them now

**1. Desk vs Account — the money-config line.** Payout *destination* (which bank/card receives money) is configuration → **Account**. Payout *history* (what you've earned and when it landed) is records → **Desk**. Draw this on purpose; if it lands by accident the two tabs will overlap and confuse.

**2. Active jobs — Home vs Desk (resolved).** Desk owns the full active-jobs list and history. Home shows only a glanceable *summary* card that taps through into Desk. Standard dashboard→detail pattern: Home glances, Desk owns.

---

## Naming collision to resolve: "YOUR DESK card"

The word "desk" is currently overloaded. The Home screen already has an approved **"YOUR DESK card"** whose job is to route into **My ID Card** (`my-card.tsx`). But this proposal also names a **Desk tab** (records/money). Two different concepts, one word — users and future sessions will muddle them.

**Recommended fix:** rename the Home card. Since it previews and routes to the worker *credential*, call it **"YOUR PASS"** (consistent with the WorkerCard's "WORKER PASS" stripe vocabulary). That frees "Desk" to mean exactly one thing — the records/money tab — with no overload.

Alternative: keep "YOUR DESK card" and have it route into the Desk *tab* instead of My ID Card, moving the My ID Card entry to Account only. Cleaner vocabulary, but loses a Home→credential shortcut. Paata's call.

---

## Resolved decisions (locked 2026-05-28)

1. **Peer tab, not nested.** Four tabs: `HOME · MARKET · DESK · ACCOUNT`.
2. **Desk = my workspace.** Scope is broader than ledger-only: it owns the full "my work" picture — live/active jobs across both roles (posted-by-me awaiting bids, taken-by-me in progress), job history, receipts, earnings, and payout history. Home only *glances* at active work via a summary card; Desk owns the full list. "Desk" now reads as a workspace (where work and records live), not just a filing cabinet.
3. **Home card renamed "YOUR PASS"** (matches the WORKER PASS stripe). Routes to My ID Card. "Desk" is now unambiguous.
4. **Label stays "Desk."** Icons: placeholder glyphs for now — Paata designs the final icons himself and swaps them in later. No Design dependency on icon craft.

## Posting a job — global compose action (locked)

Creating/publishing a job is an **action, not a place.** It is a global compose affordance (persistent `+`) reachable from Home and Market — wherever the user is — modeled on "compose" in email: the button is everywhere, the output lives in one place. A job created this way appears in **Desk's** active list. Market stays the unified marketplace (browse + the entry to post); it does not become browse-only. This prevents the marketplace from splitting into "browse here, post there," which would force users to hunt for where to post.

---

## What's ready for Design vs Code

**Unblocked — all structural questions resolved.**

**Claude Design produces:** the tab bar visual (active/inactive states, the gold active treatment seen on "MARKET" in the mockup) using placeholder icons; the global compose `+` affordance (placement + behavior on Home and Market); the Desk tab's first screen in ledger voice (active jobs on top → history → receipts → earnings); and the renamed "YOUR PASS" Home card.

**Claude Code handles:** the tab navigator itself (`app/(tabs)/_layout.tsx` or equivalent), wiring the four routes, placeholder icons, the compose action, and re-pointing the renamed YOUR PASS card to My ID Card.

**Paata owns:** the final tab icons (designed separately, swapped in over placeholders later — no build dependency).

**Not in this proposal:** build sequence — whether the tab bar lands before or after PR 3 (`my-card.tsx`). Note one natural ordering dependency: the YOUR PASS card routes to My ID Card, so PR 3 and the nav work touch adjacent surfaces. Worth sequencing deliberately, but that's a separate conversation.
