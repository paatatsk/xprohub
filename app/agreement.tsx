// app/agreement.tsx
// Read-only mini-contract — the Agreement view.
// Sibling document to Receipt; same ledger voice (IBM Plex Mono,
// dotted leaders, Oswald eyebrows, Space Grotesk amounts).
// Param: job_id (uuid)

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radius } from '../constants/theme';
import { supabase } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────

interface AgreementData {
  jobTitle: string;
  description: string | null;
  agreedPrice: number;
  platformFee: number;
  workerPayout: number;
  neighborhood: string | null;
  timing: string | null;
  customerName: string;
  workerName: string;
  agreedAt: string; // ISO timestamp
}

// ── Helpers ────────────────────────────────────────────────────

function timingLabel(timing: string | null): string {
  if (timing === 'asap') return 'ASAP';
  if (timing === 'scheduled') return 'Scheduled';
  if (timing === 'flexible') return 'Flexible';
  return '—';
}

function formatAgreedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Sub-components ─────────────────────────────────────────────

function LedgerRow({ label, value, valueColor }: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={s.ledgerRow}>
      <Text style={s.ledgerLabel} numberOfLines={1}>{label}</Text>
      <View style={s.ledgerLeader} />
      <Text style={[s.ledgerValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

function SectionEyebrow({ children }: { children: string }) {
  return <Text style={s.sectionEyebrow}>{children}</Text>;
}

function Divider() {
  return <View style={s.divider} />;
}

// ── Screen ─────────────────────────────────────────────────────

export default function AgreementScreen() {
  const router = useRouter();
  const { job_id } = useLocalSearchParams<{ job_id: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AgreementData | null>(null);

  useEffect(() => {
    if (!job_id) {
      setError('No job specified.');
      setLoading(false);
      return;
    }

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Sign in required.');
        setLoading(false);
        return;
      }

      // Parallel: job + payment + accepted bid
      const [jobRes, paymentRes, bidRes] = await Promise.all([
        supabase
          .from('jobs')
          .select(`
            id, title, description, agreed_price, neighborhood, timing, status,
            customer:profiles!customer_id(full_name),
            worker:profiles!worker_id(full_name)
          `)
          .eq('id', job_id)
          .single(),
        supabase
          .from('payments')
          .select('amount, platform_fee, worker_payout')
          .eq('job_id', job_id)
          .in('escrow_status', ['held', 'released'])
          .maybeSingle(),
        supabase
          .from('bids')
          .select('created_at')
          .eq('job_id', job_id)
          .eq('status', 'accepted')
          .maybeSingle(),
      ]);

      if (jobRes.error || !jobRes.data) {
        setError('Job not found.');
        setLoading(false);
        return;
      }

      const job = jobRes.data as any;
      const payment = paymentRes.data as any;
      const bid = bidRes.data as any;

      const agreedPrice = job.agreed_price ?? payment?.amount ?? 0;
      const fee = payment?.platform_fee ?? Math.round(agreedPrice * 10) / 100;
      const payout = payment?.worker_payout ?? (agreedPrice - fee);

      setData({
        jobTitle: job.title ?? 'Job',
        description: job.description ?? null,
        agreedPrice,
        platformFee: fee,
        workerPayout: payout,
        neighborhood: job.neighborhood ?? null,
        timing: job.timing ?? null,
        customerName: job.customer?.full_name ?? 'Customer',
        workerName: job.worker?.full_name ?? 'Worker',
        agreedAt: bid?.created_at ?? job.updated_at ?? new Date().toISOString(),
      });
      setLoading(false);
    })();
  }, [job_id]);

  // ── Loading ──────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['bottom']}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={s.container} edges={['bottom']}>
        <View style={s.center}>
          <Text style={s.errorGlyph}>⚠️</Text>
          <Text style={s.errorHeading}>COULDN'T LOAD AGREEMENT</Text>
          <Text style={s.errorSub}>{error ?? 'Something went wrong.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main ─────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={s.headerBlock}>
          <Text style={s.headerEyebrow}>WORK AGREEMENT</Text>
          <Text style={s.headerTitle}>{data.jobTitle}</Text>
        </View>

        <Divider />

        {/* ── Parties ── */}
        <SectionEyebrow>PARTIES</SectionEyebrow>
        <LedgerRow label="Customer" value={data.customerName} />
        <LedgerRow label="Worker" value={data.workerName} />

        <Divider />

        {/* ── Scope (omit if no description — legacy jobs) ── */}
        {data.description ? (
          <>
            <SectionEyebrow>SCOPE</SectionEyebrow>
            <Text style={s.scopeText}>{data.description}</Text>
            <Divider />
          </>
        ) : null}

        {/* ── Price ── */}
        <SectionEyebrow>PRICE</SectionEyebrow>
        <LedgerRow
          label="Job total"
          value={`$${data.agreedPrice.toFixed(2)}`}
          valueColor={Colors.gold}
        />
        <LedgerRow
          label="Platform fee (10%)"
          value={`−$${data.platformFee.toFixed(2)}`}
        />
        <View style={s.thinRule} />
        <LedgerRow
          label="Worker receives"
          value={`$${data.workerPayout.toFixed(2)}`}
          valueColor={Colors.gold}
        />

        <Divider />

        {/* ── Details ── */}
        <SectionEyebrow>DETAILS</SectionEyebrow>
        {data.neighborhood ? (
          <LedgerRow label="Location" value={data.neighborhood} />
        ) : null}
        <LedgerRow label="Timing" value={timingLabel(data.timing)} />

        <Divider />

        {/* ── Accepted ── */}
        <SectionEyebrow>ACCEPTED</SectionEyebrow>
        <Text style={s.acceptedText}>
          Agreed in-app by both parties on {formatAgreedDate(data.agreedAt)}.
        </Text>

        {/* ── Footer ── */}
        <Text style={s.footerText}>
          This summary reflects the job as posted and accepted on XProHub. Changes require cancelling and re-hiring.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const INK_DIM = '#d8d8d8';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: Spacing.xl,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Error state
  errorGlyph: { fontSize: 40 },
  errorHeading: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  errorSub: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },

  // Header
  headerBlock: {
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  headerEyebrow: {
    fontFamily: Fonts.display,
    fontSize: 11,
    letterSpacing: 4,
    color: Colors.gold,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
  },

  // Section eyebrow
  sectionEyebrow: {
    fontFamily: Fonts.display,
    fontSize: 10,
    letterSpacing: 4,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },

  // Ledger rows (dotted leader pattern from Receipt)
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingVertical: 6,
  },
  ledgerLabel: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: INK_DIM,
  },
  ledgerLeader: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderColor: Colors.border,
    marginBottom: 4,
  },
  ledgerValue: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: INK_DIM,
    minWidth: 64,
    textAlign: 'right',
  },

  // Thin rule (between fee lines)
  thinRule: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },

  // Scope
  scopeText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: INK_DIM,
    lineHeight: 21,
  },

  // Accepted
  acceptedText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  // Footer
  footerText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: Spacing.xl,
    textAlign: 'center',
    opacity: 0.6,
  },
});
