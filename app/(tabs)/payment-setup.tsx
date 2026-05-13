// app/(tabs)/payment-setup.tsx
// Screen: ADD PAYMENT METHOD — Customer-side card setup
// Two-state screen driven by usePaymentMethodStatus hook.
// Design spec: docs/CHUNK_D_DESIGN.md

import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { Colors, Fonts, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { usePaymentMethodStatus } from '../../hooks/usePaymentMethodStatus';

// ── Copy strings ─────────────────────────────────────────────

const COPY = {
  notAdded: {
    eyebrow:  'PAYMENT SETUP',
    heading:  'ADD A PAYMENT METHOD',
    body:     'Add a card to post jobs on XProHub. You\'re only charged when you hire. Stripe processes your card — we never see your details.',
  },
  added: {
    eyebrow:  'PAYMENT METHOD',
    heading:  'YOU\'RE ALL SET',
    body:     'Your payment method is on file. You\'re ready to post jobs and hire.',
    badge:    'CARD ADDED',
  },
  confirming: 'Confirming your card...',
  timeout:    'Your card was saved successfully. Confirmation is taking a moment.',
};

// ── Screen ───────────────────────────────────────────────────

export default function PaymentSetupScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const destination = returnTo ? decodeURIComponent(returnTo) : '/(tabs)';

  const {
    added, loading, error, refresh, startPolling,
  } = usePaymentMethodStatus();

  // Refetch on focus (e.g. returning from background)
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const [ctaLoading,  setCtaLoading]  = useState(false);
  const [ctaError,    setCtaError]    = useState<string | null>(null);
  const [confirming,  setConfirming]  = useState(false);
  const [timedOut,    setTimedOut]    = useState(false);

  // ── Handler: ADD CARD ──────────────────────────────────────

  const handleAddCard = useCallback(async () => {
    setCtaLoading(true);
    setCtaError(null);

    // Step 1: Call create-setup-intent Edge Function
    const { data, error: fnError } = await supabase.functions.invoke(
      'create-setup-intent',
      { body: {} },
    );

    if (fnError) {
      const msg = fnError.message?.includes('401')
        ? 'Your session has expired. Please sign in again.'
        : 'We couldn\'t connect right now. Check your connection and try again.';
      setCtaError(msg);
      setCtaLoading(false);
      return;
    }

    if (!data?.client_secret || !data?.ephemeral_key || !data?.customer_id) {
      setCtaError('We couldn\'t connect right now. Check your connection and try again.');
      setCtaLoading(false);
      return;
    }

    // Step 2: Initialize PaymentSheet
    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: 'XProHub',
      setupIntentClientSecret: data.client_secret,
      customerEphemeralKeySecret: data.ephemeral_key,
      customerId: data.customer_id,
      returnURL: 'xprohub://stripe-return',
    });

    if (initError) {
      setCtaError('We couldn\'t open the card form. Please try again.');
      setCtaLoading(false);
      return;
    }

    setCtaLoading(false);

    // Step 3: Present PaymentSheet
    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      // User cancelled — not an error, just return to idle
      if (presentError.code === 'Canceled') return;
      setCtaError('Something went wrong. Please try again.');
      return;
    }

    // Step 4: PaymentSheet success — poll for webhook confirmation
    setConfirming(true);
    const confirmed = await startPolling();

    if (!confirmed) {
      setConfirming(false);
      setTimedOut(true);
    }
  }, [startPolling]);

  // ── Render: initial load ───────────────────────────────────

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

  // Guard: added still null
  if (added === null) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: ADDED — show confirmation ──────────────────────

  if (added) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>{COPY.added.eyebrow}</Text>
            <Text style={styles.heading}>{COPY.added.heading}</Text>
            <Text style={styles.body}>{COPY.added.body}</Text>

            <View style={[styles.badge, { borderColor: Colors.green }]}>
              <Text style={[styles.badgeText, { color: Colors.green }]}>
                {COPY.added.badge}
              </Text>
            </View>

            {returnTo && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.replace(destination as Parameters<typeof router.replace>[0])}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>CONTINUE TO POST →</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Render: NOT_ADDED ──────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={[styles.card, !confirming && !timedOut && styles.cardGlow]}>

          {/* Eyebrow */}
          <Text style={styles.eyebrow}>{COPY.notAdded.eyebrow}</Text>

          {/* Heading */}
          <Text style={styles.heading}>{COPY.notAdded.heading}</Text>

          {/* Body — swaps for timeout state */}
          <Text style={styles.body}>
            {timedOut ? COPY.timeout : COPY.notAdded.body}
          </Text>

          {/* CTA error */}
          {ctaError ? <Text style={styles.ctaError}>{ctaError}</Text> : null}

          {/* Confirming state — spinner + message */}
          {confirming && (
            <View style={styles.confirmingRow}>
              <ActivityIndicator color={Colors.gold} />
              <Text style={styles.confirmingText}>{COPY.confirming}</Text>
            </View>
          )}

          {/* Timeout state — CHECK STATUS button */}
          {timedOut && !confirming && (
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={async () => {
                setTimedOut(false);
                await refresh();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.outlineBtnText}>CHECK STATUS</Text>
            </TouchableOpacity>
          )}

          {/* Idle state — ADD CARD CTA */}
          {!confirming && !timedOut && (
            <TouchableOpacity
              style={[styles.primaryBtn, ctaLoading && styles.btnDisabled]}
              onPress={handleAddCard}
              disabled={ctaLoading}
              activeOpacity={0.85}
            >
              {ctaLoading
                ? <ActivityIndicator color={Colors.background} />
                : <Text style={styles.primaryBtnText}>ADD CARD →</Text>}
            </TouchableOpacity>
          )}

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────

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

  // Confirming state
  confirmingRow:  { flexDirection: 'row', alignItems: 'center', gap: 10,
                    justifyContent: 'center', paddingVertical: 8 },
  confirmingText: { color: Colors.textSecondary, fontSize: 14 },

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
