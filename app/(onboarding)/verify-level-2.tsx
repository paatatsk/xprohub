import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

// Activation gate — shown when an Explorer taps Post a Job or Hire Directly.
// Sets trust_level to 'starter' (unlocking posting + hiring) and redirects
// the user to their original destination. Tiered verification (Starter vs Pro
// with real SMS/ID/banking checks) is a future roadmap item; in v1 both tiers
// are functionally identical, so this screen presents a single confirmation step.

export default function VerifyLevel2Screen() {
  const router = useRouter();
  const { destination } = useLocalSearchParams<{ destination?: string }>();

  const [activating, setActivating] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const dest = destination ? decodeURIComponent(destination) : '/(tabs)';

  const handleActivate = async () => {
    setActivating(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Session expired. Please sign in again.');
      setActivating(false);
      return;
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ trust_level: 'starter' })
      .eq('id', user.id);

    if (updateErr) {
      setError('Could not update your profile. Please try again.');
      setActivating(false);
      return;
    }

    router.replace(dest as Parameters<typeof router.replace>[0]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Header ── */}
        <Text style={styles.heading}>ACTIVATE YOUR ACCOUNT</Text>
        <Text style={styles.subhead}>
          One step to start posting jobs and hiring help on XProHub.
        </Text>

        {/* ── Activation card ── */}
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.primaryBtn, activating && styles.btnDisabled]}
            onPress={handleActivate}
            disabled={activating}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Continue to activate your account"
          >
            {activating
              ? <ActivityIndicator color={Colors.background} />
              : <Text style={styles.primaryBtnText}>CONTINUE</Text>}
          </TouchableOpacity>
        </View>

        {/* ── Error ── */}
        {error && <Text style={styles.errorText}>{error}</Text>}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
  scroll:        { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },

  heading: {
    color: Colors.gold,
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subhead: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },

  primaryBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 2,
  },

  btnDisabled: { opacity: 0.4 },

  errorText: {
    fontFamily: Fonts.body,
    color: Colors.red,
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
