# C-4a Design — stripe-connect.tsx Screen

Captured: 2026-05-02
Status: Design complete — implementation pending.

---

## 1. Overview

C-4a covers the `stripe-connect.tsx` screen, the `useStripeStatus`
hook, the deep link redirect infrastructure, and the `BackButton`
prop modification. Together these enable the Stripe Express account
setup flow — the path a worker takes from "no payout account" to
"fully verified and ready to earn."

This document is the implementation spec. Next session builds against
it directly. No architectural questions remain open in C-4a scope;
all decisions are locked below.

---

## 2. Scope Split

**C-4a (this doc):**
- `hooks/useStripeStatus.ts` — hook that reads Stripe state columns
  from `profiles` and derives a screen state enum
- `app/(tabs)/stripe-connect.tsx` — the four-state setup screen
- `app/stripe-return.tsx` — deep link redirect (one-liner)
- `app/stripe-refresh.tsx` — deep link redirect (one-liner)
- `app/(tabs)/_layout.tsx` — add `stripe-connect` route entry
- `app/_layout.tsx` — register `stripe-return` and `stripe-refresh`
  routes in the root Stack
- `app/(tabs)/_layout.tsx` (BackButton) — add optional `returnTo`
  prop with default `'/(tabs)'`

**C-4b (separate doc, later session):**
- `app/(tabs)/apply.tsx` — replace the existing trust-level gate
  check with the two-component apply gate (ID check + Stripe
  Express check) specified in CHUNK_C_DESIGN.md

C-4b is a separate deliverable. The stripe-connect screen must be
built and tested before C-4b wires the gate to it.

---

## 3. Prerequisites

Execute in order before writing any C-4a screen or hook code.

**Prerequisite 1 — C-3.1 Edge Function fix**

`supabase/functions/create-onboarding-link/index.ts`:

```ts
// Change:
const RETURN_URL  = 'xprohub://stripe-return'
const REFRESH_URL = 'xprohub://stripe-refresh'

// To:
const RETURN_URL  = 'xprohub://stripe-return'
const REFRESH_URL = 'xprohub://stripe-refresh'
```

Deploy after editing. Commit as:
`fix: Step 13 C-3.1 — correct deep link scheme in create-onboarding-link`

**Prerequisite 2 — superseded 2026-05-02**

The original prerequisite called for find/replace `xprohub://` →
`xprohubv3://` in `docs/CHUNK_C_DESIGN.md`. Superseded when the
project rename direction was reversed: tonight's Phase 1 of the
xprohubv3 → xprohub rename made all `xprohub://` references in
the C-1 design doc already correct. No action needed on this doc.
See POLISH_PASS.md "Project rename" entry for full rename context.

The source of truth for the app scheme is `app.json`:
`"scheme": "xprohub"`. The bundle ID is currently
`com.paatatsk.xprohubv3`, scheduled for rename to
`com.paatatsk.xprohub` in Phase 2 of the project rename
(see POLISH_PASS.md). Until Phase 2 ships, scheme and bundle ID
intentionally do not match — this is documented temporary
asymmetry, not drift.

**Prerequisite 3 — Install expo-linking**

```
npx expo install expo-linking
```

This is the first use of expo-linking in the codebase. The install
pins the SDK-compatible version. Required before any
`import * as Linking from 'expo-linking'` can be used.

**Prerequisite 4 — Verify profiles table columns**

In the Supabase dashboard, confirm these columns exist on `profiles`:

| Column                           | Status               |
|----------------------------------|----------------------|
| `stripe_account_id`              | Confirmed in CLAUDE.md |
| `stripe_charges_enabled`         | Verify before coding |
| `stripe_payouts_enabled`         | Verify before coding |
| `stripe_onboarding_completed_at` | Verify before coding |

If any of the last three are missing, write and run a migration
before proceeding. The hook will silently return `null` for missing
columns and every user will appear as `NOT_STARTED`. Do not skip
this check.

**Prerequisite 5 — Verify theme constants**

`constants/theme.ts` already has both required values (verified
2026-05-02):
- `Colors.green: '#4CAF7A'` — success / verified states
- `Colors.red:   '#E05252'` — errors

No code change needed. Verification only.

