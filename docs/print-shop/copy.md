# The Print Shop — Copy (`myCard.*`)

Every **new** string the edit surface adds. English is the source. Add to
`constants/strings.ts` under the existing `myCard.*` namespace (alongside the
daily-dial keys already in `MY_CARD_SPEC.md`'s `copy.md`). Keys marked **◆** are
inherited from the **Photo Affordance ruling** (D.5) verbatim.

Tone rules (house): imperative + verb-first CTAs, all-caps eyebrows/buttons/badges,
sentence-case body/hints, time-estimates on gates, em-dashes welcome, **no emoji**
(except the 20 category icons in the add-skill picker). Visible badge labels match
the onboarding wizard verbatim so the two surfaces read as one system.

```ts
export const myCardPrintShop = {
  // ── Zone 1 · PHOTO (folds D.5) ──
  'myCard.photo.addBadge':        'ADD',            // ◆ corner badge, no avatar_url. Gold pill / ink text.
  'myCard.photo.editBadge':       'EDIT',           // ◆ corner badge, photo on file. Matches id.tsx avatarEditText.
  'myCard.photo.hint':            'Tap your photo to add one \u2014 it\u2019s the first thing customers see.', // ◆ no-photo only; omit when a photo is on file
  'myCard.photo.a11y.add':        'Add your photo',   // ◆ accessibilityLabel
  'myCard.photo.a11y.edit':       'Change your photo',// ◆ accessibilityLabel

  // ── Zone 2 · BIO ──
  'myCard.bio.addBadge':          'ADD',            // inline handle when bio is null
  'myCard.bio.editBadge':         'EDIT',           // inline handle when bio is set
  'myCard.bio.sheetTitle':        'Write your headline.',
  'myCard.bio.sheetHint':         'One line, the way you\u2019d say it on a doorstep. Customers want to know who they\u2019re hiring.',
  'myCard.bio.placeholder':       'What should customers know? One line \u2014 your trade, your edge.', // empty field
  'myCard.bio.cardEmpty':         'Add a line about your work', // self-view card line when null (italic); public fallback stays "Worker on XProHub"
  'myCard.bio.counterHint':       'trade \u00b7 years \u00b7 what you do',  // quiet coach beside the counter
  'myCard.bio.save':              'SAVE LINE',
  'myCard.bio.cancel':            'CANCEL',
  'myCard.bio.clampA11y':         '90 character limit reached.',
  'myCard.bio.fieldA11y':         'Your card headline, 90 characters maximum',
  'myCard.bio.toast':             'BIO UPDATED',
  'myCard.bio.toastSub':          'Card reprinted \u00b7 live on the market',

  // ── Zone 3+4 · ROSTER & SUPERPOWERS ──
  'myCard.offers.row':            '{verified} verified \u00b7 {featured} featured', // MANAGE row value
  'myCard.offers.manage':         'MANAGE',          // door button
  'myCard.offers.sheetTitle':     'Your workshop.',
  'myCard.offers.sheetHint':      'Feature up to 3 on your card. Add new trades, or retire ones you no longer offer.',
  'myCard.offers.groupFeatured':  'FEATURED ON YOUR CARD \u00b7 {n} / 3',
  'myCard.offers.groupRoster':    'VERIFIED \u00b7 NOT FEATURED',
  'myCard.offers.groupAdd':       'ADD TO YOUR ROSTER',
  'myCard.offers.rosterHint':     'tap to feature \u00b7 EDIT to remove', // group sub-label
  'myCard.offers.addSkill':       '+ ADD A SKILL',   // opens the category mini-flow
  'myCard.offers.editMode':       'EDIT',            // reveals × remove handles on roster chips
  'myCard.offers.pending':        'pending',         // SHEET-SIDE ONLY — never rendered on the public card
  'myCard.offers.capLine':        '3 featured max \u2014 swap one out to add.', // at-cap soft line (amber)
  'myCard.offers.done':           'DONE',            // closes the sheet

  // add-skill mini-flow
  'myCard.add.steps.category':    'CATEGORY',
  'myCard.add.steps.task':        'TASK',
  'myCard.add.steps.confirm':     'CONFIRM',
  'myCard.add.confirmTitle':      'Add {skill} to your roster?',
  'myCard.add.confirmBody':       'It\u2019ll show on your card right away. New skills start unverified \u2014 endorsements build trust over time.',
  'myCard.add.confirmCta':        'ADD SKILL',
  'myCard.add.toast':             'SKILL ADDED',
  'myCard.add.toastSub':          '{skill} is on your roster \u00b7 pending verification',

  // remove (destructive — the one hard stop)
  'myCard.offers.remove.title':   'Remove {skill}?',
  'myCard.offers.remove.body':    'You\u2019ll lose its {n} endorsements. This can\u2019t be undone \u2014 you\u2019d have to earn them again.',
  'myCard.offers.remove.keep':    'KEEP IT',         // default action
  'myCard.offers.remove.confirm': 'REMOVE',          // destructive action (red)
  'myCard.offers.remove.toast':   'SKILL REMOVED',

  // superpower commits
  'myCard.offers.toast.featured':   'SUPERPOWER FEATURED',
  'myCard.offers.toast.featuredSub':'{skill} now leads your card',
  'myCard.offers.toast.demoted':    'MOVED TO ROSTER',
  'myCard.offers.toast.reordered':  'ORDER UPDATED',

  // shared
  'myCard.toast.undo':            'UNDO',            // ◆ reused from daily publish toast
};
```

## Out of scope here

- **Daily-dial strings** (status segment, today's skills, rate/radius, publish bar, daily toast/empty states) belong to the existing `myCard.*` set in `MY_CARD_SPEC.md`'s `copy.md` — inherited unchanged.
- **Track-line strings** (`{N} endorsed · {city} · ${rate}/hr`) belong to `WorkerCard` / the `card.*` namespace (Ruling 01), not `myCard.*`.
- **Identity strings** (legal name, email, payout, verification) live in Account — not this surface.

## Interpolation notes

- `{verified}` / `{featured}` — counts of `worker_skills` rows and featured rows.
- `{n}` (featured group) — current featured count, 0–3.
- `{n}` (remove body) — endorsements on the specific skill being removed; if `0`, drop the endorsements clause: *"This can't be undone — you'd have to add it again."*
- `{skill}` — the skill's Title-Case display name.
- Photo `{firstName}`, time helpers, etc. — per the existing `copy.md`.

## Punctuation

- Use `\u00b7` (·) middle dots, `\u2014` (—) em-dashes, `\u2026` (…) ellipsis,
  `\u2019` (') curly apostrophes, `\u2192` (→) arrow, `\u00d7` (×) multiplication
  sign for chip remove glyphs (not the letter x), `\u2605` (★) for the featured
  pin (not a rating), `\u283f` (⠿) for the drag grip.

## Voice spot-checks

- Gates state the **time/effort or the upside**, never bare friction: *"New skills start unverified — endorsements build trust over time."*
- Destructive copy names the **specific cost**, not a generic "Are you sure?": *"You'll lose its 18 endorsements."*
- Completion states are short, declarative, never twee: `BIO UPDATED`, `SKILL ADDED`, `SUPERPOWER FEATURED`.
- The bio coach borrows the wizard's own rationale (*"Customers want to know who they're hiring"*) so the argument stays consistent end to end.
