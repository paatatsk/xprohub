# Receipt — Build Spec

> The lighthouse screen. Where Real Work and Fair Pay collide.
> A completed job rendered as a literal receipt: itemized invoice,
> worker payout as the hero number, the platform fee in writing,
> the worker's note in Playfair, the transaction trace in mono.

**Status:** First spec, not yet shipped. This screen does not exist in the
codebase today — `app/(tabs)/apply-success.tsx` ends the worker's flow at
submission; there is no completion artifact for either party.

**Companion files:**
- `customer-view.html` — pixel-faithful HTML reference (open in a browser)
- `data.ts` — TypeScript interface the component consumes
- `copy.md` — every string used by the component, with tone notes
- `Receipt.tsx` — React Native reference implementation

---

## Thesis

This screen is the proof the brand makes. The big gold number is **what the
worker received** — not what the platform earned, not what the customer paid.
The platform fee is shown in writing, quieter, as a line item. The worker is
named in Playfair Display, the same typeface that names the company.

If we get this screen wrong, no amount of polish on Home, Welcome, or Market
will save the brand. If we get it right, every other screen has somewhere to
point.

---

## Entry points

The Receipt is reachable from four places:

1. **Push notification** — `"Maria has completed your job."` Tapping opens this screen.
2. **Home** — `"Yesterday"` card surfaces the most recent receipt with a `▸ VIEW RECEIPT` CTA. (See `audition/index.html` Mock 02 for the Home reframing this depends on; that's a separate ship.)
3. **Job detail** — once `jobs.status === 'completed'`, the detail screen gets a `VIEW RECEIPT` CTA in place of the active-job actions.
4. **My Jobs / My Earnings list** — list rows for completed jobs link to this screen.

---

## Routing

Place at `app/job/[id]/receipt.tsx`. Use `expo-router` typed routes.

```ts
// URL: /job/job_0a82f4c1/receipt?role=customer
const { id } = useLocalSearchParams<{ id: string }>();
const { role } = useLocalSearchParams<{ role?: 'customer' | 'worker' }>();
```

`role` falls back to inferring from `useAuth()` + the job record's
`customer_id` / `worker_id`. If the viewer is neither, redirect to `+not-found`.

---

## Layout

Single scrollable column. Total scroll height ~1640px at 390pt iPhone width.
Sections, top to bottom:

1. **Nav header** — gold back chevron, `RECEIPT` title (Oswald 12px / ls 4px / gold), share icon top-right
2. **Ornate divider** — `◆` flanked by gold rules (`opacity: 0.4`)
3. **Stamp row** — `WORK COMPLETED` eyebrow (gold Oswald) + ISO date in IBM Plex Mono
4. **Hero photo** — 220pt tall, with a 4-up thumbnail strip below
5. **Worker block** — Playfair 36px gold name + Inter body description + mono duration line
6. **Invoice** — line items with dotted leaders, thin rule, subtotal + muted fee line, double rule, big total row
7. **Reconciliation line** — `You paid X · Maria received Y`
8. **Note block** — `FROM MARIA` label + Playfair italic quote with gold left-rule + `— M.` signoff
9. **Trace block** — `TRANSACTION` label + k/v grid in IBM Plex Mono
10. **Actions** — gold-outline `ENDORSE THIS WORK` pill + small red "Raise a concern." link below
11. **Ticker footer** — `◆ REAL WORK · FAIR PAY · FOR EVERYONE ◆` between gold rules

See `customer-view.html` for the pixel reference. All measurements in the
HTML are intended as targets, not maxima — bias toward generous whitespace
on physical device.

---

## Tokens

| Token | Source | Used for |
|---|---|---|
| `Colors.background` | `constants/theme.ts` | Screen ground |
| `Colors.border` | `constants/theme.ts` | Thin rules, photo frame |
| `Colors.textPrimary` | `constants/theme.ts` | Section label inverts (rare) |
| `Colors.textSecondary` | `constants/theme.ts` | Muted text, fee, trace keys |
| `Colors.gold` | `constants/theme.ts` | Worker name, hero number, ornaments, endorse |
| `Colors.red` | `constants/theme.ts` | "Raise a concern" link only — the **only** red text on this screen |
| Custom: `#d8d8d8` | inline | Receipt body text; slightly dimmer than `textPrimary` to feel like ink, not pure white |

**Font families:**

| Family | Source | Used for |
|---|---|---|
| Space Grotesk | `@expo-google-fonts/space-grotesk` (already in app) | All numbers (must use tabular figures) |
| Inter | `@expo-google-fonts/inter` (already) | Body, action descriptions |
| Playfair Display | `@expo-google-fonts/playfair-display` (already) | Worker name (700), worker note (italic 700) |
| Oswald | `@expo-google-fonts/oswald` (already) | Section labels, eyebrows, buttons, ticker |
| **IBM Plex Mono** | `@expo-google-fonts/ibm-plex-mono` (**NEW**) | Date stamp, trace IDs, k/v keys |

`IBM Plex Mono` is **the ledger voice** — a second editorial register, used
wherever the receipt is being a literal accounting document. Plex Mono 400
by default, 500 for emphasis on values.

**Do not substitute SF Mono.** It's too generic; doesn't carry the document
weight.

Add to `_layout.tsx`:

```ts
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
// add to useFonts({ ... })
```

---

## Data dependencies

Full shape in `data.ts`. Sourced from Supabase joins:

- `jobs` (id, customer_id, worker_id, title, neighborhood, completed_at, duration_minutes)
- `job_post_tasks` → `task_library` (name for line item labels, price for amount)
- `payments` (stripe_charge_id, paid_at, currency)
- `worker_payouts` (amount_cents, available_at, fee_cents)
- `profiles` (full_name, location) — both customer and worker
- `job_photos` (url, captured_at) — workers upload after-photos
- `endorsements` (status, raised_at, resolved_at)

A SQL view `v_receipt_data` that joins these and returns the `ReceiptData`
shape would simplify the client. Worth a migration before this ships.

---

## States

| # | State | Treatment |
|---|---|---|
| 1 | Loading | Full-screen `ActivityIndicator` in gold. The receipt loads atomically, not piecemeal. |
| 2 | Loaded · happy path | What `customer-view.html` shows. |
| 3 | No worker note | Replace note body with `note.empty` ("No note left for this job."), italic fg2. Keep section structure. |
| 4 | No photos | Show photo frame with `— NO PHOTOS UPLOADED —` stamp inside. Hide thumbnail strip. Empty should feel like a missing thing, not blank space. |
| 5 | Payout pending | Trace `payout` row reads `funds available {date}` in gold (future date). |
| 6 | Payout completed | Trace `payout` reads `funds available` (no date) in gold. |
| 7 | Already endorsed | Replace `ENDORSE` button with `✓ ENDORSED · {date}` filled-gold pill, ink text, no tap. |
| 8 | Concern raised | Replace actions area with `CONCERN UNDER REVIEW` (red outline pill, no tap). Trace `payout` row reads `held pending review` in red. |
| 9 | Worker view | `viewerRole === 'worker'`. See `copy.md` for string overrides. Endorse area replaced with `✓ DANIEL ENDORSED THIS WORK · 22 MAY` (gold filled, no tap) or `Awaiting Daniel's endorsement` (italic fg2) depending on customer state. |
| 10 | Error | Full-screen error matching the existing 88px gold ring empty-state pattern, with `COULDN'T LOAD RECEIPT` heading and `TRY AGAIN` outline button. |

---

## Interactions

- **Share** (top-right ⤴) — opens the iOS share sheet with a PDF of the receipt + a deep link back to the in-app view. Send `kind: 'job_receipt'` in the share payload for analytics.
- **Photo tap** — opens fullscreen photo viewer. Use the same modal pattern as job-detail's existing photo viewer; if none exists, ship a minimal one with swipe-between and pinch-to-zoom.
- **ENDORSE THIS WORK** — opens a native confirmation alert:
  > **Endorse Maria's work?**
  > *This adds a confidence vote to their profile. You can still raise a concern later if needed.*
  > [ENDORSE] [CANCEL]

  On confirm: `INSERT INTO endorsements (...)`, swap button to `✓ ENDORSED · {date}` filled gold pill.
- **Raise a concern** — routes to the existing `/(tabs)/report` flow with `content_type=job&job_id=...`. Side effects: concerns raised within 48hr of completion put the worker payout on hold; the trace `payout` row updates to `held pending review` in red.

---

## Explicit non-features

The original brief did not specify this screen. As we add it, worth being
explicit about what we are **not** adding:

- **No tipping.** Fair Pay means the worker is paid fairly upfront. Tipping would imply the listed price is unfair without a top-up. If users ask for tipping post-launch, the answer is: raise category prices, not add a tip jar.
- **No star ratings.** ENDORSE / RAISE CONCERN is the entire rating vocabulary. Star scales encourage worker exploitation ("she's a 4.8, can we get her cheaper?"). Binary endorsement preserves dignity.
- **No "rate the platform" prompt.** This screen is about Maria and Daniel, not XProHub.
- **No promotional content.** Don't upsell category services here. Don't show "you might also like." The receipt is reverent.
- **No emoji.** Anywhere on this screen. The `◆` glyph and the `✓` mark inside the endorse button are the only ornaments allowed.
- **No platform-revenue-side framing.** Don't show "XProHub earned $12.40 from this job." The fee is a line item, not a celebration.

---

## Accessibility

- **Hero number** (`$142.60`): explicit `accessibilityLabel` reading the
  amount as words: `"You paid Maria one hundred forty two dollars and sixty cents."`
- **Tabular figures** must remain tabular under user-controlled font scaling.
  Test with iOS Dynamic Type at maximum — the receipt should remain readable
  (let it scroll, don't truncate).
- **Endorse button** needs `accessibilityRole="button"` and
  `accessibilityHint="Confirms Maria's work was done well."`
- **Trace block** — VoiceOver must read trace IDs character-by-character,
  not as a mumbled token. Use explicit `accessibilityLabel`:
  `"Stripe charge ID: c h underscore 7 H J 2 X 4 k p 9"`
- **Photo placeholders** — `accessibilityLabel="Photo of completed work, image 1 of 4"`

---

## Open questions

1. **Photo storage** — workers upload via the app to Supabase Storage. Bucket name? Size limit per photo (1MB? 5MB)? Compression done client-side or server-side? Retention (kept forever, or pruned after N months)? **Not solved.**
2. **PDF export** — share sheet wants a PDF. Render server-side (Edge Function with a PDF lib) or client-side (`react-native-pdf-lib`)? Server-side gives consistent output across platforms and is testable. **Add to backend roadmap.**
3. **Multi-currency** — `currency: 'usd'` for now. International expansion is a real conversation; not this turn.
4. **Receipt edit window** — can a worker amend a line item after completion (e.g. forgot a 30-min add-on)? Today: no, receipt is immutable post-completion. Worth flagging — small UX win to allow it within first hour, with an audit trail.
5. **Long worker notes** — `workerNote` is loosely capped at ~280 chars at input. Should the receipt truncate longer notes with a `READ MORE` affordance, or render unbounded? My recommendation: cap at input, render unbounded here.

---

## Verification checklist

Run through this after the build:

- [ ] Hero number renders with tabular figures (no jitter across amounts)
- [ ] Worker's name is full Playfair Display, not Space Grotesk substitute
- [ ] Fee line uses minus sign `−` (U+2212), not hyphen `-`
- [ ] Date stamp uses non-breaking middle dots `·` (U+00B7)
- [ ] Trace IDs are lowercase
- [ ] `Raise a concern` is the only red text on the screen
- [ ] No emoji anywhere
- [ ] Footer ticker text exactly: `◆ REAL WORK · FAIR PAY · FOR EVERYONE ◆`
- [ ] Scrolls cleanly to bottom; ticker isn't cut off by home indicator
- [ ] Worker view and customer view both render without copy bugs (see `copy.md`)
- [ ] All 10 states (above) verified in the screen previews

---

## What ships first

The customer view, happy path, with stub data. Endorse + concern wired. Share
sheet stubbed (returns the in-app URL only). Photo viewer stubbed (tap is a
no-op for v1). Worker view + remaining states in a follow-up.

The reason for shipping the customer view first: it's the screen the
customer's most-recent-job email/push notification points to. The point of
this screen — the brand promise — is read by the customer first.
