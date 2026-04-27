// app/(tabs)/review.tsx
// Screen 12 — Leave a Review
// Both directions: customer reviews worker, worker reviews customer.
// Params: job_id, reviewee_id, reviewee_name (optional), job_title (optional)

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

// ── Star descriptor labels ─────────────────────────────────────────────────

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

// ── StarSelector ───────────────────────────────────────────────────────────

interface StarSelectorProps {
  value: number;       // 0 = none selected, 1–5 = selected rating
  onChange: (rating: number) => void;
  disabled?: boolean;
}

function StarSelector({ value, onChange, disabled }: StarSelectorProps) {
  return (
    <View style={starStyles.wrap}>
      <View style={starStyles.row}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => !disabled && onChange(star)}
            activeOpacity={disabled ? 1 : 0.7}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={[
              starStyles.star,
              star <= value ? starStyles.starFilled : starStyles.starEmpty,
            ]}>
              {star <= value ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={starStyles.label}>
        {value > 0 ? RATING_LABELS[value] : ' '}
      </Text>
    </View>
  );
}

const starStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  star: {
    fontSize: 40,
    lineHeight: 48,
  },
  starFilled: {
    color: Colors.gold,
  },
  starEmpty: {
    color: Colors.textSecondary,
  },
  label: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    minHeight: 20,
  },
});

// ── Screen ─────────────────────────────────────────────────────────────────

export default function ReviewScreen() {
  const router = useRouter();
  const {
    job_id,
    reviewee_id,
    reviewee_name,
    job_title,
  } = useLocalSearchParams<{
    job_id:        string;
    reviewee_id:   string;
    reviewee_name?: string;
    job_title?:    string;
  }>();

  const [loading,     setLoading]     = useState(true);
  const [guardState,  setGuardState]  = useState<
    null | 'self' | 'already_reviewed' | 'not_completed' | 'load_error'
  >(null);
  const [reviewerId,  setReviewerId]  = useState<string | null>(null);
  const [rating,      setRating]      = useState(0);
  const [comment,     setComment]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Initial load ───────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      // Require URL params
      if (!job_id || !reviewee_id) {
        setGuardState('load_error');
        setLoading(false);
        return;
      }

      // Step 1 — current user
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setGuardState('load_error');
        setLoading(false);
        return;
      }
      setReviewerId(user.id);

      // Step 2 — self-review guard
      if (user.id === reviewee_id) {
        setGuardState('self');
        setLoading(false);
        return;
      }

      // Step 3 — already reviewed?
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('job_id', job_id)
        .eq('reviewer_id', user.id)
        .maybeSingle();

      if (existing) {
        setGuardState('already_reviewed');
        setLoading(false);
        return;
      }

      // Step 4 — job must be completed
      const { data: jobRow, error: jobErr } = await supabase
        .from('jobs')
        .select('status')
        .eq('id', job_id)
        .single();

      if (jobErr || !jobRow || jobRow.status !== 'completed') {
        setGuardState('not_completed');
        setLoading(false);
        return;
      }

      // All checks passed
      setLoading(false);
    })();
  }, [job_id, reviewee_id]);

  // ── Submit handler ─────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (rating === 0 || !reviewerId || !job_id || !reviewee_id) return;

    setSubmitting(true);
    setSubmitError(null);

    const { error: insertErr } = await supabase
      .from('reviews')
      .insert({
        job_id,
        reviewer_id: reviewerId,
        reviewee_id,
        rating,
        comment: comment.trim(),
      });

    if (insertErr) {
      setSubmitError(insertErr.message ?? 'Failed to submit review. Please try again.');
      setSubmitting(false);
      return;
    }

    // Success — trigger handles rating_avg update automatically
    router.back();
  }, [rating, comment, reviewerId, job_id, reviewee_id, router]);

  // ── Guard / loading states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (guardState === 'self') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.guardGlyph}>🚫</Text>
          <Text style={styles.guardHeading}>CANNOT REVIEW YOURSELF</Text>
          <Text style={styles.guardSub}>You cannot leave a review for your own account.</Text>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.outlineBtnText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (guardState === 'already_reviewed') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.guardGlyph}>✓</Text>
          <Text style={styles.guardHeading}>ALREADY REVIEWED</Text>
          <Text style={styles.guardSub}>Thanks for sharing your experience.</Text>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.outlineBtnText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (guardState === 'not_completed') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.guardGlyph}>⚠️</Text>
          <Text style={styles.guardHeading}>JOB NOT YET COMPLETED</Text>
          <Text style={styles.guardSub}>You can leave a review once the job is marked complete.</Text>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.outlineBtnText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (guardState === 'load_error') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.guardGlyph}>⚠️</Text>
          <Text style={styles.guardHeading}>COULDN'T LOAD</Text>
          <Text style={styles.guardSub}>Something went wrong. Please try again.</Text>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.outlineBtnText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main JSX ───────────────────────────────────────────────────────────────

  const displayName  = reviewee_name ?? 'User';
  const displayTitle = job_title ?? null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Context strip ── */}
        <View style={styles.contextCard}>
          <Text style={styles.eyebrow}>RATING</Text>
          <Text style={styles.revieweeName}>{displayName}</Text>
          {displayTitle ? (
            <Text style={styles.jobTitle}>About: {displayTitle}</Text>
          ) : null}
        </View>

        {/* ── Star selector ── */}
        <StarSelector
          value={rating}
          onChange={setRating}
          disabled={submitting}
        />

        {/* ── Comment section ── */}
        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>ADD A COMMENT (OPTIONAL)</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={(t) => setComment(t.slice(0, 500))}
            placeholder="Share your experience..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={5}
            maxLength={500}
            textAlignVertical="top"
            editable={!submitting}
          />
          <Text style={styles.charCount}>{comment.length} / 500</Text>
        </View>

        {/* ── Submit button ── */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (rating === 0 || submitting) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator size="small" color={Colors.background} />
            : <Text style={styles.submitBtnText}>SUBMIT REVIEW</Text>
          }
        </TouchableOpacity>

        {/* ── Submit error ── */}
        {submitError ? (
          <Text style={styles.submitError}>{submitError}</Text>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // ── Layout ────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 16,
  },

  // ── Guard / loading screens ───────────────────────────────────────────────
  guardGlyph: {
    fontSize: 40,
  },
  guardHeading: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  guardSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  outlineBtn: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  outlineBtnText: {
    color: Colors.gold,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1.5,
  },

  // ── Context strip ─────────────────────────────────────────────────────────
  contextCard: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    gap: 4,
  },
  eyebrow: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  revieweeName: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  jobTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
  },

  // ── Comment section ───────────────────────────────────────────────────────
  commentSection: {
    gap: 8,
  },
  commentLabel: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  commentInput: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 120,
  },
  charCount: {
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'right',
  },

  // ── Submit button ─────────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 2,
  },
  submitError: {
    color: Colors.red,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },

});