**Font note:** `Fonts.heading` in `constants/theme.ts` is
`'SpaceGrotesk-Bold'`, not Oswald. Prior design documents reference
Oswald based on `CLAUDE.md`, but the working codebase uses
SpaceGrotesk. Heading styles in C-4a must use `fontFamily: Fonts.heading`
to stay consistent with the rest of the app. The discrepancy is
tracked in POLISH_PASS.md under Documentation Hygiene.

---

## 4. Architectural Decisions (Locked)

| Decision | Choice |
|---|---|
| Screen location | `app/(tabs)/stripe-connect.tsx` |
| Route group | `(tabs)` — registered in `(tabs)/_layout.tsx` |
| State source | `hooks/useStripeStatus.ts` — reads `profiles` via Supabase |
| State management | Plain `useState` — no Zustand, Context, or Redux |
| Deep link approach | Option B — redirect routes `app/stripe-return.tsx` / `app/stripe-refresh.tsx` |
| BackButton | Modified with optional `returnTo` prop, default `'/(tabs)'` |
| Back navigation | `returnTo` param passed in URL from calling screen |
| Deep link scheme | `xprohub://` — matches `app.json` `"scheme"` field |
| Visual style | Dark Gold system — single-file screen, inline StyleSheet at bottom |

**Why Option B for deep links:** Deterministic. No Expo Router
version-specific URL interception behavior to debug. A route that
immediately redirects is a standard pattern. Option A (useURL hook
interception) and Option C (linking filter config) are noted as
future alternatives if Option B proves limiting.

---

## 5. Hook Interface

**File:** `hooks/useStripeStatus.ts`
**Model:** `hooks/useTrustLevel.ts` (exact same structure)

### StripeStatus enum

```ts
export enum StripeStatus {
  NOT_STARTED    = 'not_started',
  IN_PROGRESS    = 'in_progress',
  CHARGES_ACTIVE = 'charges_active',
  FULLY_VERIFIED = 'fully_verified',
}
```

### Return shape

```ts
{
  stripeAccountId:       string | null
  chargesEnabled:        boolean
  payoutsEnabled:        boolean
  onboardingCompletedAt: string | null   // for analytics; not used in state derivation
  derivedState:          StripeStatus | null  // null during initial load only
  loading:               boolean
  error:                 string | null
  refresh:               () => Promise<void>
}
```

`derivedState` is `null` only while `loading` is true. The screen
uses `null` to distinguish "still fetching" from "definitively
NOT_STARTED" — prevents State 1 UI flashing before the fetch
resolves.

### State derivation logic

Evaluated in priority order. `onboarding_completed_at` is NOT
used — Stripe's `charges_enabled` and `payouts_enabled` flags are
the authoritative source of account state.

```
1. stripe_account_id IS NULL
   → NOT_STARTED

2. stripe_account_id IS NOT NULL
   AND charges_enabled = true
   AND payouts_enabled = true
   → FULLY_VERIFIED

3. stripe_account_id IS NOT NULL
   AND charges_enabled = true
   AND payouts_enabled = false
   → CHARGES_ACTIVE

4. stripe_account_id IS NOT NULL
   AND charges_enabled = false (or null)
   → IN_PROGRESS
```

**Edge case handled by priority order:** If `stripe_account_id`
is set and `onboarding_completed_at` is null but `charges_enabled`
is true (webhook fired before timestamp was written), the derivation
reaches rule 2 or 3 before any timestamp check. The correct state
is shown.

### refresh() behavior

- Does NOT set `loading = true` on call. Silent background re-fetch.
  Avoids full-screen spinner flash when called after deep link return.
- Returns `Promise<void>` — caller can `await refresh()` if it needs
  to act after the fetch resolves.
- Clears `error` before re-fetching so the screen exits error state
  on retry.

### Error handling

- Auth error (no user): `error = 'Session expired. Please sign in again.'`
- DB query error: `error = 'Unable to load account status. Please try again.'`
- Other fields retain their last known values on error.
- `useTrustLevel` silently ignores errors; `useStripeStatus` surfaces
  them because this screen is transactional.

### Fetch trigger

`useEffect` on mount only — same as `useTrustLevel`. No auth state
subscription. The screen is only reachable when authenticated; if
the session expires, the next Supabase call fails and surfaces via
`error`.

### Full hook structure

```ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export enum StripeStatus {
  NOT_STARTED    = 'not_started',
  IN_PROGRESS    = 'in_progress',
  CHARGES_ACTIVE = 'charges_active',
  FULLY_VERIFIED = 'fully_verified',
}

function deriveState(
  accountId: string | null,
  charges:   boolean,
  payouts:   boolean,
): StripeStatus {
  if (!accountId)          return StripeStatus.NOT_STARTED;
  if (charges && payouts)  return StripeStatus.FULLY_VERIFIED;
  if (charges && !payouts) return StripeStatus.CHARGES_ACTIVE;
  return StripeStatus.IN_PROGRESS;
}

export function useStripeStatus() {
  const [stripeAccountId,       setStripeAccountId]       = useState<string | null>(null);
  const [chargesEnabled,        setChargesEnabled]        = useState(false);
  const [payoutsEnabled,        setPayoutsEnabled]        = useState(false);
  const [onboardingCompletedAt, setOnboardingCompletedAt] = useState<string | null>(null);
  const [derivedState,          setDerivedState]          = useState<StripeStatus | null>(null);
  const [loading,               setLoading]               = useState(true);
  const [error,                 setError]                 = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Session expired. Please sign in again.');
      setLoading(false);
      return;
    }
    const { data, error: dbError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_completed_at')
      .eq('id', user.id)
      .single();
    if (dbError || !data) {
      setError('Unable to load account status. Please try again.');
      setLoading(false);
      return;
    }
    setStripeAccountId(data.stripe_account_id ?? null);
    setChargesEnabled(data.stripe_charges_enabled ?? false);
    setPayoutsEnabled(data.stripe_payouts_enabled ?? false);
    setOnboardingCompletedAt(data.stripe_onboarding_completed_at ?? null);
    setDerivedState(deriveState(
      data.stripe_account_id,
      data.stripe_charges_enabled ?? false,
      data.stripe_payouts_enabled ?? false,
    ));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    stripeAccountId, chargesEnabled, payoutsEnabled, onboardingCompletedAt,
    derivedState, loading, error,
    refresh: fetch,
  };
}
```

---

## 6. Screen State Machine

All four states are defined by `derivedState`. Strings are stored
in lookup objects at the top of the screen file (not inline in JSX).

---

### NOT_STARTED

**Condition:** `stripe_account_id IS NULL`

```
Eyebrow:  GET PAID SETUP
Heading:  UNLOCK YOUR EARNINGS
Body:     Connect your bank account and you're ready to earn on
          any job on XProHub. Takes about 2 minutes. Stripe handles
          all the secure verification — we never see your bank details.
Badge:    (none)
Dots:     ○ ○ ○  (empty — gold border on each dot)
CTA:      GET VERIFIED →   gold filled, full width
Card:     Gold glow — borderColor: Colors.gold,
          backgroundColor: Colors.gold + '1A'
```

---

### IN_PROGRESS

**Condition:** `stripe_account_id IS NOT NULL`, charges not yet enabled.
Covers two sub-cases: user exited the Stripe form early, or user
finished and the `account.updated` webhook hasn't fired yet. Both
map to the same UI.

```
Eyebrow:  VERIFICATION IN PROGRESS
Heading:  ALMOST DONE
Body:     Your account is being reviewed. This usually takes a few
          minutes. If you stepped away before finishing, tap below
          to pick up where you left off.
Badge:    IN PROGRESS   (gold border, gold text)
Dots:     ● ○ ○  (first dot filled gold)
CTA:      CONTINUE SETUP →   outlined gold (borderWidth 1.5), full width
Card:     Standard — borderColor: Colors.border
          (gold glow removed — the user is in motion, not blocked)
```

---

### CHARGES_ACTIVE

**Condition:** `charges_enabled = true`, `payouts_enabled = false`

```
Eyebrow:  ALMOST THERE
Heading:  VERIFIED — PAYOUTS PENDING
Body:     You're verified and ready to earn. Your bank account is
          being confirmed — payouts usually go live within 1–2
          business days. Nothing you need to do.
Badge:    CHARGES ACTIVE   (green border, green text)
Dots:     ● ● ○  (first two filled gold, third outline)
CTA:      (none — informational state only)
Card:     Standard — borderColor: Colors.border
```

---

### FULLY_VERIFIED

**Condition:** `charges_enabled = true`, `payouts_enabled = true`

