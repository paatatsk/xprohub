# My ID Card — Visual & Behavioral Spec (PR 3)

> The worker's first-person view of their own credential. Where they tune
> availability, today's skills, rate, and radius — watch the live WorkerCard
> preview update — and publish themselves to the **Laborers Market**.
>
> Going **AVAILABLE** is the act. The screen is built to make that act feel
> deliberate, dignified, and reversible.

**Status:** First spec. The screen does not exist in the codebase —
`app/(tabs)/` has no `my-card.tsx`, and there is no `constants/strings.ts` yet
(only `constants/theme.ts`). Built on the shipped PR 2 `WorkerCard` + Two
Markets (commit `56aed37`).

**Companion files:**
- `My ID Card.html` — annotated, pixel-faithful HTML reference (open in a browser). Covers every state below.
- `copy.md` — every `myCard.*` string with tone notes.

**Lane note:** this spec covers the **visual and behavioral surface only.**
Component structure, hook patterns, and navigation wiring are Code's call.

---

## Provenance (for the record)

An earlier **Phone-4 sketch** exists in `market/live_market.html` — a
Design-side annotated mockup (not repo code), carrying open `— ASK —` notes.
It was **never approved**. This spec treats it as exploratory:

- **Carried forward:** three-state status switch, roster-vs-today model, rate+radius pairing, single PUBLISH commit.
- **Reconsidered:** compact "mini" preview → the full `<WorkerCard preview />`; rate resolved to a dual-thumb **range**; ADD resolved to the **open 20-category picker** with an `unverified` note (picker-only); booked resolved to **one state + a next-open time string**.
- **Inherited (from `pr2_build_spec.md`, shipped):** the `<WorkerCard worker={me} preview />` contract and the seeded `myCard.*` strings.

See Section 09 of the HTML for the side-by-side.

---

## Revision 02 — Maestro corrections (28·MAY·2026)

Applied after review:

1. **Track line** — per **Ruling 01** (locked, binary-endorse), every WorkerCard preview drops the `★` rating + jobs count. The body line is `[endorsement_count] endorsed · [neighborhood] · $[min]–[max]/hr` (zero-endorsement → omit the segment + a NEW stamp). The earlier draft inherited the pre-Ruling-01 star line.
2. **Tab chrome** — corrected to the locked IA (`HOME · MARKET · DESK · ACCOUNT`). `my-card.tsx` is **routable but not tab-registered** (reached from Home/Desk today, Account under the future IA); the tab bar is hidden globally in the build today. The mockup chrome is **illustrative context only** — `NAVIGATION_IA_PROPOSAL_2026-05-28.md` is binding.
3. **`unverified` rendering** — no CSS dashed border (RN/iOS silently degrades dashed → solid). Use a solid hairline (`--gold-25`) + an italic mono note.
4. **Re-ruling — `unverified` is picker-only** (see below).

**Locked by Paata / Maestro** (closes 4 of 5 open questions): booked = system-set on hire, worker-set otherwise · viewer count hidden until real analytics ship · UNDO window = 5s · 8-skill soft cap holds for v1.

### Re-ruling: `unverified` does not appear on the public card

