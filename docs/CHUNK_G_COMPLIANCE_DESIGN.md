# XProHub — Chunk G Design: Launch Compliance

**Created:** 2026-05-14
**Author:** Paata Tskhadiashvili + chat-Claude
**Status:** Design complete — Chunks D and E shipped, build ready

---

## What Chunk G Builds

Apple App Store and Stripe compliance requirements for v1 launch
submission. This chunk addresses every gap identified in the
2026-05-14 compliance audit that would cause App Store rejection.

Chunk G is a pre-launch gate — the app cannot be submitted to
Apple without these items. It does not add product features; it
adds the compliance layer required for distribution.

---

## Locked Decisions

**Stripe Connect for real-world services is compliant.**
Apple Guideline 3.1.3(e) requires third-party payments (not IAP)
for real-world services consumed outside the app. XProHub's entire
payment architecture (Stripe Connect Express, SetupIntent for
customer cards, platform fee on transactions) is in Apple's
explicit safe zone. Confirmed: zero StoreKit/IAP imports in
codebase.

**No In-App Purchase.**
XProHub sells real-world labor (cleaning, handyman, tutoring, etc.).
Apple IAP is prohibited for this use case per Guideline 3.1.3(e).
Stripe is the required approach.

**No App Tracking Transparency.**
XProHub does not track users across other companies' apps or
websites. NSPrivacyTracking = false. No ATT prompt needed.

**Privacy manifests ship with app.json, not manual Xcode config.**
Expo's expo.ios.privacyManifests in app.json generates the native
PrivacyInfo.xcprivacy at prebuild time. Already implemented
(2026-05-14).

**Legal copy written by Paata, not AI-generated.**
Privacy Policy and Terms of Service are legal documents. Claude
builds the technical infrastructure (hosting, in-app links,
signup checkbox). Paata writes or commissions the actual legal
text.

---

## Build Sequence

### G-1: Account deletion feature

Apple Guideline 5.1.1(v) — mandatory for all apps with account
creation. Top rejection reason for marketplace apps.

#### Locked Decisions

**Anonymize, not hard-delete.** 11 of 14 FK columns referencing
profiles.id use NO ACTION — hard-deleting the profile row would
violate referential integrity. Financial records (payments,
escrow history) must be retained for Stripe compliance and
dispute resolution. Strategy: null PII fields in profiles,
preserve the row as a tombstone. The 3 CASCADE FKs
(worker_skills, user_badges, notifications) never fire because
the profile row is kept — those tables are cleaned up explicitly
in the Edge Function.

**Auth user: rotate credentials, do not delete.** The FK from
profiles.id to auth.users(id) is ON DELETE CASCADE. Calling
supabase.auth.admin.deleteUser() would cascade-delete the
profile row, which would then violate NO ACTION constraints on
11 downstream FK columns and fail. Instead: rotate email to
`deleted-{uuid}@xprohub.invalid`, set a random password via
admin.updateUserById(), and set banned_until to 9999-12-31.
The auth record persists but is permanently unusable.

**Money-state blocker.** Reject deletion if the user has any
active financial obligations:
- Jobs in status: in_progress, pending_confirmation, disputed
- Payments with escrow_status: held
The UI must surface a clear explanation: "You have active jobs
or held payments. Complete or cancel them before deleting your
account."

**Stripe cleanup: capability-disable, not delete or reject.**
- If stripe_customer_id exists: delete the Stripe Customer
  object (stripe.customers.del). Removes saved payment methods.
  Safe — no downstream FK implications on Stripe's side.
- If stripe_account_id exists: deactivate the Connected
  Account's capabilities (stripe.accounts.update with
  capabilities.transfers.requested = false,
  capabilities.card_payments.requested = false). Do NOT delete
  the Connected Account — Stripe retains transfer and payout
  history on the account object for compliance.

  Note on stripe.accounts.reject(): This is the explicit Stripe
  API for terminating a Connected Account, but we choose
  capability-disable instead. reject() flags the account in
  Stripe's internal fraud/compliance reporting system, which is
  appropriate for platform-initiated enforcement (fraud, ToS
  violation) but not for routine user-initiated deletion. The
  account remains on Stripe's records either way — reject() just
  adds a negative signal we have no reason to send. Documenting
  this so the question doesn't get reopened.

#### Per-table Deletion Strategy