```
Eyebrow:  PAYMENT ACCOUNT
Heading:  YOU'RE ALL SET
Body:     Your earnings are deposited directly to your bank after
          each completed job. XProHub's platform fee is deducted
          automatically — you'll see the breakdown after each job.
Badge:    VERIFIED   (green border, green text)
Dots:     ● ● ●  (all three filled green — color shifts from gold
          to Colors.green to signal completion, not just progress)
CTA:      CONTINUE TO APPLICATION →   (gold filled, full width)
          ONLY shown when returnTo param is set — i.e., user came
          from the apply gate.
          When returnTo is not set (sign-up path), no button shown.
Card:     Standard — borderColor: Colors.border
```

`CONTINUE TO APPLICATION` calls
`router.replace(decodeURIComponent(returnTo) as any)`.

---

## 7. Button-Press Flows

### State 1 — GET VERIFIED (two-call flow)

```
1. Press GET VERIFIED
2. ctaLoading = true, ctaError = null
   (button: ActivityIndicator, disabled)
3. supabase.functions.invoke('create-stripe-account', { body: {} })
   C-2 extracts user_id from JWT — body is empty
4. On C-2 success → { stripe_account_id }
5. supabase.functions.invoke('create-onboarding-link', { body: {} })
   C-3 reads stripe_account_id from DB — body is empty
6. On C-3 success → { url }
7. ctaLoading = false          ← BEFORE openURL
8. Linking.openURL(url)
   App goes to background. User fills out Stripe form.
```

Loading is cleared before `openURL` because once the app
backgrounds, state setters may not reliably fire. The button
must be interactive when the user returns.

**Error paths:**

| Scenario | User-facing message | State after |
|---|---|---|
| C-2 network / timeout | "We couldn't connect right now. Check your connection and try again." | Button returns to GET VERIFIED. Nothing written. Retry immediately. |
| C-2 returns 401 | "Your session has expired. Please sign in again." | Same — different message because action is different (re-auth). |
| C-2 returns 502 / Stripe error | "We couldn't connect right now. Check your connection and try again." | Same as network error. Don't expose 502 to user. |
| C-3 fails after C-2 succeeded | "Account created — we couldn't open the setup form. Please try again in a moment." | Call `refresh()`. Screen re-renders to State 2. CONTINUE SETUP handles recovery. |
| Linking.openURL fails | "We couldn't open the setup page. Please try again." | ctaLoading = false. Retry available. |

Non-401 C-2 failures share one message. The user's action (check
connection, retry) is the same regardless of whether the network
is down or Stripe's API is down.

---

### State 2 — CONTINUE SETUP (single-call flow)

```
1. Press CONTINUE SETUP
2. ctaLoading = true, ctaError = null
3. supabase.functions.invoke('create-onboarding-link', { body: {} })
4. On success → { url }
5. ctaLoading = false
6. Linking.openURL(url)
```

Stripe Account Links expire after ~5–10 minutes — always generate
fresh on tap, never cache the URL.

**Error paths:**

| Scenario | User-facing message |
|---|---|
| Network / timeout | "We couldn't connect right now. Check your connection and try again." |
| 401 | "Your session has expired. Please sign in again." |
| 400 (no stripe_account_id in DB) | "Something went wrong with your account. Please contact support@xprohub.com." — data inconsistency; should not occur in State 2 but handle explicitly. |
| 502 | "We couldn't connect right now. Check your connection and try again." |

---

### State 3 — No CTA

CHARGES_ACTIVE is informational only. There is no button. Payouts-
pending status is resolved by Stripe on their end (typically bank
micro-deposit verification via email). No in-app action is available
or needed.

---

## 8. Deep Link Routing

**Approach: Option B — redirect routes**

Two new files at the app root intercept the deep link URLs and
redirect immediately to `stripe-connect`. Expo Router handles them
as ordinary routes — no URL interception, no version-specific
behavior.

When Stripe navigates to `xprohub://stripe-return`, the OS
activates the app at path `/stripe-return`. Without a route, Expo
Router would render an unmatched-route error. These files prevent
that.

Both files must be registered in the root `app/_layout.tsx` Stack
(see below).

---

### app/stripe-return.tsx

```tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function StripeReturn() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/stripe-connect' as any);
  }, []);
  return null;
}
```

On mount: redirects immediately to stripe-connect. The screen
renders nothing — no flash, no layout. `replace` removes
`stripe-return` from the stack.

