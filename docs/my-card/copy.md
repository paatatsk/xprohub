# My ID Card — Copy (`myCard.*`)

Every string the screen renders. English is the source. Add to
`constants/strings.ts` (create it — does not exist yet) under the `myCard.*`
namespace. Keys marked **◆** were seeded in `pr2_build_spec.md` and are
inherited verbatim; the rest are new in PR 3.

Tone rules (from the brand voice doc): imperative + verb-first CTAs, all-caps
eyebrows/buttons, sentence-case body/hints, time-estimates on gates, em-dashes
welcome, no emoji in copy.

```ts
export const myCard = {
  // ── Nav / masthead ──
  'myCard.title':                 'MY ID CARD',                 // ◆ Oswald 11 / ls 4 / gold
  'myCard.greeting':              'Good morning, {firstName}.', // Playfair italic; time-aware; new worker → "Welcome, {firstName}."

  // ── Section eyebrows ──
  'myCard.section.status':        'AM I WORKING TODAY?',        // ◆
  'myCard.section.skills':        'WHAT I\u2019M OFFERING TODAY', // ◆
  'myCard.section.rate':          'MY RATE RANGE',              // ◆
  'myCard.section.radius':        'HOW FAR I\u2019LL TRAVEL',   // ◆

  // ── Status segment ──
  'status.offline':               'OFFLINE',                    // ◆
  'status.available':             'AVAILABLE',                  // ◆
  'status.booked':                'BOOKED',                     // ◆

  // ── Status line (never empty) ──
  'myCard.line.live':             'LIVE \u00b7 {n} viewers on your card today',
  'myCard.line.booked':           'On a job until {time} \u2014 next open this evening.',
  'myCard.line.offline':          'You\u2019re off the market \u2014 last active {time}.',
  'myCard.line.armed':            'Ready to go live \u2014 not published yet.',
  'myCard.line.publishing':       'Pushing your card to the market\u2026',
  'myCard.line.justPublished':    'LIVE \u00b7 just published',

  // ── Card skill label (three-state, on the preview) ──
  'myCard.skills.today':          'TODAY',                      // ◆ available
  'myCard.skills.bookedFor':      'BOOKED FOR',                 // ◆ booked
  'myCard.skills.offers':         'OFFERS',                     // ◆ offline / fallback

  // ── Skills editor ──
  'myCard.skills.count':          '{n} / 8 selected',
  'myCard.skills.hint':           'Tap \u00d7 to take a skill off today\u2019s card, or add from your roster.', // ◆
  'myCard.skills.add':            '+ ADD SKILL',
  'myCard.skills.cap':            '8 max \u2014 remove one to add.',
  'myCard.skills.fallback':       'Nothing picked yet \u2014 your card shows all {n} verified offers until you choose.',

  // ── Picker sheet ──
  'myCard.picker.title':          'What can you do today?',
  'myCard.picker.subhead':        'Toggle from your verified roster, or add something new from the categories.',
  'myCard.picker.groupToday':     'ON YOUR CARD TODAY \u00b7 {n}',
  'myCard.picker.groupRoster':    'VERIFIED \u00b7 NOT TODAY',
  'myCard.picker.groupNew':       'ADD NEW \u00b7 FROM 20 CATEGORIES',
  'myCard.picker.unverified':     'unverified',           // PICKER ONLY — never rendered on the public card (Rev 02 re-ruling)
  'myCard.picker.done':           'DONE \u00b7 {n} ON TODAY',

  // ── Publish CTA (state-aware) ──
  'myCard.cta.goLive':            'GO LIVE TO MARKET',          // offline → available
  'myCard.cta.goLiveAllOffers':   'GO LIVE \u00b7 ALL OFFERS',  // available, zero today_skills
  'myCard.cta.publish':           'PUBLISH TO MARKET',          // ◆ generic / disabled
  'myCard.cta.publishing':        'PUBLISHING\u2026',           // ◆ busy
  'myCard.cta.published':         'LIVE \u00b7 UPDATE',          // ◆ already live, outlined
  'myCard.cta.updateBooked':      'UPDATE MY CARD',             // booked
  'myCard.hint.armed':            'tap once \u00b7 you\u2019ll get a chance to undo',
  'myCard.hint.live':             'published {time} \u00b7 edit anytime',
  'myCard.hint.disabled':         'add a skill to publish your card',
  'myCard.hint.allOffers':        'pick skills to narrow what you show today',
  'myCard.hint.booked':           'booked \u00b7 still visible, sorted below available',

  // ── Publish toast ──
  'myCard.toast.live':            'YOU\u2019RE ON THE MARKET',
  'myCard.toast.liveSub':         'Card published \u00b7 {n} laborers active near you',
  'myCard.toast.undo':            'UNDO',

  // ── Empty states ──
  'myCard.empty.noSkills.title':  'Your card is empty',
  'myCard.empty.noSkills.body':   'Claim at least one skill and you\u2019ll have a credential to put on the market. It takes about a minute.',
  'myCard.empty.noSkills.cta':    'CLAIM A SKILL \u2192',
  'myCard.empty.noSkills.locked': 'You can\u2019t go live until your card has a skill.',
  'myCard.empty.skills':          'Tap + to add a skill from your roster.', // ◆ editor empty hint
};
```

## Out of scope here

- **Track-line strings** (`[N] endorsed · [city] · $[min]–[max]/hr`) belong to `WorkerCard` / the `card.*` namespace (Ruling 01), not `myCard.*`. The preview renders them via the component — no `★`, no jobs count.

## Interpolation notes

- `{firstName}` — `profiles.full_name.split(' ')[0]`.
- `{n}` (viewers) — analytics presence count; omit the clause if unavailable rather than showing `0 viewers`.
- `{n}` (laborers active) — same aggregate the Market masthead uses.
- `{time}` — relative for offline (`4 hr ago`), clock for booked (`6:30 PM`), clock for published (`9:41 AM`). Format helpers server-side or via a shared util; do not hardcode.
- Greeting is time-of-day aware: `Good morning,` / `Good afternoon,` / `Good evening,`.

## Punctuation

- Use `\u00b7` (·) middle dots, `\u2014` (—) em-dashes, `\u2026` (…) ellipsis, `\u2019` (’) curly apostrophes, `\u2192` (→) arrow, `\u00d7` (×) multiplication sign for the chip remove glyph (not the letter x).