| Table | Action | Reason |
|---|---|---|
| auth.users | Rotate email + password, ban | CASCADE FK to profiles — cannot delete |
| profiles | Anonymize PII, preserve row | Tombstone for FK integrity |
| jobs (as customer) | Cancel if open; preserve completed | Financial audit trail |
| bids (on deleted user's cancelled jobs) | Auto-decline pending | Worker Dignity — see below |
| bids (as worker on others' jobs) | Preserve | Job history for other party |
| chats | Preserve | Other party's conversation record |
| messages | Preserve | Other party's conversation record |
| payments | Preserve all | Stripe compliance, dispute window |
| reviews (as author) | Anonymize author display; preserve text + rating | Platform trust data |
| reviews (as subject) | Preserve | Other party's reputation record |
| worker_skills | Delete | No downstream FK; cleanup |
| user_badges | Delete | No downstream FK; cleanup |
| notifications | Delete | No retention value |
| xp_transactions | Preserve | Audit trail |

**Open-bid handling (Worker Dignity).** When account deletion
cancels a user's open jobs, all pending bids on those jobs must
be auto-declined — workers must not be left hanging on a job
that no longer exists. Mechanism: direct
`UPDATE bids SET status = 'declined' WHERE job_id IN
(cancelled job IDs) AND status = 'pending'` inside the
delete-account Edge Function. The existing `decline_bid()`
Postgres function cannot be reused here because it enforces
`auth.uid() = customer_id`, which won't match in a service_role
Edge Function context. No side effects are lost — decline_bid()
is a pure status UPDATE with no triggers, notifications, or XP
writes (notification support is commented as "future step" in
the migration).

#### Scope

- New settings/profile screen with "Delete My Account" option
- Confirmation flow (two-step: "Are you sure?" + final confirm)
- Money-state pre-check: query for blocking conditions before
  showing final confirm
- New Edge Function: delete-account (runs as service_role)
  1. Money-state check (reject if active obligations exist)
  2. Stripe cleanup (needs stripe_customer_id and
     stripe_account_id from profiles — must run before
     anonymization nulls them)
  3. Cancel user's open jobs + auto-decline pending bids on them
  4. Anonymize profiles row (null PII fields + Stripe IDs)
  5. Rotate auth credentials + set banned_until
  6. Clean up: delete worker_skills, user_badges, notifications
  7. Return success
- RLS policy: user can only trigger deletion for own account
- Post-deletion: sign out, route to welcome screen

#### Idempotency

The Edge Function must be safely re-callable end-to-end if a
previous invocation failed partway. Each step is idempotent:

- **Money-state check**: read-only query, always safe.
- **Stripe cleanup**: catch `resource_missing` on
  customers.del (already deleted) and already-deactivated
  errors on accounts.update (capabilities already off).
  Continue to next step.
- **Cancel open jobs**: UPDATE with WHERE status = 'open' —
  re-running on already-cancelled jobs is a no-op (status !=
  'open' means zero rows affected).
- **Auto-decline bids**: UPDATE with WHERE status = 'pending' —
  re-running on already-declined bids is a no-op.
- **Anonymize profiles**: setting NULL fields to NULL is a
  no-op by construction.
- **Auth credential rotation**: re-rotating is safe — a new
  random password overwrites the previous random password.
  banned_until is set to the same fixed date each time.
- **Cleanup deletes** (worker_skills, user_badges,
  notifications): DELETE WHERE user_id = X on an empty table
  deletes zero rows.

If the function crashes mid-way, the user retries from the
client. Partial state (e.g., Stripe cleaned up but profile not
yet anonymized) resolves on the second call.

Status: ⏳

### G-2: Privacy Policy — webpage + in-app link

Apple Guideline 5.1.1(i) — must be accessible both in App Store
Connect metadata AND within the app itself.

Scope:
- Paata writes Privacy Policy content (legal copy)
- Host as a page on xprohub.com (Cloudflare Pages, /privacy)
- Add link to signup.tsx (below signup form, before submit button)
- Add link to settings/legal screen (accessible from profile)
- Add Privacy Policy URL to App Store Connect metadata field

Status: ⏳

### G-3: Terms of Service — webpage + in-app link

Recommended for all marketplace apps handling payments and
connecting users for real-world services.

Scope:
- Paata writes Terms of Service content (legal copy)
- Host as a page on xprohub.com (Cloudflare Pages, /terms)
- Add link to signup.tsx (paired with Privacy Policy link)
- Add "By signing up, you agree to our Terms of Service and
  Privacy Policy" text with tappable links on signup screen
- Add link to settings/legal screen

Status: ⏳

### G-4: User reporting mechanism

Apple Guideline 1.2 — apps with user-generated content must
provide a mechanism to report offensive content with timely
responses.

Scope:
- New database table: reports (reporter_id, reported_user_id,
  reported_content_type, reported_content_id, reason, status,
  created_at). Include GRANT statements per Supabase Data API
  requirement (POLISH_PASS.md, 2026-05-13 entry).
- Report button on: user profiles (worker cards), job posts
  (job-detail.tsx), chat messages (job-chat.tsx), reviews
- Report flow: tap report → select reason (dropdown or radio)
  → submit → confirmation toast
- RLS: authenticated users can INSERT reports; only service_role
  can read/update (admin review)
- Published contact info: support email (hello@xprohub.com)
  visible in settings/about screen

Status: ⏳

### G-5: User blocking feature

Apple Guideline 1.2 — apps connecting users must provide ability
to block abusive users.

Scope:
- New database table: user_blocks (blocker_id, blocked_id,
  created_at). Include GRANT statements.
- Block button on user profiles and in chat
- Blocked users: hidden from Live Market feeds, cannot apply to
  blocker's jobs, cannot message blocker
- RLS: filter blocked users from all relevant queries
- Unblock option in settings

Status: ⏳

### G-6: Content moderation approach

Apple Guideline 1.2 — apps must include a method for filtering
objectionable material from being posted.

#### Locked Decision: reactive-only moderation

Moderation is report-driven via G-4, with hello@xprohub.com as
the published contact and a 24-hour response SLA. No proactive
keyword/profanity filtering at v1.

Rationale: At pre-launch volume, proactive filtering adds
complexity for minimal benefit. Apple accepts reactive moderation
for marketplace apps when (a) a report mechanism exists, (b) a
block mechanism exists, (c) a published moderation contact
exists, (d) response time is stated in App Store review notes.
All four are satisfied by G-4 + G-5 + G-6.

#### App Store review note (for submission)

XProHub uses a reactive content moderation model. Users can
report any user, job post, chat message, or review via the
in-app report mechanism (overflow menu on each surface). Reports
are sent to hello@xprohub.com and reviewed within 24 hours.
Confirmed violations result in content removal and/or user
account termination. Users can also block other users to remove
them from their feeds and prevent further interaction.

#### Future consideration

Reviews are the first candidate for proactive filtering once
volume scales — they are public and permanent, unlike chat
(private) and jobs (ephemeral after 7-day expiry). When review
volume exceeds what hello@xprohub.com can review within SLA,
add server-side text filtering on review INSERT.

Status: ✅ Locked 2026-05-15 (reactive-only for v1)

### G-7: Stub screen cleanup

Apple Guideline 4.0 — Design: apps must have minimum
functionality. Stub screens with placeholder text trigger
"incomplete functionality" rejection.

Scope — decide per screen:
- match.tsx (23 lines, stub) — ✅ unregistered
- chat.tsx (22 lines, stub) — ✅ unregistered; real chat is job-chat.tsx
- payment.tsx (23 lines, stub) — ✅ unregistered; real screen is payment-setup.tsx
- belt.tsx (23 lines, stub) — ✅ unregistered
- earnings.tsx (23 lines, stub) — ✅ unregistered
- notifications.tsx (22 lines, stub) — ✅ unregistered

Approach taken: removed Tabs.Screen registrations from
app/(tabs)/_layout.tsx. Source .tsx files retained as templates
for future builds. Without registrations, screens lose the Dark
Gold header treatment and are not discoverable via normal UI
navigation. Caveat: Expo Router file-based auto-discovery may
still create routes for the underlying .tsx files; if iPhone
testing reveals they're reachable via direct URL, escalate to
href: null on individual entries. direct-hire.tsx stays
registered — wired from market.tsx:444 (Workers Feed tap).

Status: ✅ Shipped 2026-05-15 (commit `7dc8112`)

### G-8: Privacy nutrition labels in App Store Connect

Paper work, not code. Declare data collection categories in App
Store Connect based on audit findings.

#### Locked Declarations

Categories to declare in App Store Connect:
- Contact Info: Name, Email, Phone Number, Physical Address
- Financial Info: Payment Info (via Stripe — collected and
  processed by third party, not stored by XProHub)
- User Content: Photos (avatars, ID), Other User Content (jobs,
  reviews, chat messages)
- Identifiers: User ID
- Diagnostics: Crash Data (Expo default)

Purpose for all: App Functionality

Do NOT declare:
- Location (PostGIS is server-side only; no device GPS access)
- Third-Party Advertising
- Tracking (NSPrivacyTracking = false; no cross-app tracking)

Phone Number and Physical Address corrections from G-8
investigation 2026-05-15: profiles.phone (optional) and
profiles.location_address/neighborhood/city/state are
user-entered. Not "Precise Location" (no device GPS) — declared
under Contact Info as Physical Address.

#### Sentry contingency

If Sentry is added pre-launch (chat-Claude priority #1
recommendation), configure with sendDefaultPii: false and IP
scrubbing enabled. Add "Performance Data" to Diagnostics if
Sentry Performance is enabled. Sentry's PrivacyInfo.xcprivacy
will need redeclaration in app.json (same pattern as Stripe).

Status: ✅ Locked 2026-05-15 (declarations finalized; declare
in App Store Connect during G-9)

### G-9: Pre-submission checklist verification

Final verification pass before first App Store submission.

Checklist:
- [ ] Account deletion works end-to-end
- [ ] Privacy Policy URL live and accessible
- [ ] Privacy Policy linked in-app (signup + settings)
- [ ] Terms of Service URL live and accessible
- [ ] Terms of Service linked in-app (signup + settings)
- [ ] Report mechanism works on profiles, jobs, chat, reviews
- [ ] Block mechanism works, filters blocked users from feeds
- [ ] All reachable screens show useful content (no stubs)
- [ ] Privacy nutrition labels declared in App Store Connect
- [ ] app.json privacyManifests present and accurate
- [ ] NSPhotoLibraryUsageDescription present
- [ ] Demo account created with test data for Apple reviewer
- [ ] App Store Connect metadata complete (screenshots,
      description, support URL, privacy URL)
- [ ] iPad rendering spot-checked (compatibility mode)
- [ ] EAS production build profile configured
- [ ] Bundle ID finalized (com.paatatsk.xprohub or xprohubv3)
- [ ] hello@xprohub.com routes to Paata's inbox
- [ ] Stripe webhook destination subscription matches handler code:
      verify the Stripe Dashboard endpoint subscribes to all events
      the stripe-webhook/index.ts handler has case branches for
      (currently 4 events). Re-verify whenever a new Stripe endpoint
      is created (e.g., production mode).

Status: ⏳

---

## Already Completed (pre-Chunk G)

Two items from the 2026-05-14 audit were fixed immediately
because they required only app.json configuration changes:

1. **NSPhotoLibraryUsageDescription** — added to
   expo.ios.infoPlist. App uses expo-image-picker in
   profile-setup.tsx and id.tsx without declaring the permission.

2. **Privacy manifests** — expo.ios.privacyManifests added with
   4 Required Reason API categories: UserDefaults (CA92.1),
   FileTimestamp (C617.1, 3B52.1), SystemBootTime (35F9.1),
   DiskSpace (E174.1). Derived from inspection of
   PrivacyInfo.xcprivacy files across React Native core,
   expo-constants, expo-file-system, and Stripe iOS SDK.

Both take effect at next EAS iOS build. No rebuild needed for
current development.

---

## Not Required (confirmed by audit)

- **Apple In-App Purchase** — prohibited for real-world services
  (Guideline 3.1.3(e)). Stripe is the required approach.
- **Sign in with Apple** — only triggered when app offers other
  social login. XProHub uses email/password only.
- **App Tracking Transparency** — no cross-app tracking.
- **NSCameraUsageDescription** — app uses photo library picker
  only (expo-image-picker launchImageLibraryAsync), never camera.
- **NSLocationWhenInUseUsageDescription** — PostGIS is
  server-side. Device GPS not accessed. (Add if expo-location is
  ever introduced.)

---

## Notes

- Audit conducted 2026-05-14 via Claude Code consultation. Two
  research agents ran in parallel: one fetched Apple Review
  Guidelines (Sections 3.1.3, 5.1.1, 1.2, 4.0), Stripe iOS
  docs, and Expo privacy manifest docs; the other audited the
  codebase for every compliance item.
- Apple does not publish rejection statistics, but account
  deletion (5.1.1(v)), privacy policy (5.1.1(i)), and content
  moderation (1.2) are widely reported as the top 3 rejection
  reasons for marketplace apps.
- Stripe iOS SDK (v24.19.x via @stripe/stripe-react-native
  0.50.3) bundles its own PrivacyInfo.xcprivacy since v23.26.0.
  App-level manifest redeclares the same codes because Apple
  does not reliably parse CocoaPods static dependency manifests
  (per Expo documentation).
- G-1 (account deletion) is the largest item. G-2 and G-3 are
  blocked on Paata writing legal copy. G-4 through G-6 are
  standard CRUD features. G-7 is routing/navigation cleanup.
  G-8 is App Store Connect configuration. G-9 is verification.
- Chunk G is sequenced after Chunks D and E. The compliance
  items do not depend on payment flow completion, but building
  them now would context-switch away from the active payment
  milestone. Exception: if a fast EAS build is needed for
  TestFlight testing, G-7 (stub cleanup) may need to move
  earlier.