**Known limitation:** `returnTo` is not preserved through this
redirect. The Stripe Edge Function hardcodes `xprohub://stripe-return`
as the return URL with no query params, so the original `returnTo`
value cannot be included. After Stripe setup completes, the user
lands on stripe-connect without a job context. The CONTINUE TO
APPLICATION button (State 4) does not appear. The user navigates
back to Live Market and re-taps Apply — the gate now passes and
the apply form loads directly.

Future improvement: before calling `Linking.openURL(url)`, persist
`returnTo` to AsyncStorage. On `stripe-return.tsx` redirect, read
and pass it through to stripe-connect. Out of scope for C-4a.

---

### app/stripe-refresh.tsx

Stripe fires `stripe-refresh` when the Account Link URL expires
before the user finishes the form. The app should generate a new
link and reopen the Stripe browser.

```tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function StripeRefresh() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/stripe-connect' as any);
  }, []);
  return null;
}
```

Identical to `stripe-return.tsx`. The user lands back on
stripe-connect in State 2 with CONTINUE SETUP available. Tapping
it generates a fresh Account Link. No separate code path needed —
State 2's button handler is the recovery mechanism.

**stripe-return vs stripe-refresh:**
- `stripe-return`: fires when user completes OR abandons the Stripe
  form. Always fires on normal exit.
- `stripe-refresh`: fires only when the Account Link URL expires
  before the user even opens it — not on abandonment.

---

### Root Stack registration

In `app/_layout.tsx`, add two `<Stack.Screen>` entries:

```tsx
<Stack initialRouteName="splash" screenOptions={{ headerShown: false }}>
  <Stack.Screen name="splash" />
  <Stack.Screen name="(auth)" />
  <Stack.Screen name="(onboarding)" />
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="job/[id]" />
  <Stack.Screen name="stripe-return"  options={{ headerShown: false }} />
  <Stack.Screen name="stripe-refresh" options={{ headerShown: false }} />
</Stack>
```

`headerShown: false` prevents a header flash during the
instant redirect.

---

## 9. BackButton Modification

BackButton is a local function defined inside `app/(tabs)/_layout.tsx`.
It is not imported by any other file. The change is entirely
self-contained within that file.

### Signature change

```tsx
// Before:
function BackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push('/(tabs)')} style={{ paddingLeft: 16 }}>
      <Text style={{ color: Colors.gold, fontSize: 22 }}>‹</Text>
    </TouchableOpacity>
  );
}

// After:
function BackButton({ returnTo = '/(tabs)' }: { returnTo?: string }) {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push(returnTo as any)} style={{ paddingLeft: 16 }}>
      <Text style={{ color: Colors.gold, fontSize: 22 }}>‹</Text>
    </TouchableOpacity>
  );
}
```

Default `returnTo = '/(tabs)'` preserves existing behavior for
all screens that call `<BackButton />` with no props. Zero
breaking changes.

### stripe-connect Tabs.Screen entry

```tsx
<Tabs.Screen
  name="stripe-connect"
  options={({ route }) => ({
    ...headerDefaults,
    headerShown: true,
    title: 'GET PAID',
    headerLeft: () => (
      <BackButton returnTo={(route.params as any)?.returnTo ?? '/(tabs)'} />
    ),
  })}
/>
```

The `options` function form receives `{ route, navigation }` and
returns options for that screen. Reading `route.params.returnTo`
dynamically is standard React Navigation / Expo Router.

### Navigation pattern from apply.tsx (C-4b, for reference)

When the Stripe gate fires in apply.tsx:

```ts
router.push(
  `/(tabs)/stripe-connect?returnTo=${encodeURIComponent(
    `/(tabs)/apply?job_id=${job_id}`
  )}` as any
)
```

In `stripe-connect.tsx`, read and decode the param:

```ts
const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
const destination = returnTo ? decodeURIComponent(returnTo) : '/(tabs)';
```

`destination` is used for the CONTINUE TO APPLICATION button in
State 4: `router.replace(destination as any)`.

---

## 10. Visual Structure

### Layout

No `KeyboardAvoidingView` — this screen has no text inputs.

