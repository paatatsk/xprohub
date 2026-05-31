# The Print Shop — My ID Card Edit Surface (Visual & Behavioral Spec)

> The worker's own card, made editable. Where a worker composes the four
> **lifetime** fields of their credential — **photo, bio, verified roster,
> superpowers** — and watches the live `<WorkerCard preview />` update, while the
> shipped **daily dials** (status, today's skills, rate, radius) keep working
> exactly as they do today.
>
> The governing metaphor is a **print shop**: XProHub supplies the ink, paper,
> type, and proof-press; the worker is the designer of their own business card.
> Workers customize **content**, never **visual treatment**. Every card leaves
> the shop in the same Dark Gold dress.

**Status:** First spec for the edit surface. **Extends and supersedes**
`MY_CARD_SPEC.md` where they overlap — the live-preview block now carries edit
handles, and the four lifetime zones are new. The daily-dial half of
`MY_CARD_SPEC.md` stands unchanged.

**Companion files:**
- `print_shop_spec.html` — annotated, pixel-faithful HTML reference (open in a browser). Covers every zone and state below.
- `copy.md` — every new `myCard.*` string with tone + interpolation notes.
- Folds in the **Photo Affordance ruling** (`Photo Affordance Ruling.html`, 2026-05-30) as Zone 1.

**Lane note:** this spec covers the **visual and behavioral surface only.**
Component structure, hook patterns, navigation wiring, and the data-safety
implementation are Code's call — the Skills section states the UX contract Code must honor.

---

## Implementation Status (updated 2026-05-31)

All four slices shipped and hardware-verified.

| Slice | Zone | Status | Key commits |
|---|---|---|---|
| Slice 1 | Photo | Shipped | `8460bb2` + fixes `8d9e2c4`, `193b3b6`, `ef8e232` |
| Slice 2 | Bio | Shipped | `2e7bd9b` |
| Slice 3 | Roster (add/remove) | Shipped | `11f6d1f` + fixes `d10abc1`, `1542356`, `a20746d` |
| Slice 4 | Superpowers | Shipped | `043934f` |

**Implementation choices documented:**
- Remove confirm uses native `Alert.alert` instead of custom destructive
  dialog (Slice 3). Two stacked transparent Modals caused iOS responder
  chain issues — `Alert.alert` eliminated the problem. Custom dialog is
  a polish task for future revisit with a non-Modal approach.
- Drag-reorder for superpowers deferred to v1.1 per Rev 01 ruling.
  Featured order = insertion order (oldest featured leftmost).
- Add-skill picker is a parallel implementation (not extracted shared
  component). The architectural boundary (daily set-rewrite model stays
  out of the lifetime path) is enforced by separate code paths with
  separate completion handlers.
- Endorsements are per-job (not per-skill), so the remove confirm body
  uses the zero-endorsement copy variant for all cases.

---

## The reframed principle (locked by Paata)

XProHub splits **identity** from **presentation**:

| | **My Account** | **My ID Card** |
|---|---|---|
| Metaphor | Government identity office | **Print shop / business card** |
| Holds | Legal name, email, phone, identity verification, payout destination, license/insurance, verification flags | Photo, bio, verified roster, superpowers + daily dials |
| Edited | Rarely; consequence-heavy | **Freely; iterated; optimized for presentation** |
| In scope here? | **No** | **Yes — this spec** |

**Brand consistency is absolute.** Workers customize **what the card says and
which skills they choose** — never color, decoration, or layout. The shop has
one design language (beautiful typography on dark ground with gold accents) and
that is non-negotiable. A separate *Visual Customization Canvas* exploration is
logged for **v1.1+ on empirical signal** — out of scope.

### Locked — do not re-litigate
- Brand consistency absolute (no visual customization); Dark Gold verbatim.
- My ID Card is the surface (not Account, not a new screen).
- Identity edits are **not** in scope (legal name, email, payout, verification).
- **Photo is single-column** — one `avatar_url`, no identity/business split (per Code's recommendation).
- Display-name-vs-legal-name split is **parked for v1.1**.
- Existing daily-dial behavior is preserved.

### Revision 01 — Maestro build clarifications (30-MAY-2026)

Applied before Slices 2-4. Slice 1 (photo) was unblocked and in build; these three rule independently.

1. **Bio handle wrap -> (d) corner-tucked.** The `EDIT`/`ADD` badge is absolutely positioned at the bottom-right corner of the bio block; the whole block is the tap target. The bio wraps identically on the self-view and the public card because the badge never participates in text layout. Inline placements (a/b/c) rejected — they reflow text and diverge self/public.
2. **Picker reuse -> shared presentational child.** The category->task grid is factored into a shared child component; the add-skill flow is a thin parent with its **own** completion handler writing one `INSERT`. It is **not** the daily today_skills sheet with a swapped callback — that sheet's set-rewrite model must not enter the lifetime path.
3. **Drag-reorder -> deferred to v1.1.** Slice 4 ships **toggle-feature/unfeature only**. Featured order is fixed to **insertion order** (oldest featured leftmost), which still maps to card sequence. Revisit on empirical signal (PanResponder drag carries real cost; <=3 items make ordering a weak need at launch).

---

## The Print-Shop grammar (one language, four zones)

Deep editing risks turning a credential into a settings form. It doesn't here,
because every zone speaks the **same four-word vocabulary** — and three of those
four words already shipped.

| # | Word | Form | Used on | Source |
|---|---|---|---|---|
| 1 | **HANDLE** | Solid `--gold` pill, `--ink` text, tucked at a corner; state-aware `ADD`/`EDIT` | Direct credential elements — **photo, bio** | `id.tsx` avatarEditBadge (D.5) |
| 2 | **DOOR** | Gold outline `MANAGE` pill in a section row -> opens a focused **proof sheet** | Multi-item zones — **roster, superpowers** | new |
| 3 | **STATE** | Solid gold chip = featured / outline gold = roster / hairline + italic = pending | Skill chips | card chip grammar |
| 4 | **COMMIT** | Press immediately + brief `UNDO`; the lone hard stop is removing a verified skill (soft confirm) | All edits | publish doctrine |

The worker learns the grammar once and reads it everywhere.

---

## Layout

Single scrollable column, **sticky daily publish bar** above the (hidden) tab
bar. Top to bottom:

1. **Nav** — gold back chevron, `MY ID CARD`, `...` compliance menu.
2. **Self-masthead** — broadsheet edition line + Playfair-italic greeting.
3. **Status block** *(daily)* — `AM I WORKING TODAY?` 3-up segment + always-on line.
4. **Live preview** — `<WorkerCard worker={me} preview />`, footer hidden, now carrying the **photo handle** (corner badge) and the **bio handle** (inline badge). Tag reads `LIVE PREVIEW . TAP TO EDIT`.
5. **My Card . lifetime** — a `MANAGE` row for **Offers & Superpowers** (`{n} verified . {m} featured`).
6. **What I'm offering today** *(daily)* — today_skills editor, unchanged.
7. **Rate + radius** *(daily)* — unchanged.
8. **Sticky publish bar** *(daily only)* — hint reads "daily dials only . card edits commit on their own."

Photo and bio are edited **directly on the preview** via their handles; roster
and superpowers via the `MANAGE` door. The preview is **always above** the
controls so every edit is seen on the credential first.

---

## Rulings (Maestro's six questions)

### Q1 — Edit mode vs display mode: HYBRID (c)
The screen stays a credential dashboard, not a form. **Daily dials** are
high-frequency and stay **inline** with the publish bar. **Lifetime card fields**
(photo, bio, roster, superpowers) are infrequent and consequential, so each
opens a **focused proof sheet** and **commits on its own**.

### Q2 — Skill editing UX
- **Add:** a **category -> task -> confirm** mini-flow (reuses the existing open 20-category picker as a sheet), **not** the 4-step wizard. Picks land in the roster as `pending` verification.
- **Picker reuse (Rev 01):** the category->task grid is a **shared presentational child**; the add-skill flow wraps it with its **own** completion handler. Not the daily sheet with a swapped callback — the daily set-rewrite model stays out of the lifetime path.
- **Remove:** behind an `EDIT` toggle in the roster group header, which reveals an `x` on each chip -> **soft confirm** (it forfeits endorsements).
- **Confirmation register:** **none** for add/feature; **soft** for remove; **never hard**.
- **DATA SAFETY (the flagged risk):** the unmodified wizard **wipes `worker_skills` on completion**. The my-card path must **never** reuse that completion. **Add = one `INSERT`. Remove = one `DELETE` of one row.** The existing set is never read-modify-rewritten.

### Q3 — Superpower management: solid/outline chip grammar
- <= **3 featured**, drawn from the verified roster, living in the manager sheet's top group.
- **Promote:** tap an outline roster chip -> fills gold, rises to the featured row. One tap, no confirm.
- **Demote:** tap a featured chip's star -> it drops to an outline roster chip.
- **At cap (3/3):** roster chips dim; soft line `3 featured max -- swap one out to add.` Never a hard error.
- **Reorder:** **deferred to v1.1 (Rev 01).** v1 ships toggle-feature/unfeature only; featured **order = insertion order** (oldest featured leftmost), which still maps to card sequence. (Drag-and-drop carries real PanResponder cost; <=3 items make ordering a weak launch need — revisit on signal.)
- Star here is a **featured pin**, not a rating (Ruling 01 killed the star *rating* — different word, same alphabet).

### Q4 — Bio editing: focused proof sheet
- **Sheet, not inline.** A sentence the customer reads first deserves composure.
- **Live mini-proof** of name + bio at the top of the sheet, in card type, updating as the worker types.
- **Cap: 90 characters** — long enough for trade + years + promise; short enough that the card's 2-line clamp never truncates mid-word. **Warn (amber) at 75; hard clamp at 90.**
- **Explicit `SAVE LINE`**, `CANCEL` discards. **No auto-save-on-blur.**
- **Empty state:** card line shows italic placeholder + `ADD` handle on the self-view; the public fallback `Worker on XProHub` holds until the worker writes their own.
- **Bio handle (Rev 01):** corner-tucked badge, absolutely positioned at bottom-right of the bio block. The whole block is the tap target. Bio wraps identically on self-view and public card because the badge never participates in text layout.
- Writes `profiles.bio` (ships `null` today, no edit path anywhere).

### Q5 — Live preview doctrine: holds across all four zones
Bio updates as you type; featuring a skill moves a pill; a new photo lands on
return from the wizard; the rate line redraws on drag.

### Q6 — Unified publish model: HYBRID (c)
Two presses, by frequency and consequence:
- **Daily dials** ride the **atomic publish bar + 5s UNDO**, unchanged.
- **Lifetime fields** each **commit on their own edit** with their own brief UNDO; **never touch `worker_status`.**

---

## Commit matrix

| Field | Register | Commits on | Undo | Writes |
|---|---|---|---|---|
| Status | DAILY | Publish bar (atomic) | Toast 5s | `worker_status` |
| Today's skills | DAILY | Publish bar (atomic) | Toast 5s | `today_skills` |
| Rate / Radius | DAILY | Publish bar (atomic) | Toast 5s | `today_rate_* / today_radius_mi` |
| Photo | LIFETIME | Wizard save (on return) | Re-tap to replace | `avatar_url` |
| Bio | LIFETIME | Sheet **SAVE LINE** | Toast 5s | `profiles.bio` |
| Roster add | LIFETIME | Mini-flow confirm | Toast 5s | `INSERT worker_skills` |
| Roster remove | LIFETIME | **Soft confirm** (destructive) | Confirm *is* the gate | `DELETE worker_skills` |
| Superpowers | LIFETIME | Tap feature / unfeature | Toast 5s | `featured flag` / order = insertion |

---

## States matrix

| Zone | States |
|---|---|
| **Photo** | (1) no photo — initials + `ADD` badge + hint line (2) photo on file — cropped fill + `EDIT` badge (3) in-wizard (existing) (4) returned/committed |
| **Bio** | (1) empty — italic placeholder on card + `ADD` handle (2) filled — line + `EDIT` handle (3) editing — sheet open, mini-proof, counter `n/90` (4) warn — counter amber >=75 (5) clamp — input stops at 90 (6) committed — toast + UNDO |
| **Roster** | (1) default — three groups (2) edit/remove mode — x revealed (3) remove confirm — destructive dialog (4) pending — hairline + italic note (sheet only) (5) add mini-flow — category->task->confirm |
| **Superpowers** | (1) featured group (0-3) (2) promote (slot open) (3) at cap 3/3 — dim + swap line (4) demote *(reorder deferred to v1.1)* |

---

## Tokens

| Token | Used for |
|---|---|
| `--gold` | handles, MANAGE pill, featured chips, counters, commit toasts, big numbers |
| `--ink` | text on gold pills/chips |
| `--green` | daily register (publish bar, AVAILABLE, beacon) |
| `--amber` | counter warn, at-cap swap line, booked |
| `--red` | the single destructive confirm (skill removal) only |
| `--gold-dim` / `--gold-25` | resting handles, pending hairline |
| `--card` `--bg` `--border` | surfaces, sheets, hairlines |

**Fonts:** Playfair (greeting, card name, sheet titles) / Space Grotesk
(badges, chips, counters, buttons) / Oswald (eyebrows, group labels) / Inter
(body, hints) / IBM Plex Mono (edition line, counter, track). All already loaded.

**No drop shadows** (elevation = border + glow). **No gradients** except the
gold credential stripe. **No emoji** except the 20 category icons in the
add-skill picker. **Pending border is a solid hairline**, never CSS dashed
(RN/iOS degrades dashed -> solid).

---

## Interactions

- **Photo badge tap** -> `router.push('/(onboarding)/id')` (step 1), pre-populated with current `avatar_url`. Self-view only (gated on `onPhotoPress`).
- **Bio handle tap** -> opens bio proof sheet; types update the mini-proof + main card live; `SAVE LINE` commits + toast; `CANCEL` discards.
- **MANAGE row tap** -> opens Roster & Superpowers sheet.
- **Roster chip tap** -> toggles featured (promote/demote), respecting the 3-cap.
- **Roster group `EDIT`** -> reveals x; x tap -> soft confirm; `REMOVE` deletes one row + toast.
- **`+ ADD A SKILL`** -> category -> task -> confirm mini-flow; confirm inserts one `pending` row + toast.
- **Featured chip tap** -> unfeature (demote to roster). *(Drag-reorder deferred to v1.1; order = insertion.)*
- **Daily dials + publish bar** -> unchanged from `MY_CARD_SPEC.md`.

---

## Accessibility

- **Photo** — touchable labelled `"Add your photo"` / `"Change your photo"` by state.
- **Bio handle** — `"Edit your card headline"`. **Field** — `"Your card headline, 90 characters maximum"`, single-line edit; counter announced on change; clamp announces `"90 character limit reached."`
- **MANAGE row** — `accessibilityRole="button"`, `"Manage offers and superpowers, 9 verified, 3 featured."`
- **Roster chips** — each a toggle: `"Lighting, featured"` / `"Snow removal, not featured, double-tap to feature."` Remove-mode x labelled `"Remove Snow removal."`
- **Destructive confirm** — focus moves to the dialog; `KEEP IT` is the default/first focus; the cost (lost endorsements) is in the body, read aloud.
- **Commit toasts** — focus moves to the toast so `UNDO` is reachable before dismiss; respect `prefers-reduced-motion` (fade, no slide).
- **Tabular figures** on all counters and counts.

---

## Brand Audit entry — paste into `BRAND_AUDIT_2026-05-11.md` after D.4

See **section 08** of `print_shop_spec.html` for the formatted **D.5** block (principle,
the four-word grammar, the Q1-Q6 rulings, the folded photo ruling, scope/parked
items, and the rationale). Append verbatim and log it as the next locked decision
in the D-series.

---

## Explicit non-features

- **No visual customization.** No color, font, or layout choice — content and skill selection only.
- **No identity editing.** Legal name, email, payout, verification live in Account.
- **No separate edit-photo screen** — the wizard is reused (D.5).
- **No full-wizard re-run to add a skill** — the additive mini-flow replaces it.
- **No read-modify-rewrite of `worker_skills`** — one-row INSERT/DELETE only.
- **No confirmation modal except skill removal** — every other edit is press + UNDO.
- **No `pending`/`unverified` label on the public card** — sheet-side only; endorsement count is the public trust signal.
- **No star rating** anywhere (Ruling 01) — star is a featured pin only.
- **No drag-reorder** in v1 (Rev 01) — featured order = insertion order.

---

## Verification checklist

- [ ] Live preview is the real `<WorkerCard preview />` (footer hidden), now carrying photo + bio handles on the self-view only.
- [ ] Photo badge ADD/EDIT by `avatar_url`; whole portrait tappable; routes to `/(onboarding)/id`; public card unchanged (gated on `onPhotoPress`).
- [ ] Bio sheet: live mini-proof, counter `n/90`, amber at 75, clamp at 90, explicit SAVE, CANCEL discards.
- [ ] Bio empty state shows italic placeholder + ADD handle on self-view.
- [ ] Bio handle is corner-tucked (Rev 01) — absolutely positioned at bottom-right of bio block; never participates in text layout.
- [ ] Roster sheet shows three groups; featured solid, roster outline, pending hairline+italic (sheet only).
- [ ] **Add writes ONE `INSERT`; remove writes ONE `DELETE`; the worker_skills set is never overwritten.**
- [ ] Add mini-flow is category->task->confirm (shared presentational child, own completion handler — Rev 01), NOT the 4-step wizard.
- [ ] Remove is behind EDIT mode + soft confirm naming lost endorsements; KEEP IT is default; red used only here.
- [ ] Superpowers: tap to feature/unfeature; cap 3 with soft swap line; **reorder deferred (order = insertion, oldest featured leftmost) — Rev 01**.
- [ ] Daily dials + publish bar behave exactly as `MY_CARD_SPEC.md` shipped.
- [ ] Lifetime edits commit independently with UNDO; none touch `worker_status`.
- [ ] No emoji outside the 20 category icons; no drop shadows; no gradients beyond the stripe; no CSS dashed borders.
- [ ] All copy matches `copy.md`; D.5 appended to the Brand Audit.

---

**END SPEC** — hand back to Maestro. Code on standby for slice-by-slice build.
