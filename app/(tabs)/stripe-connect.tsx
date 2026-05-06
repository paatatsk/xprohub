// app/(tabs)/stripe-connect.tsx
// Screen: GET PAID — Stripe Express account setup
// Four-state screen driven by useStripeStatus hook.
// Design spec: docs/CHUNK_C_C4_DESIGN.md

import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { Colors, Fonts, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useStripeStatus, StripeStatus } from '../../hooks/useStripeStatus';

// ── Copy strings — all user-facing text in one place ──────────

const EYEBROW: Record<StripeStatus, string> = {
  [StripeStatus.NOT_STARTED]:    'GET PAID SETUP',
  [StripeStatus.IN_PROGRESS]:    'VERIFICATION IN PROGRESS',
  [StripeStatus.CHARGES_ACTIVE]: 'ALMOST THERE',
  [StripeStatus.FULLY_VERIFIED]: 'PAYMENT ACCOUNT',
};

const HEADING: Record<StripeStatus, string> = {
  [StripeStatus.NOT_STARTED]:    'UNLOCK YOUR EARNINGS',
  [StripeStatus.IN_PROGRESS]:    'ALMOST DONE',
  [StripeStatus.CHARGES_ACTIVE]: 'VERIFIED — PAYOUTS PENDING',
  [StripeStatus.FULLY_VERIFIED]: "YOU'RE ALL SET",
};

const BODY: Record<StripeStatus, string> = {
  [StripeStatus.NOT_STARTED]:
    'Connect your bank account and you\'re ready to earn on any job on XProHub. Takes about 2 minutes. Stripe handles all the secure verification — we never see your bank details.',
  [StripeStatus.IN_PROGRESS]:
    'Your account is being reviewed. This usually takes a few minutes. If you stepped away before finishing, tap below to pick up where you left off.',
  [StripeStatus.CHARGES_ACTIVE]:
    'You\'re verified and ready to earn. Your bank account is being confirmed — payouts usually go live within 1–2 business days. Nothing you need to do.',
  [StripeStatus.FULLY_VERIFIED]:
    'Your earnings are deposited directly to your bank after each completed job. XProHub\'s platform fee is deducted automatically — you\'ll see the breakdown after each job.',
};

const BADGE: Record<StripeStatus, string> = {
  [StripeStatus.NOT_STARTED]:    '',
  [StripeStatus.IN_PROGRESS]:    'IN PROGRESS',
  [StripeStatus.CHARGES_ACTIVE]: 'CHARGES ACTIVE',
  [StripeStatus.FULLY_VERIFIED]: 'VERIFIED',
};

// ── Visual helpers (state-dependent, not static styles) ───────

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

function badgeBorderStyle(state: StripeStatus) {
  const isGreen = state === StripeStatus.CHARGES_ACTIVE || state === StripeStatus.FULLY_VERIFIED;
  return { borderColor: isGreen ? Colors.green : Colors.gold };
}

function badgeTextColor(state: StripeStatus) {
  const isGreen = state === StripeStatus.CHARGES_ACTIVE || state === StripeStatus.FULLY_VERIFIED;
  return { color: isGreen ? Colors.green : Colors.gold };
}

// ── Screen ────────────────────────────────────────────────────

export default function StripeConnectScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const destination = returnTo ? decodeURIComponent(returnTo) : '/(tabs)';

  const {
    derivedState, loading, error, refresh,
  } = useStripeStatus();

  // Refetch Stripe status when screen regains focus (e.g. returning from Safari)
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const [ctaLoading, setCtaLoading] = useState(false);
  const [ctaError, setCtaError]     = useState<string | null>(null);

  // ── Handler: State 1 — GET VERIFIED (two-call flow) ─────────

  const handleGetVerified = useCallback(async () => {
    setCtaLoading(true);
    setCtaError(null);

    // Step 1: Create Stripe Express account (C-2)
    const { data: accountData, error: accountError } = await supabase.functions.invoke(
      'create-stripe-account',
      { body: {} },
    );

    if (accountError) {
      const msg = accountError.message?.includes('401')
        ? 'Your session has expired. Please sign in again.'
        : 'We couldn\'t connect right now. Check your connection and try again.';
      setCtaError(msg);
      setCtaLoading(false);
      return;
    }

    if (!accountData?.stripe_account_id) {
      setCtaError('We couldn\'t connect right now. Check your connection and try again.');
      setCtaLoading(false);
      return;
    }

    // Step 2: Generate onboarding link (C-3)
    const { data: linkData, error: linkError } = await supabase.functions.invoke(
      'create-onboarding-link',
      { body: {} },
    );

    if (linkError || !linkData?.url) {
      // C-2 succeeded but C-3 failed — account exists, refresh to State 2
      await refresh();
      setCtaError('Account created — we couldn\'t open the setup form. Please try again in a moment.');
      setCtaLoading(false);
      return;
    }

    // Step 3: Open Stripe hosted form — clear loading BEFORE openURL
    setCtaLoading(false);

    try {
      await Linking.openURL(linkData.url);
    } catch {
      setCtaError('We couldn\'t open the setup page. Please try again.');
    }
  }, [refresh]);

  // ── Handler: State 2 — CONTINUE SETUP (single-call flow) ───

  const handleContinueSetup = useCallback(async () => {
    setCtaLoading(true);
    setCtaError(null);

    const { data, error: linkError } = await supabase.functions.invoke(
      'create-onboarding-link',
      { body: {} },
    );

    if (linkError || !data?.url) {
      const status = linkError?.message;
      let msg = 'We couldn\'t connect right now. Check your connection and try again.';
      if (status?.includes('401')) {
        msg = 'Your session has expired. Please sign in again.';
      } else if (status?.includes('400')) {
        msg = 'Something went wrong with your account. Please contact support@xprohub.com.';
      }
      setCtaError(msg);
      setCtaLoading(false);
      return;
    }

    setCtaLoading(false);

    try {
      await Linking.openURL(data.url);
    } catch {
      setCtaError('We couldn\'t open the setup page. Please try again.');
    }
  }, []);

  // ── Render ──────────────────────────────────────────────────

  // Initial load
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  // Hook-level error
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.fetchError}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Guard: derivedState still null (shouldn't happen after loading resolves)
  if (derivedState === null) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Main state card ── */}
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
              onPress={() => router.replace(destination as Parameters<typeof router.replace>[0])}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>CONTINUE TO APPLICATION →</Text>
            </TouchableOpacity>
          )}

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

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