```tsx
<SafeAreaView style={styles.container} edges={['top', 'bottom']}>
  <ScrollView contentContainerStyle={styles.scroll}>

    {/* ── Initial load ── */}
    {loading && (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    )}

    {/* ── Hook-level error ── */}
    {!loading && error && (
      <View style={styles.center}>
        <Text style={styles.fetchError}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refresh} activeOpacity={0.8}>
          <Text style={styles.retryBtnText}>TRY AGAIN</Text>
        </TouchableOpacity>
      </View>
    )}

    {/* ── Main state card ── */}
    {!loading && !error && derivedState !== null && (
      <View style={[
        styles.card,
        derivedState === StripeStatus.NOT_STARTED && styles.cardGlow,
      ]}>

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, dotStyle(derivedState, 0)]} />
          <View style={[styles.dot, dotStyle(derivedState, 1)]} />
          <View style={[styles.dot, dotStyle(derivedState, 2)]} />
        </View>
        <View style={styles.dotsLabels}>
          <Text style={styles.dotLabel}>Account</Text>
          <Text style={styles.dotLabel}>Verified</Text>
          <Text style={styles.dotLabel}>Payouts</Text>
        </View>

        {/* Eyebrow */}
        <Text style={styles.eyebrow}>{EYEBROW[derivedState]}</Text>

        {/* Heading */}
        <Text style={styles.heading}>{HEADING[derivedState]}</Text>

        {/* Body */}
        <Text style={styles.body}>{BODY[derivedState]}</Text>

        {/* Status badge — hidden for NOT_STARTED */}
        {derivedState !== StripeStatus.NOT_STARTED && (
          <View style={[styles.badge, badgeBorderStyle(derivedState)]}>
            <Text style={[styles.badgeText, badgeTextColor(derivedState)]}>
              {BADGE[derivedState]}
            </Text>
          </View>
        )}

        {/* CTA error */}
        {ctaError ? <Text style={styles.ctaError}>{ctaError}</Text> : null}

        {/* CTA — NOT_STARTED */}
        {derivedState === StripeStatus.NOT_STARTED && (
          <TouchableOpacity
            style={[styles.primaryBtn, ctaLoading && styles.btnDisabled]}
            onPress={handleGetVerified}
            disabled={ctaLoading}
            activeOpacity={0.85}
          >
            {ctaLoading
              ? <ActivityIndicator color={Colors.background} />
              : <Text style={styles.primaryBtnText}>GET VERIFIED →</Text>}
          </TouchableOpacity>
        )}

        {/* CTA — IN_PROGRESS */}
        {derivedState === StripeStatus.IN_PROGRESS && (
          <TouchableOpacity
            style={[styles.outlineBtn, ctaLoading && styles.btnDisabled]}
            onPress={handleContinueSetup}
            disabled={ctaLoading}
            activeOpacity={0.85}
          >
            {ctaLoading
              ? <ActivityIndicator color={Colors.gold} />
              : <Text style={styles.outlineBtnText}>CONTINUE SETUP →</Text>}
          </TouchableOpacity>
        )}

        {/* CTA — FULLY_VERIFIED with returnTo only */}
        {derivedState === StripeStatus.FULLY_VERIFIED && returnTo && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace(destination as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>CONTINUE TO APPLICATION →</Text>
          </TouchableOpacity>
        )}

      </View>
    )}

  </ScrollView>
</SafeAreaView>
```

`dotStyle`, `badgeBorderStyle`, and `badgeTextColor` are small
inline helper functions — not StyleSheet entries — since their
output varies by state. Define them above the component.

`EYEBROW`, `HEADING`, `BODY`, `BADGE` are plain const objects
keyed by StripeStatus, defined above the component. All user-facing
strings in one place.

### StyleSheet entries

