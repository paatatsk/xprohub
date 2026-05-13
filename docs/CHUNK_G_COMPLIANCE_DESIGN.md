# XProHub — Chunk G Design: Launch Compliance

**Created:** 2026-05-14
**Author:** Paata Tskhadiashvili + chat-Claude
**Status:** Design complete — build deferred until after Chunks D and E ship

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

Scope:
- New settings/profile screen with "Delete My Account" option
- Confirmation flow (two-step: "Are you sure?" + final confirm)
- New Edge Function: delete-account
  - Delete Supabase auth user (admin API)
  - Delete or anonymize profiles row
  - If stripe_customer_id exists: delete Stripe Customer object
  - If stripe_account_id exists: delete Stripe Connected Account
  - Cascade: jobs, bids, messages, reviews authored by user
    (decide during build: hard delete vs anonymize per table)
- RLS policy: user can only trigger deletion for own account
- Post-deletion: sign out, route to welcome screen

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

Scope:
- Decision: reactive-only (via reports from G-4) vs proactive
  filtering (keyword/profanity filter on job posts, chat, reviews)
- If proactive: implement server-side text filter on job INSERT
  and message INSERT (Edge Function or Postgres trigger)
- If reactive-only: document in App Store review notes that
  moderation is report-driven with hello@xprohub.com response
  within 24 hours
- Recommendation: start reactive-only for v1 launch. Apple
  accepts report-driven moderation for marketplace apps at low
  volume. Proactive filtering adds complexity with diminishing
  returns pre-scale.

Status: ⏳

### G-7: Stub screen cleanup

Apple Guideline 4.0 — Design: apps must have minimum
functionality. Stub screens with placeholder text trigger
"incomplete functionality" rejection.

Scope — decide per screen:
- match.tsx (23 lines, stub) — hide from tab bar or "Coming Soon"
- chat.tsx (22 lines, stub) — hide; real chat is job-chat.tsx
- payment.tsx (23 lines, stub) — hide or redirect to
  payment-setup.tsx
- belt.tsx (23 lines, stub) — hide or "Coming Soon" state
- earnings.tsx (23 lines, stub) — hide or "Coming Soon" state
- notifications.tsx (22 lines, stub) — hide or "Coming Soon"

Decision criteria: if the screen is reachable from any navigation
path in the app, it must either show useful content or be removed
from navigation. Apple testers will find every reachable screen.

Status: ⏳

### G-8: Privacy nutrition labels in App Store Connect

Paper work, not code. Declare data collection categories in App
Store Connect based on audit findings.

Categories to declare:
- Contact Info: Name, Email
- Financial Info: Payment Info (via Stripe)
- Location: Precise Location (only if device GPS added before
  launch; currently PostGIS is server-side only)
- User Content: Photos, Other User Content (jobs, reviews, chat)
- Identifiers: User ID
- Diagnostics: Crash Data (Expo)

Purpose: App Functionality (primary), Product Personalization
(location matching, if applicable)

Do NOT declare: Third-Party Advertising, Tracking

Status: ⏳

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
