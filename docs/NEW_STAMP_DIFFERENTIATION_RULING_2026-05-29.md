# NEW Stamp · Differentiation Ruling

**RE:** NEW stamp — JobCard vs WorkerCard
**FROM:** Claude Design
**DATE:** 2026-05-29
**REF:** `pr2_rulings.md` · R01

---

## Ruling — at a glance

**The word "NEW" stays on both cards. The treatment splits.**

- **JobCard NEW** — unchanged. Solid gold fill, ink text, overhangs the top edge.
- **WorkerCard NEW** — *new treatment.* Hollow 1.5px gold outline, gold text, tucked inside the frame.

Both treatments draw from grammar already locked in the system: solid gold = primary/urgent (CTA family); outline gold = quiet credential (HIRE pill + avatar-ring family). No new tokens, no migration.

---

## 1 · The collision

The identical solid-gold corner stamp currently appears on both surfaces:

- **JobCard NEW** means: just hit the wire — claim it before someone else does. Expires in ~1 hour, automatically.
- **WorkerCard NEW** means: newly arrived — under 10 jobs done. Persists for weeks.

Same stamp on a worker reads as "featured / hot worker." Gold is XProHub's desirability color — the budget headline, the primary CTA, the value mass on every screen. Drape it in its loudest solid form over a worker with no track record, and a scanning customer reads "premium / recommended." Then they tap in and find 0–9 completed jobs.

That gap between what the stamp promised and what the credential delivers is exactly the kind of trust erosion this brand exists to avoid.

---

## 2 · Why the word stays

XProHub's whole thesis is that a job and a worker are two faces of one event: someone new just entered the market, take note. The yin-yang says it; the ticker says it; "REAL WORK · FAIR PAY · FOR EVERYONE" says it.

A fresh job and a fresh worker both genuinely mean "newly arrived." At the lexical level the shared mark is correct — fracturing it into "FRESH" / "NEW HERE" / "ROOKIE" would buy disambiguation at the cost of the one-vocabulary discipline.

The word is not the problem. The treatment is.

---

## 3 · Where the signals diverge

| Axis | JobCard "NEW" | WorkerCard "NEW" |
|---|---|---|
| **Valence** | Desirability. "Grab it." A scarce, hot opportunity. | Provenance. "Welcome them." A disclosure, not a boast. |
| **Temporality** | Ephemeral. `created_at < 1hr`; self-expires. | Sustained band. `jobs_completed < 10`; lingers weeks. |
| **Right gesture** | Interrupt the page — stop the press. | A calm notation on the credential. |

**Fill carries valence.** The app already runs a solid-vs-outline gold grammar:
- Solid gold = primary, urgent action (the gold button).
- Outline gold = quieter credential register (HIRE pill is outlined gold; avatar rings and badges are 1.5px gold strokes).

Solid says *act*; outline says *noted*. A provenance flag belongs in the outline family.

**Anchor carries temporality.** The JobCard stamp overhangs at `top: -1px` — it breaks the card's own border, a deliberate "stop the press" gesture suited to something expiring within the hour. A worker's NEW status lingers for weeks; an interruption that never stops interrupting becomes noise. Tucking the worker stamp inside the frame (`top: 14px`) turns it from an alarm into a calm credential annotation.

---

## 4 · Threshold drift (logged, not re-litigated)

Ruling 01 in `pr2_rulings.md` pinned the worker NEW stamp to `endorsement_count === 0` — a knife-edge moment that flips on the first endorsement. At that definition the worker stamp behaved like the JobCard's: momentary, here-and-gone, and reusing the identical treatment was defensible.

What shipped on hardware is `jobs_completed < 10` — a tenure band a worker can sit in for weeks or months. That single change converts the stamp from a freshness flash into a standing status, and is precisely what tips this ruling toward differentiation.

The threshold is locked and not reopened here. The drift is logged against R01 so the record shows the treatment split was a consequence of the threshold change, not a reversal of design taste.

---