```ts
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  scroll:         { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16,
                    padding: Spacing.xl },

  // Main card
  card:           { backgroundColor: Colors.card, borderWidth: 1,
                    borderColor: Colors.border, borderRadius: Radius.md,
                    padding: Spacing.lg, gap: 14 },
  cardGlow:       { borderColor: Colors.gold,
                    backgroundColor: Colors.gold + '1A' },

  // Progress dots
  dotsRow:        { flexDirection: 'row', gap: 20, alignItems: 'center' },
  dotsLabels:     { flexDirection: 'row', gap: 8 },
  dot:            { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  dotLabel:       { color: Colors.textSecondary, fontSize: 10, flex: 1,
                    textAlign: 'center' },

  // Typography
  eyebrow:        { color: Colors.gold, fontSize: 11, fontWeight: '700',
                    letterSpacing: 3 },
  heading:        { color: Colors.gold, fontSize: 28, fontWeight: 'bold',
                    letterSpacing: 2, fontFamily: Fonts.heading },
  body:           { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },

  // Badge
  badge:          { borderWidth: 1.5, borderRadius: Radius.full,
                    paddingHorizontal: 9, paddingVertical: 3,
                    alignSelf: 'flex-start' },
  badgeText:      { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },

  // Buttons
  primaryBtn:     { backgroundColor: Colors.gold, borderRadius: Radius.md,
                    paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: Colors.background, fontWeight: 'bold', fontSize: 15,
                    letterSpacing: 1.5 },
  outlineBtn:     { borderWidth: 1.5, borderColor: Colors.gold,
                    borderRadius: Radius.full, paddingVertical: 12,
                    alignItems: 'center' },
  outlineBtnText: { color: Colors.gold, fontWeight: 'bold', fontSize: 14,
                    letterSpacing: 1.5 },
  btnDisabled:    { opacity: 0.5 },

  // Error states
  ctaError:       { color: Colors.red, fontSize: 13, textAlign: 'center' },
  fetchError:     { color: Colors.red, fontSize: 14, textAlign: 'center',
                    backgroundColor: '#2A1515', padding: Spacing.sm,
                    borderRadius: Radius.sm, borderWidth: 1,
                    borderColor: Colors.red },
  retryBtn:       { borderWidth: 1.5, borderColor: Colors.gold,
                    borderRadius: Radius.full, paddingVertical: 10,
                    paddingHorizontal: 28 },
  retryBtnText:   { color: Colors.gold, fontWeight: 'bold', fontSize: 13,
                    letterSpacing: 1.5 },
});
```

`dotStyle` helper (define above component):

```ts
function dotStyle(state: StripeStatus, index: number) {
  const filled = {
    [StripeStatus.NOT_STARTED]:    0,
    [StripeStatus.IN_PROGRESS]:    1,
    [StripeStatus.CHARGES_ACTIVE]: 2,
    [StripeStatus.FULLY_VERIFIED]: 3,
  }[state];
  const isGreen = state === StripeStatus.FULLY_VERIFIED;
  const color   = isGreen ? Colors.green : Colors.gold;
  if (index < filled) {
    return { backgroundColor: color, borderColor: color };
  }
  return { borderColor: Colors.gold };
}
```

---

## 11. Open Questions and Known Limitations

**returnTo not preserved through Stripe redirect (known limitation)**

When the user returns from Stripe via `xprohub://stripe-return`,
`stripe-return.tsx` redirects to `/(tabs)/stripe-connect` with no
params. The original `returnTo` value is lost because Stripe's
return URL is hardcoded without query params. State 4's CONTINUE
TO APPLICATION button will not appear after this flow.

The user can navigate back to Live Market and re-tap Apply. The
Stripe gate will now pass and the apply form loads directly. This
is a minor UX gap, not a blocking issue for MVP.

Future fix: persist `returnTo` to AsyncStorage before calling
`Linking.openURL(url)`, read and pass it through `stripe-return.tsx`
on return.

**Polling after deep link return (partially addressed)**

`useFocusEffect(refresh)` added in commit `2a8b947` — the screen
re-fetches profile state whenever it regains focus (e.g. returning
from Safari after Stripe form, or navigating back to the screen).
This covers the primary stale-state scenario.

Active polling (periodic refetch while on screen) remains a future
improvement (Polish Pass scope) for cases where the webhook fires
while the user is already viewing the screen.

**Stripe Dashboard link (deferred)**

States 3 and 4 in CHUNK_C_DESIGN.md show an optional "VIEW STRIPE
DASHBOARD" secondary link. This requires a fourth Edge Function
(`create-stripe-dashboard-link`). Deferred to Polish Pass — out
of scope for C-4a.

**C-4b dependency — partially resolved**

The Stripe gate (Check 2) is wired as of commit `c36ddb6`:
`apply.tsx` now uses `useStripeStatus` and routes to
`stripe-connect` with `returnTo` param when `!chargesEnabled`.
The old `useTrustLevel` / `verify-level-2` routing has been
replaced in apply.tsx.

Remaining: Check 1 (ID gate — photo + skill count) is not yet
wired. Task 4 will add it before the Stripe check. The full
two-component gate per CHUNK_C_DESIGN.md Section 4 requires
both checks in sequence.
