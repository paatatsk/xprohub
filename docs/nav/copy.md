# XProHub — Navigation IA - Copy

New and changed strings introduced by the nav restructure. Voice rules unchanged: imperative verb-first CTAs, ALL CAPS eyebrows/labels with wide tracking, Title Case for data-rendered titles, sentence case for body. No emoji in labels or copy.

**Source:** `docs/NAVIGATION_IA_PROPOSAL_2026-05-28.md` (LOCKED) / **Visual:** `nav/nav_visual_spec.html`

---

## 1. Tab bar labels

All caps, Space Grotesk, 9px / 1.5px tracking. One word each.

| Tab | Label | Notes |
|---|---|---|
| Home | `HOME` | -- |
| Market | `MARKET` | unchanged |
| Desk | `DESK` | **label locked — do not rename** |
| Account | `ACCOUNT` | -- |

---

## 2. Global compose +

The + carries no text label. Strings appear once it opens the Post a Job sheet (existing post copy — reuse, do not rewrite). The only new ambient string:

| Context | String |
|---|---|
| Compose sheet title (if a title is shown) | `POST A JOB` |

---

## 3. Desk tab — first screen

### Masthead
| Element | String |
|---|---|
| Eyebrow | `DESK . YOUR WORKSPACE` |
| Title (Playfair) | `Your desk.` |
| Edition line (mono) | `{WEEKDAY} {DD} {MON} {YYYY} . {N} ACTIVE . LEDGER OPEN` |

> Edition line is data-rendered, mono, all caps. Example: `FRI 31 MAY 2026 . 2 ACTIVE . LEDGER OPEN`. If zero active, drop the `{N} ACTIVE` clause -> `FRI 31 MAY 2026 . LEDGER OPEN`.

### Section eyebrows (Oswald, all caps)
| Section | String |
|---|---|
| Active work | `ACTIVE . BOTH ROLES` |
| Earnings | `EARNINGS . THIS WEEK` |
| History | `JOB HISTORY` |
| Payouts | `PAYOUT HISTORY` |

### Active-row role tags (Oswald 700, 8.5px)
| State | String | Color |
|---|---|---|
| Job you took, working it | `TAKEN . IN PROGRESS` | green |
| Job you posted, open for bids | `POSTED . AWAITING BIDS` | amber |

> Glyphs are part of the tag, not decoration. Title and meta are data-rendered (Title Case title; mono meta like `TONIGHT 6:00 PM . 4 HR`, `3 BIDS . POSTED 2 HR AGO`).

### Earnings hero
| Element | String |
|---|---|
| Big number | `${amount}` (gold, tabular) |
| Sub-label | `{N} JOBS . MON-SUN` |
| Delta | `+ ${amount} vs last week` / `- ${amount} vs last week` |

### History row
| Element | String |
|---|---|
| Date | `{DD} {MON}` (mono) |
| Receipt link | `RECEIPT` |

### Payout row
| Element | String |
|---|---|
| Destination | `Stripe -> ....{last4}` |
| Value | `+${amount}` (green) |
| Status | `LANDED` (mono) / also: `PENDING`, `IN TRANSIT` as states arise |

---

## 4. "YOUR PASS" card (Home)

The rename. Everything else is reused from the existing WorkerCard / My ID Card.

| Element | WAS | IS |
|---|---|---|
| Card eyebrow | `YOUR DESK` | **`YOUR PASS`** |

| Element | String | Notes |
|---|---|---|
| Stripe org | `XPROHUB . WORKER PASS` | unchanged — Oswald, ink on gold |
| Stripe number | `No. {pass}` | mono, e.g. `No. 00-2841` |
| Track line | `{N} endorsed . {city} . ${min}-${max}/hr` | **Ruling 01 — no star, no jobs count** |
| Status (live) | `LIVE TO MARKET` | green; mirrors publish state |
| Status (offline) | `OFFLINE` | grey; when not published |
| Edit affordance | `EDIT MY CARD` | Oswald, gold; routes to my-card.tsx |

---

## 5. Home — Desk glance card

The summary that taps through into Desk (Boundary 2).

| Element | String |
|---|---|
| Eyebrow | `YOUR DESK . AT A GLANCE` |
| Headline | `{N} active . ${amount} this week` |
| Sub | `{N} in progress {when} . {N} awaiting bids` |
| Open affordance | `OPEN DESK` |

> Note the controlled reuse of the word "Desk" here: `YOUR DESK . AT A GLANCE` refers to the Desk tab (correct — it routes there), distinct from the credential card which is now `YOUR PASS`. The collision the rename fixed was card-vs-tab; this glance card legitimately points at the tab.

---

## 6. Strings retired

| Retired | Reason |
|---|---|
| `YOUR DESK` (as the credential-card eyebrow) | Renamed to `YOUR PASS` — collided with the Desk tab. |
| Any `POST` tab label | Posting is a global + action, not a tab. |
