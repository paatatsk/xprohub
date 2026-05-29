// XProHub — Display Strings
// Source of truth for all user-facing copy.
// English values. i18n deferred to v1.1.

export const strings = {
  // Market toggle
  'toggle.jobs':           'JOBS',
  'toggle.laborers':       'TALENT',

  // Worker status segment
  'status.offline':        'OFFLINE',
  'status.available':      'AVAILABLE',
  'status.booked':         'BOOKED',

  // Skill block labels (three-state)
  'card.skills.today':     'TODAY',
  'card.skills.bookedFor': 'BOOKED FOR',
  'card.skills.offers':    'OFFERS',

  // Card actions
  'card.action.hire':      'HIRE',

  // Card stamps
  'card.stamp.new':              'NEW',

  // Track record
  'card.track.endorsedSuffix':   'endorsed',

  // Worker detail menu (forward-looking — PR 3+ migration)
  'detail.menu.report':          'Report this worker',
  'detail.menu.block':           'Block this worker',

  // Filter chips
  'filter.all':            'ALL',
  'filter.available':      'AVAILABLE',
  'filter.nearMe':         'NEAR ME',
  'filter.topRated':       'TOP RATED',
  'filter.urgent':         'URGENT',

  // My ID Card screen — PR 2 seeds (◆) + PR 3 additions
  'myCard.title':            'MY ID CARD',
  'myCard.section.status':   'AM I WORKING TODAY?',
  'myCard.section.skills':   'WHAT I\u2019M OFFERING TODAY',
  'myCard.section.rate':     'MY RATE RANGE',
  'myCard.section.radius':   'HOW FAR I\u2019LL TRAVEL',
  'myCard.cta.publish':      'PUBLISH TO MARKET',
  'myCard.cta.publishing':   'PUBLISHING\u2026',
  'myCard.cta.published':    'LIVE \u00b7 UPDATE',
  'myCard.hint.rate':        'Set the rate range you\u2019ll accept today.',
  'myCard.hint.skills':      'Pick what you\u2019re ready to do today.',
  'myCard.empty.skills':     'Tap + to add a skill from your roster.',

  // Status lines (never empty)
  'myCard.line.live':           'LIVE \u00b7 {n} skills on your card today',
  'myCard.line.booked':         'On a job \u2014 next open later.',
  'myCard.line.offline':        'You\u2019re off the market \u2014 last active {time}.',
  'myCard.line.armed':          'Ready to go live \u2014 not published yet.',
  'myCard.line.publishing':     'Pushing your card to the market\u2026',
  'myCard.line.justPublished':  'LIVE \u00b7 just published',

  // Skills editor
  'myCard.skills.count':    '{n} / 8 selected',
  'myCard.skills.hint':     'Tap \u00d7 to take a skill off today\u2019s card, or add from your roster.',
  'myCard.skills.add':      '+ ADD SKILL',
  'myCard.skills.cap':      '8 max \u2014 remove one to add.',
  'myCard.skills.fallback': 'Nothing picked yet \u2014 your card shows all {n} verified offers until you choose.',

  // Picker sheet
  'myCard.picker.title':       'What can you do today?',
  'myCard.picker.subhead':     'Toggle from your verified roster, or add something new from the categories.',
  'myCard.picker.groupToday':  'ON YOUR CARD TODAY \u00b7 {n}',
  'myCard.picker.groupRoster': 'VERIFIED \u00b7 NOT TODAY',
  'myCard.picker.groupNew':    'ADD NEW \u00b7 FROM 20 CATEGORIES',
  'myCard.picker.unverified':  'unverified',
  'myCard.picker.done':        'DONE \u00b7 {n} ON TODAY',

  // Publish CTA (state-aware)
  'myCard.cta.goLive':          'GO LIVE TO MARKET',
  'myCard.cta.goLiveAllOffers': 'GO LIVE \u00b7 ALL OFFERS',
  'myCard.cta.updateBooked':    'UPDATE MY CARD',
  'myCard.hint.armed':          'tap once \u00b7 you\u2019ll get a chance to undo',
  'myCard.hint.live':           'published {time} \u00b7 edit anytime',
  'myCard.hint.disabled':       'add a skill to publish your card',
  'myCard.hint.allOffers':      'pick skills to narrow what you show today',
  'myCard.hint.booked':         'booked \u00b7 still visible, sorted below available',

  // Publish toast
  'myCard.toast.live':    'YOU\u2019RE ON THE MARKET',
  'myCard.toast.liveSub': 'Card published \u00b7 {n} talent active near you',
  'myCard.toast.undo':    'UNDO',

  // Empty states (PR 3)
  'myCard.empty.noSkills.title':  'Your card is empty',
  'myCard.empty.noSkills.body':   'Claim at least one skill and you\u2019ll have a credential to put on the market. It takes about a minute.',
  'myCard.empty.noSkills.cta':    'CLAIM A SKILL \u2192',
  'myCard.empty.noSkills.locked': 'You can\u2019t go live until your card has a skill.',

  // Empty states
  'feed.empty.laborers':     'No talent in your area today. Check back soon.',
  'feed.empty.jobs':         'No open jobs in this category. Try ALL.',

  // Time-string templates
  'card.bookedNext':         'next open in {time}',
  'card.offlineLast':        'last active {time}',
} as const;
