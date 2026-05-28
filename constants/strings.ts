// XProHub — Display Strings
// Source of truth for all user-facing copy.
// English values. i18n deferred to v1.1.

export const strings = {
  // Market toggle
  'toggle.jobs':           'JOBS',
  'toggle.laborers':       'LABORERS',

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

  // My ID Card screen
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

  // Empty states
  'feed.empty.laborers':     'No laborers in your area today. Check back soon.',
  'feed.empty.jobs':         'No open jobs in this category. Try ALL.',

  // Time-string templates
  'card.bookedNext':         'next open in {time}',
  'card.offlineLast':        'last active {time}',
} as const;
