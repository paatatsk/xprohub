# Receipt — Copy

All strings used by `Receipt.tsx`. Edit here, not inline in the component.
Keys are stable; English values are the source. i18n plugs in later.

## Tone rules

- **Section labels** are Oswald all-caps with 3–4px tracking. Editorial register.
- **Body copy** is Inter, sentence case, second person.
- **The worker is named in Playfair Display.** The customer's first name appears
  *only as a possessive* in the worker-view action line ("Daniel's apartment").
  Never as a Playfair flourish — this screen belongs to the worker.
- **Numbers** are tabular Space Grotesk. Currency always shows cents (`$142.60`,
  never `$143`).
- **Trace IDs** are lowercase IBM Plex Mono. Always.
- **No emoji**, anywhere on this screen. The `◆` glyph and the SVG icons from
  Welcome are the only ornaments permitted.

## Strings — shared

| Key | Value | Notes |
|---|---|---|
| `nav.title` | `RECEIPT` | Always uppercase, Oswald, ls 4px |
| `divider.diamond` | `◆` | U+25C6 |
| `footer.ticker` | `◆ REAL WORK · FAIR PAY · FOR EVERYONE ◆` | Use middle-dot U+00B7, not period |

## Strings — customer view

| Key | Value | Notes |
|---|---|---|
| `header.eyebrow` | `WORK COMPLETED` | Gold Oswald |
| `header.date` | `{D · MMM · YYYY · HH:MM TZ}` | Mono dots, e.g. `22 · MAY · 2026 · 16:17 EDT` |
| `photo.placeholderLabel` | `— PHOTO —` | Shown when `photos` empty |
| `photo.placeholderBody` | `{Worker.firstName} hasn't uploaded photos yet` | Mono small |
| `photo.uploadedHint` | `{Worker.firstName} uploaded {N} {N === 1 ? 'image' : 'images'}` | Below thumbnail strip |
| `photo.meta` | `{i} / {total} · {HH:MM TZ}` | Bottom-right of hero |
| `worker.subject` | `{actionDescription} in {Customer.location} —` | Verb already in actionDescription |
| `worker.duration` | `{HH HR MM MIN} · {DAY DD MON YYYY}` | All caps |
| `invoice.label` | `ITEMIZED` | Section label |
| `invoice.subtotalLabel` | `Subtotal` | Sentence case (a line item, not a section) |
| `invoice.feeLabel` | `XProHub fee · {N}%` | Always show percent inline |
| `invoice.feeAmount` | `−{amount}` | Always the U+2212 minus, not hyphen |
| `invoice.totalLabel` | `PAID TO {WORKER_FIRSTNAME_UPPER}` | The hero number's label |
| `invoice.reconcile` | `You paid {customerCharged} · {Worker.firstName} received {workerPayout}` | Closes the math |
| `note.label` | `FROM {WORKER_FIRSTNAME_UPPER}` | All caps |
| `note.empty` | `No note left for this job.` | Italic, fg2 |
| `note.signoff` | `— {Worker.firstName[0]}.` | Auto, from first initial |
| `trace.label` | `TRANSACTION` | Section label |
| `trace.keys` | `paid` / `stripe` / `payout` / `job id` | Lowercase mono |
| `trace.payoutPending` | `funds available {DD MMM YYYY}` | Gold value |
| `trace.payoutDone` | `funds available` | Gold value, no date |
| `trace.concernHold` | `held pending review` | RED value — replaces payout line when concern raised |
| `action.endorse` | `ENDORSE THIS WORK` | Primary CTA, gold outline pill |
| `action.endorsed` | `✓ ENDORSED · {DD MMM YYYY}` | Replaces button post-endorsement, gold filled |
| `action.endorseConfirmTitle` | `Endorse {Worker.firstName}'s work?` | Confirmation sheet |
| `action.endorseConfirmBody` | `This adds a confidence vote to their profile. You can still raise a concern later if needed.` | |
| `action.endorseConfirmYes` | `ENDORSE` | |
| `action.endorseConfirmNo` | `CANCEL` | |
| `action.concernPrefix` | `Something wasn't right?` | Black sentence, fg2 |
| `action.concernLink` | `Raise a concern.` | RED, dotted underline |
| `action.concernActive` | `CONCERN UNDER REVIEW` | Red outline pill, replaces actions area |
| `action.concernResolved` | `CONCERN RESOLVED · {DD MMM}` | Gold filled, post-resolution |

## Strings — worker view (overrides)

Worker view is the same screen with these substitutions:

| Key | Value | Notes |
|---|---|---|
| `header.eyebrow` | `YOU EARNED` | Replaces "WORK COMPLETED" |
| `worker.subject` | `You {actionDescription} {Customer.firstName}'s {Customer.location} —` | "cleaned" → "You cleaned" |
| `invoice.totalLabel` | `YOU RECEIVED` | Replaces "PAID TO MARIA" |
| `invoice.reconcile` | `{Customer.firstName} paid {customerCharged} · You received {workerPayout}` | |
| `action.endorse` | *(hidden — workers don't endorse their own work)* | |
| `action.endorsedByCustomer` | `✓ {CUSTOMER_FIRSTNAME_UPPER} ENDORSED THIS WORK · {DD MMM}` | Shown when customer has endorsed; gold filled, no tap |
| `action.notYetEndorsed` | `Awaiting {Customer.firstName}'s endorsement` | Italic fg2, no button |
| `action.concernPrefix` | *(hidden)* | Workers respond to concerns via separate flow |
| `action.concernLink` | *(hidden)* | |

## Forbidden phrasings

These tested-and-rejected variants are listed so they don't sneak back in:

- ❌ `Rate this work` / `How was your experience?` — we don't do star ratings.
- ❌ `Tip Maria` — we don't accept tips. Fair Pay means upfront pricing.
- ❌ `Total: $155.00` — never show the gross subtotal as the hero number.
  The hero is **what the worker received**.
- ❌ `Thank you for using XProHub` — this screen is about Maria and Daniel, not us.
- ❌ `4.9 ★` / star characters anywhere — binary endorsement only.
- ❌ `Maria's a 5-star cleaner` — no quantified reputation.
- ❌ `Get $5 off your next clean` — no upsell on receipts.
- ❌ `Service fee` — be specific: `XProHub fee · 8%`. Always with percent.

## Source

- Worker note (workerNote) is user-generated; never modified in the view.
  Empty/null states use `note.empty`.
- Worker first name is computed as `fullName.split(' ')[0]`. Capitalize for
  section labels (`FROM MARIA`), use as-typed for body.
- Dates are formatted with the device's locale for the day-name string,
  forced to en-US for month abbreviations, then uppercased.
