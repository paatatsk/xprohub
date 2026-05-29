# Ruling 03 — Re-Ruled

> Supersedes the original Ruling 03 in `pr2_rulings.md`.
> Filed 27·MAY·2026, after Claude Code surfaced G-4/G-5 compliance wiring.

---

## What changed

The original ruling killed the `...` menu on the WorkerCard, citing "list cells carry one primary action only." That was made without knowing the `...` was wired to G-4/G-5 launch compliance (Report User → `report.tsx`, Block User → `user_blocks` insert). Killing it breaks launch. Re-ruling under the real constraint.

---

## Re-ruling: Option A — keep the `...`, restyle to credential register.

### Visual treatment

The `···` is a **meta-affordance on the credential stripe**, not a competing button on the card body. It belongs *inside* the gold stripe, not floating over the portrait.

**Position:** absolute top-right of the gold credential stripe (the same `XPROHUB · WORKER PASS · No. 00-2841` row). Right edge sits ~10px inside the stripe's right edge.

**Size:** 14×14 visible footprint, 32×32 hit slop for accessibility.

**Glyph:** Three small horizontal dots `···` (U+22EF or three periods, rendered as a single span). Horizontal — sits on the stripe's baseline naturally. Not vertical.

**Color:** `#1A0F00` (the ink color of the stripe's other text) at **0.55 opacity**. Recedes into the stripe so the eye reads `XPROHUB · WORKER PASS · No. 00-2841 ···` as a single line of stripe meta, not a button.

**Background / border / radius:** none. No badge, no rounded container, no hover state. Just the three dots.

**Tap behavior:** opens an `ActionSheetIOS.showActionSheetWithOptions` (iOS) or equivalent (Android) with:
- Report this worker — navigates to `report.tsx` with worker context
- Block from my feed — inserts into `user_blocks`, refreshes feed
- Cancel

### Action sheet copy

Use the existing `detail.menu.report` / `detail.menu.block` strings I added in the original rulings doc. They were forward-looking for a detail view that doesn't exist yet — repurposing them here is clean.

```ts
'card.menu.report':       'Report this worker',
'card.menu.block':        'Block from my feed',
'card.menu.cancel':       'Cancel',
```

(Renaming `detail.menu.*` → `card.menu.*` since the surface is the card, not a detail view.)

### What this treatment achieves

- **HIRE remains the visual primary.** Outlined gold pill, bottom-right, full color. The `···` is lower-contrast, smaller, and positioned in a meta-zone (the stripe) rather than the action-zone (the footer). The eye sees HIRE first, every time.
- **Compliance ships immediately.** G-4/G-5 surface exists in the shipped build, reachable in one tap.
- **Credential metaphor preserved.** A government ID has a magnetic strip, a serial number, an issuing-authority chip — meta-affordances on the credential surface. The `···` reads as that same kind of element, not as a competing button.
- **Detail-view migration path stays open.** When the worker detail view eventually lands, `Report this worker` and `Block from my feed` move there with a one-line code change. The card's `···` becomes a tap-through (or stays as a duplicate entry point — Maestro's call at that time).

---

## Brand Audit — Section D.3, rewritten

Replace the existing D.3 in `BRAND_AUDIT_2026-05-11.md` with this. The original "per-card menus banned" framing was wrong; the real principle is narrower.

```markdown
### D.3 Per-card overflow menus — narrow allowance

**Decision:** List-cell cards (WorkerCard, JobCard) carry **one visual
primary action** (HIRE / tap-through) and **may carry a quiet
meta-affordance** for launch-required safety actions only. No
add-to-favorite, no share, no "save for later" — those are anti-pattern
in feed cells.

**Allowed:** a `···` in the credential stripe (not the card body) wired
to safety actions (Report / Block). Styled to recede into the stripe:
3 horizontal dots, ink color at 0.55 opacity, no badge or border, sits
inline with the stripe meta-text.

**Banned:** any per-card menu that carries non-safety actions, that uses
gold or red, or that floats over the card body. Drag-to-reveal is also
banned (undiscoverable for safety features = compliance theater).

**Source:** PR 2 hardware verification + Claude Code G-4/G-5 wiring
(commits 2d47d91, 738ba7e).

**Migration target:** when worker-detail-view ships (post-Milestone 5),
Report/Block move there. The card's `···` becomes a tap-through or is
retired. Decide at that time based on usage data.
```

---

## What this means for Paata, concretely

The shipped `...` menu Claude Code already built (gold, top-right of card) needs **two style changes**:

1. **Move it from the card body's top-right corner into the gold credential stripe's top-right corner.** Same absolute positioning relative to the stripe, not the card.
2. **Drop the gold color.** Use `#1A0F00` (ink) at 0.55 opacity. No background, no border, no rounded badge — just three horizontal dots.

The wiring stays as-is. Only the visual register changes. Should be a 5-minute edit.

After the restyle:
- Append the rewritten Section D.3 to Brand Audit.
- Update strings to use `card.menu.*` keys (or leave `detail.menu.*` if that conflicts with strings already used elsewhere — Paata's call).
- Commit. Green light for PR 3.

---

**END RE-RULING**