## 5 · Implementation — three edits, no new tokens

### Edit 1 · Fork the stamp style on WorkerCard only

Modify `components/CornerStamp.tsx` to support the new outline treatment, or apply override styling at the WorkerCard call site. JobCard's stamp is untouched.

WorkerCard NEW stamp styling:
```
backgroundColor: 'transparent',
borderWidth: 1.5,
borderColor: Colors.gold,
color: Colors.gold,
top: 14,              // was -1 (was overhanging)
borderRadius: 3,      // was 0 0 4 4
// Typography unchanged:
fontFamily: 'Oswald_700Bold',
fontSize: 8.5,
letterSpacing: 2,
```

JobCard NEW stamp stays:
```
backgroundColor: Colors.gold,
color: Colors.ink,
top: -1,
borderTopLeftRadius: 0,
borderTopRightRadius: 0,
borderBottomLeftRadius: 4,
borderBottomRightRadius: 4,
// Typography:
fontFamily: 'Oswald_700Bold',
fontSize: 8.5,
letterSpacing: 2,
```

### Edit 2 · Add accessibility labels

Add to `constants/strings.ts`:
```
'card.stamp.new':              'NEW',                              // visible glyph — unchanged, shared
'card.stamp.new.job.a11y':     'New — posted within the hour',     // JobCard accessibilityLabel
'card.stamp.new.worker.a11y':  'New to XProHub',                   // WorkerCard accessibilityLabel
```

The visible text remains `'NEW'` on both cards. Disambiguation lives in `accessibilityLabel` only — no visible warning copy, no red, no desaturation. Early tenure is welcomed, not flagged (dignity rule).

### Edit 3 · Append to Brand Audit

Append the following block to `BRAND_AUDIT_2026-05-11.md` after Section D.3:
```
D.4 The NEW stamp — shared word, split treatment
Decision: The word "NEW" is shared by JobCard and WorkerCard.
The treatment is not. Solid gold fill that overhangs the card edge
is reserved for JobCard (urgency / ephemeral). The WorkerCard "NEW"
is a hollow gold outline tucked inside the frame (provenance / standing).
Source: Stamp Differentiation ruling, 2026-05-29. Cross-refs:

JobCard stamp spec — pr2_build_spec.md "Corner stamp"
WorkerCard stamp origin — pr2_rulings.md Ruling 01

Threshold drift (why this differentiation exists): Ruling 01's
worker-stamp threshold shifted from endorsement_count === 0 (momentary)
to jobs_completed < 10 (tenure band) during implementation. The shift
made shared-treatment over-promise, which this ruling resolves.
Rule:

Word: "NEW" on both. Never fork the lexicon (no FRESH / NEW HERE / ROOKIE).
JobCard: solid --gold fill, --ink text, top: -1px (overhangs),
radius 0 0 4 4. Oswald 700, 8.5px, ls 2px. // unchanged
WorkerCard: transparent fill, 1.5px --gold stroke, --gold text,
top: 14px (tucked inside), radius 3. Same Oswald 700 / 8.5px / ls 2px.
Grammar basis: solid gold = primary/urgent (CTA family);
outline gold = quiet credential (HIRE pill + avatar-ring family).
Disambiguation lives in accessibilityLabel, not visible copy.
No red, no desaturation, no warning caption on the worker variant —
early tenure is welcomed, not flagged (dignity rule).

Why this matters: Solid urgency-gold on an unproven worker
reads as "featured/premium" and over-promises — the customer taps in
to 0–9 jobs and the credential under-delivers. Outline + tuck keeps the
shared "newly arrived" meaning while removing the false desirability claim.
```

---

## 6 · Why this matters

Solid urgency-gold on an unproven worker over-promises — the customer reads "featured/premium," taps in, finds 0–9 jobs. Outline + tuck keeps the shared "newly arrived" meaning while removing the false desirability claim. Dignity intact; signal honest.

The word travels. The weight shouldn't.

---

**END RULING** — Claude Design · 29·MAY·2026
