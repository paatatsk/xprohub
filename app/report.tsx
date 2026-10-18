// app/report.tsx
// Screen: REPORT — User/content reporting flow (G-4)
// Params: reported_user_id, content_type, content_id, reported_user_name

import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Radius, Spacing, whiteAlpha } from '../constants/theme';
import { supabase } from '../lib/supabase';

// ── Reason options ────────────────────────────────────────────────────────────

const REASONS: { code: string; label: string }[] = [
  { code: 'spam',          label: 'Spam' },
  { code: 'harassment',    label: 'Harassment' },
  { code: 'inappropriate', label: 'Inappropriate content' },
  { code: 'fraud',         label: 'Fraud or scam' },
  { code: 'safety',        label: 'Safety concern' },
  { code: 'other',         label: 'Other' },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ReportScreen() {
  const router = useRouter();
  const {
    reported_user_id,
    content_type,
    content_id,
    reported_user_name,
  } = useLocalSearchParams<{
    reported_user_id: string;
    content_type: string;
    content_id?: string;
    reported_user_name?: string;
  }>();

  const displayName = reported_user_name
    ? decodeURIComponent(reported_user_name)
    : 'User';

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails]               = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState<string | null>(null);

  // ── Submit handler ──────────────────────────────────────────

  async function handleSubmit() {
    if (submitting) return;

    if (!selectedReason) {
      setSubmitError('Please select a reason for your report.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitError('Session expired. Please sign in again.');
      setSubmitting(false);
      return;
    }

    const { error: insertErr } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_user_id,
        content_type: content_type ?? 'user',
        content_id: content_id || null,
        reason: selectedReason,
        details: details.trim() || null,
      });

    setSubmitting(false);

    if (insertErr) {
      if (insertErr.code === '23514') {
        setSubmitError("You can't report yourself.");
      } else {
        setSubmitError("Couldn't submit report. Tap Submit to try again.");
      }
      return;
    }

    // Success — offer to block
    Alert.alert(
      'Report Submitted',
      `Would you also like to block ${displayName}? They won't appear in your feeds.`,
      [
        {
          text: 'No thanks',
          style: 'cancel',
          onPress: () => router.back(),
        },
        {
          text: 'Block',
          onPress: async () => {
            const { error: blockErr } = await supabase
              .from('user_blocks')
              .insert({
                blocker_id: user.id,
                blocked_id: reported_user_id,
              });

            if (blockErr) {
              Alert.alert(
                'Block Failed',
                "Block didn't complete. You can try again from this user's profile.",
                [{ text: 'OK', onPress: () => router.back() }],
              );
            } else {
              router.back();
            }
          },
        },
      ],
    );
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={styles.eyebrow}>REPORT</Text>
        <Text style={styles.heading}>Reporting {displayName}</Text>
        <Text style={styles.sub}>
          Select a reason below. Your report will be reviewed within 24 hours.
        </Text>

        {/* Reason picker */}
        <View style={styles.reasonList}>
          {REASONS.map(({ code, label }) => {
            const isSelected = selectedReason === code;
            return (
              <TouchableOpacity
                key={code}
                style={[styles.reasonCard, isSelected && styles.reasonCardActive]}
                onPress={() => { setSelectedReason(code); setSubmitError(null); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.reasonText, isSelected && styles.reasonTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Details textarea */}
        <Text style={styles.detailsLabel}>
          Additional details <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.detailsInput}
          placeholder="Describe what happened..."
          placeholderTextColor={Colors.textSecondary}
          value={details}
          onChangeText={t => setDetails(t)}
          multiline
          numberOfLines={4}
          maxLength={1000}
        />
        <Text style={styles.charCount}>{details.length}/1000</Text>

        {/* Error */}
        {submitError ? (
          <Text style={styles.submitError}>{submitError}</Text>
        ) : null}

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.ink} />
          ) : (
            <Text style={styles.submitBtnText}>SUBMIT REPORT</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  eyebrow: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  heading: {
    color: Colors.textPrimary,
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  sub: {
    fontFamily: Fonts.bodyMed,
    color: Colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },

  // Reason picker
  reasonList: { gap: 8, marginBottom: Spacing.lg },
  reasonCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  reasonCardActive: {
    borderColor: Colors.gold,
    backgroundColor: whiteAlpha(0.3),
  },
  reasonText: {
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  reasonTextActive: { color: Colors.textPrimary },

  // Details
  detailsLabel: {
    fontFamily: Fonts.bodySemi,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  optional: {
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  detailsInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    color: Colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: Fonts.bodySemi,
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: Spacing.md,
  },

  // Error + submit
  submitError: {
    fontFamily: Fonts.body,
    color: Colors.red,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  submitBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: {
    color: Colors.ink,
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 1,
  },
});