The worker-side **picker** shows an `unverified` note on non-roster skills — useful self-knowledge. It is **not** pushed to the customer-facing WorkerCard. Rationale: "unverified" reads to a customer as a *warning*, not a nuance, and damages worker standing for an internal admin distinction (we haven't validated that category yet) with negligible customer benefit. The public trust signal is already **endorsement count** — a newly-offered skill simply has no endorsements yet, which the card communicates without a per-skill negative label. This also scopes the dashed-border fix (#3) to the picker only. (Logged here so it survives future sessions; mirror into Brand Audit D-series if/when convenient.)

---

## Thesis

The Laborers Market shows the **front** of a worker's WorkerCard to the world.
This screen is the **back** of that same card. Every control edits a column the
market reads, and the worker's own `<WorkerCard preview />` sits between the
status control and the knobs so nothing is ever published blind.

The screen answers four questions, in order, top to bottom:
**am I working → doing what → for how much → how far.**

---

## Entry points (decided — no work here)

Per the locked handoff: reachable from the **Home "YOUR DESK" card** and a
**FAB on the Laborers feed**. Both approved. `NAVIGATION_IA_PROPOSAL_2026-05-28.md`
will re-point these later; does not affect this screen's contents.

---

## Schema this screen edits

| Column | Type | Control |
|---|---|---|
| `worker_status` | `'offline' \| 'available' \| 'booked'` | Status segment |
| `today_skills` | `string[]` | Skills editor + picker sheet |
| `today_rate_min` / `today_rate_max` | numeric ($/hr) | Dual-thumb rate slider |
| `today_radius_mi` | numeric (miles) | Radius slider |

Distinct from lifetime `superpowers` (the verified roster). `today_skills` is a
daily subset of `superpowers` (plus optional unverified additions).

---

## Layout

Single scrollable column, **sticky publish bar** above the tab bar. Sections
top to bottom:

1. **Nav** — gold back chevron, `MY ID CARD` (Oswald 11 / ls 4 / gold), `⋯` compliance menu top-right.
2. **Self-masthead** — broadsheet edition line (mono) + Playfair-italic greeting by first name.
3. **Status block** — `AM I WORKING TODAY?` eyebrow + 3-up segment + always-on status line.
4. **Live preview** — the real `<WorkerCard worker={me} preview />`, footer hidden. Labelled `LIVE PREVIEW`. Body track line follows Ruling 01: `[N] endorsed · [city] · $[min]–[max]/hr` (no `★`).
5. **Skills editor** — `WHAT I’M OFFERING TODAY` + count + filled chips (× to remove) + `+ ADD SKILL`.
6. **Rate + radius** — hairline two-up; dual-thumb rate slider, single radius slider.
7. **Sticky publish bar** — state-aware CTA + a quiet hint line.

The live preview is **always above** the controls so edits are seen on the
credential before they ship.

---

## 1 · Status control — the load-bearing decision

A **3-up segmented control**, three equal-ranked states on the system's three
state colors:

| State | Color | Indicator |
|---|---|---|
| `offline` | charcoal `#2a2a2e` / text `--fg` | static |
| `available` | green `--green` + glow `0 0 18px rgba(76,175,122,.4)` | **pulsing pip** |
| `booked` | amber `--amber` + glow | static |

- Sliding indicator: `transform: translateX()` on a 250ms `cubic-bezier(.4,0,.2,1)` ease.
- Selecting a state **stages** it; the publish bar **commits** it.
- The line beneath is **never empty** — viewers (available), next-open time (booked), last-active (offline), or "not published yet" (staged).

**Why segmented (variant A) over a ceremonial single switch:** three states are
equal — booked is not lesser than available. The green fill + glow + pulse give
the live act its event-feel without a full-screen moment; the publish bar is the
committing gesture. (Variant study in HTML Section 03.)

State also drives market prominence: available floats to top, booked sinks with
an amber badge, offline is pulled.

---

## 2 · Skills editor + picker

**Inline editor:** filled gold chips = on today's card; `×` removes; a header
counter (`{n} / 8 selected`) makes the soft cap legible.

**`+ ADD SKILL` → bottom sheet** (over a dimmed scrim, max 78% height), three groups:

1. `ON YOUR CARD TODAY` — selected (gold, ✓)
2. `VERIFIED · NOT TODAY` — roster, outlined, tap to add
3. `ADD NEW · FROM 20 CATEGORIES` — the open emoji-category picker; non-roster picks carry a **solid-outline + italic `unverified` note** (no CSS dashed border — RN/iOS degrades it). This note is **picker-only** — see Revision 02 re-ruling.

**Two pools, one model:** verified is permanent (job + endorsement); today is a
daily choice. Toggling between them is one tap. The picker is **open** — a worker
who picked up a trade can offer it the same morning — and honest to the worker
via the picker-side `unverified` note. **The public card carries no `unverified`
label**; endorsement count is the customer-facing trust signal.

**Constraint:** soft cap 8. At cap, unselected picks dim with `8 max — remove one
to add.` — never a hard error.

---

## 3 · Rate slider

**Single dual-thumb slider**, min + max on one track. Workers post a range
because the Jobs feed posts ranges (`$120–180`) and matching ranges search
cleanly.

- Bounds **$15 – $100**, step **$5**.
- Thumbs **can't cross** (min ≤ max − $5); range always ≥ one step wide.
- Active thumb: 6px gold focus ring + a gold value bubble; snaps to step on release (bubble shows the snapped value during drag).
- The `$30 – $40 / HR` figure above is gold and the **loudest mass in the panel** (locked number rule).
- Default = last published; new worker = `$25–35`.

---

## 4 · Radius slider

Single thumb, miles. Bounds **1 – 25**, step **1**, default **7**. Paired with
rate so the two "price of the day" knobs read as one decision.

---

## 5 · Publish

One sticky gold pill. **State-aware copy:**

| Selected status | Copy | Treatment |
|---|---|---|
| offline → available (not yet live) | `GO LIVE TO MARKET` | green fill |
| available, zero today_skills | `GO LIVE · ALL OFFERS` | green fill |
| available, already live | `LIVE · UPDATE` | gold **outline** |
| booked | `UPDATE MY CARD` | amber fill |
| no verified skills | `PUBLISH TO MARKET` | **disabled** (opacity .4) |

Commits `worker_status` + `today_skills` + `today_rate_*` + `today_radius_mi` in
one atomic push.

**The moment (no friction modal):**
1. **Armed** — green pill, hint `tap once · you’ll get a chance to undo`.
2. **Publishing** — `PUBLISHING…`, line narrates; sub-second, no spinner theatre.
3. **Live + UNDO** — gold toast `YOU’RE ON THE MARKET` / `Card published · {n} laborers active near you` with an `UNDO` (reverts publish + status, ~5s window). Bar settles to `LIVE · UPDATE`.

Dignity comes **after** the act (reversible), not as a gate **before** it.

---

## Tokens

| Token | Used for |
|---|---|
| `--bg` `#0E0E0F` | screen ground |
| `--card` `#171719` | preview card, knob panels |
| `--border` `#2E2E33` | hairlines, resting borders |
| `--gold` `#C9A84C` | rate/radius numbers, eyebrows, filled chips, publish, glow |
| `--green` `#4CAF7A` | available state, GO LIVE, beacon dot/pulse |
| `--amber` `#E5901A` | booked state, UPDATE MY CARD |
| `--fg3` `#555558` | offline dot, inactive segment text |
| `--ink` `#1A0F00` | text on gold/green/amber fills |
| `--cream` `#F5EEDC` | toast title, slider value emphasis |

**Fonts:** Playfair (greeting, card name) · Space Grotesk (numbers, segment,
publish, chips) · Oswald (eyebrows) · Inter (body, hints) · IBM Plex Mono
(edition line, ID, value marks). All already loaded in-app (Plex Mono added in
the Receipt PR).

**No drop shadows** (elevation = border + glow). **No gradients** except the
gold credential stripe. **No emoji** except the 20 category icons in the picker.

---

## States

| # | State | Treatment |
|---|---|---|
| 1 | Loading | Gold `ActivityIndicator`; screen loads atomically. |
| 2 | Offline | Card dims + desaturates, stripe pewter, dot grey, skills editor paused. Line: `last active {time}`. Bar green `GO LIVE TO MARKET`. |
| 3 | Available (default) | Full-color card, green dot, `TODAY` filled pills. Line counts viewers. Bar outlined `LIVE · UPDATE`. |
| 4 | Booked | Amber stripe + dot, `BOOKED FOR` outlined pills. Line: next-open time. Bar amber `UPDATE MY CARD`. |
| 5 | Picker open | Bottom sheet over dimmed scrim; three groups; live footer count. |
| 6 | Rate dragging | Active thumb ring + bubble; gold figure live-updates; snaps on release. |
| 7 | Publish · armed | Green pill, undo-promise hint. |
| 8 | Publish · busy | `PUBLISHING…`, line narrates. |
| 9 | Publish · live | Gold toast + `UNDO`; bar → `LIVE · UPDATE`. |
| 10 | Empty · zero superpowers | 88px gold ring, `Your card is empty`, `CLAIM A SKILL →`; status locked offline; publish disabled. |
| 11 | Empty · zero today_skills | Card falls back to full `OFFERS` roster (dimmed pills); line + bar (`GO LIVE · ALL OFFERS`) state the fallback. |

---

## Interactions

- **Status segment tap** — stages the state; preview + line + skill label + publish copy all update live. No write until publish.
- **Chip ×** — removes from `today_skills`; preview pills update immediately.
- **+ ADD SKILL** — opens picker sheet; dismiss (swipe/scrim/DONE) persists selection.
- **Rate/radius drag** — live preview track-line + gold figure update; snap to step on release; haptic tick on each step (platform default).
- **PUBLISH** — atomic write of all four columns; optimistic UI → toast with UNDO.
- **UNDO** — reverts the publish and the status change within the toast window.
- **⋯ menu** — compliance actions (per the WorkerCard stripe menu shipped in PR2): pause card, privacy, report a problem.

---

## Explicit non-features

- **No "edit profile" here.** Bio, name, photo, verified roster are edited elsewhere. This screen is the *daily dials* only.
- **No per-skill rate.** Rate is per-day, not per-skill — workers who shift trades shift rate with the day, not the line item.
- **No scheduling / calendar.** "Booked until {time}" is surfaced, not authored here. Calendar is a separate conversation.
- **No confirmation modal on publish.** The act is intentional; reversibility (UNDO) replaces a gate.
- **No “unverified” label on the public card.** Picker-side self-knowledge only (Revision 02 re-ruling); the customer-facing trust signal is endorsement count.
- **No ★ star rating** anywhere (Ruling 01) — endorsement count is the credential.
- **No vanity analytics.** The viewer-count clause is hidden until real analytics ship; even then, one honest number — no charts, no “profile strength” meter.

---

## Accessibility

- **Status segment** — `accessibilityRole="radiogroup"`; each segment a radio with state in the label: `"Available, selected"`. Going live announces `"You are now live on the market."` via `AccessibilityInfo`.
- **Rate dual-thumb** — two `adjustable` elements; labels `"Minimum rate, 30 dollars"` / `"Maximum rate, 40 dollars"`; increment announces the snapped value.
- **Radius** — `adjustable`, `"Travel radius, 7 miles"`.
- **Live preview** — labelled `"Live preview of your market card"`; not an interactive control.
- **Publish** — `accessibilityRole="button"`, hint reflects target state (`"Publishes your card and sets you available."`).
- **Toast UNDO** — focus moves to the toast on publish so the undo is reachable before it dismisses; respect `prefers-reduced-motion` (no slide, just fade).
- **Tabular figures** on all rate/radius numbers, stable under Dynamic Type.

---

## Open questions

*(Items 1–4 closed in Revision 02 by Paata / Maestro; kept for the record.)*

1. ~~**Booked authoring**~~ — **RESOLVED:** booked is system-set when a hire begins, worker-settable otherwise. Both write to `worker_status = 'booked'`.
2. ~~**Viewer count source**~~ — **RESOLVED:** hide the viewer-count clause until real analytics ship (omit, don't placeholder).
3. ~~**Unverified additions**~~ — **RESOLVED (re-ruling):** no `unverified` on the public card; picker-only. See Revision 02.
4. ~~**Undo window**~~ — **RESOLVED:** 5 seconds.
5. **Soft cap = 8** — holds for v1 (Maestro). Re-validate post-launch; some tradespeople verify 12+.

---

## Verification checklist

- [ ] Live preview is the real `<WorkerCard preview />` (footer hidden), not a bespoke mini.
- [ ] Status segment indicator slides; AVAILABLE pip pulses; colors match charcoal/green/amber tokens.
- [ ] Status line is never empty in any state.
- [ ] Rate thumbs cannot cross; range snaps to $5; bubble shows snapped value.
- [ ] Radius snaps to 1mi; default 7.
- [ ] Publish copy matches the state table exactly; disabled when zero superpowers.
- [ ] Publish writes all four columns atomically; UNDO reverts cleanly.
- [ ] Zero-today_skills falls back to `OFFERS` roster, never an empty pill row.
- [ ] Gold rate/radius numbers are the loudest mass in their panel.
- [ ] No emoji outside the 20 category icons; no drop shadows; no gradients beyond the stripe.
- [ ] Track line is `[N] endorsed · [city] · $[min]–[max]/hr` — no `★`, no jobs count (Ruling 01).
- [ ] No `unverified` label on the public card; picker note uses a solid border (not CSS dashed) + italic.
- [ ] Tab chrome treated as context only; my-card is not tab-registered.
- [ ] All 11 states render without copy bugs (see `copy.md`).

---

**END SPEC** — hand back to Maestro. Code on standby.
