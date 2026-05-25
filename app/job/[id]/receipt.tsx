// app/job/[id]/receipt.tsx
//
// THE LIGHTHOUSE SCREEN — where the brand promise is proven.
// The big gold number is what the WORKER received.
// See docs/RECEIPT_SPEC.md for the full brief.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Share, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { supabase } from '../../../lib/supabase';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_700Bold,
  PlayfairDisplay_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  Oswald_600SemiBold,
  Oswald_700Bold,
} from '@expo-google-fonts/oswald';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
import { Colors } from '../../../constants/theme';
import { fmtCents, fmtDateStamp, fmtDuration, fmtDayDate, fmtShortDate, toCents } from '../../../lib/format';
import type { ReceiptData } from '../../../types/receipt';

// ── Font family constants ────────────────────────────────────
const FONT = {
  spaceGrotesk:  'SpaceGrotesk_500Medium',
  spaceGroteskB: 'SpaceGrotesk_600SemiBold',
  inter:         'Inter_400Regular',
  interMed:      'Inter_500Medium',
  playfair:      'PlayfairDisplay_700Bold',
  playfairIt:    'PlayfairDisplay_700Bold_Italic',
  oswald:        'Oswald_600SemiBold',
  oswaldB:       'Oswald_700Bold',
  mono:          'IBMPlexMono_400Regular',
  monoMed:       'IBMPlexMono_500Medium',
};

// Receipt-specific neutral. Slightly dimmer than textPrimary —
// feels like ink on dark paper, not pure white on screen.
const INK_DIM = '#d8d8d8';

// Format helpers imported from lib/format.ts

// ── Real Supabase hook ───────────────────────────────────────
function useReceipt(jobId: string, _role?: 'customer' | 'worker') {
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Sign in required.'); setLoading(false); return; }

    // Parallel fetches: job + payment + tasks
    const [jobRes, paymentRes, tasksRes] = await Promise.all([
      supabase
        .from('jobs')
        .select(`
          id, customer_id, worker_id, title, description, category,
          neighborhood, agreed_price, completed_at, started_at,
          customer:profiles!customer_id(id, full_name, first_name, city),
          worker:profiles!worker_id(id, full_name, first_name, city)
        `)
        .eq('id', jobId)
        .single(),
      supabase
        .from('payments')
        .select('amount, platform_fee, worker_payout, stripe_charge_id, escrow_status, released_at, auto_release_at, created_at')
        .eq('job_id', jobId)
        .maybeSingle(),
      supabase
        .from('job_post_tasks')
        .select('task_library(name, completion_verb_phrase)')
        .eq('job_post_id', jobId),
    ]);

    if (jobRes.error || !jobRes.data) {
      setError('Job not found.');
      setLoading(false);
      return;
    }

    const job = jobRes.data;
    const payment = paymentRes.data;
    const workerProfile = job.worker as any;
    const customerProfile = job.customer as any;

    if (!workerProfile || !customerProfile) {
      setError('Could not load job parties.');
      setLoading(false);
      return;
    }

    // Determine viewer role
    const viewerRole = user.id === job.customer_id ? 'customer' : 'worker';

    // Money from payments table (authoritative, in dollars → cents)
    const customerChargedCents = toCents(payment?.amount ?? job.agreed_price);
    const platformFeeCents = toCents(payment?.platform_fee);
    const workerPayoutCents = toCents(payment?.worker_payout);
    const subtotalCents = customerChargedCents;

    // Derive fee percent from actual cents — never hardcode
    const platformFeePercent = subtotalCents > 0
      ? Math.round((platformFeeCents / subtotalCents) * 100)
      : 0;

    // ── Runtime money invariant check (log-and-render) ────
    // Render stored values from payments verbatim (Stripe-authoritative).
    // Log mismatches for ops — never block the screen.
    const payoutCheck = subtotalCents - platformFeeCents;
    if (payment && Math.abs(payoutCheck - workerPayoutCents) > 1) {
      console.warn(
        `[Receipt] Money invariant mismatch for job ${jobId}: ` +
        `subtotal ${subtotalCents} - fee ${platformFeeCents} = ${payoutCheck}, ` +
        `but stored payout is ${workerPayoutCents}`
      );
    }

    // Build task data from join
    const tasks: { name: string; verbPhrase: string }[] = ((tasksRes.data ?? []) as any[])
      .map(r => ({
        name: r.task_library?.name as string,
        verbPhrase: r.task_library?.completion_verb_phrase as string,
      }))
      .filter(t => t.name);

    // Single line item with full agreed price (platform bills per-job, not per-task)
    const lineItems = tasks.length > 0
      ? [{ label: tasks.map(t => t.name).join(' + '), amountCents: subtotalCents }]
      : [{ label: job.title ?? job.category ?? 'Service', amountCents: subtotalCents }];

    // Duration in minutes (started_at → completed_at)
    const durationMinutes = (job.started_at && job.completed_at)
      ? Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 60000)
      : 0;

    // Names — read first_name from profiles, never split full_name
    const workerFirst = workerProfile.first_name ?? (workerProfile.full_name ?? 'Worker').split(' ')[0];
    const customerFirst = customerProfile.first_name ?? (customerProfile.full_name ?? 'Customer').split(' ')[0];

    // Payout state
    const payoutCompleted = payment?.escrow_status === 'released';
    const payoutAvailableAt = payment?.auto_release_at ?? payment?.released_at ?? job.completed_at ?? new Date().toISOString();

    // Action description from completion_verb_phrase (editorial register)
    // Falls back to "completed your {category}" if no verb phrase found
    const verbPhrase = tasks[0]?.verbPhrase;
    const desc = verbPhrase
      ?? `completed your ${(job.category ?? 'job').toLowerCase()}`;

    const receipt: ReceiptData = {
      jobId: job.id,
      viewerRole,
      worker: {
        id: workerProfile.id,
        fullName: workerProfile.full_name ?? 'Worker',
        firstName: workerFirst,
        location: workerProfile.city ?? '',
      },
      customer: {
        id: customerProfile.id,
        fullName: customerProfile.full_name ?? 'Customer',
        firstName: customerFirst,
        location: customerProfile.city ?? job.neighborhood ?? '',
      },
      actionDescription: desc,
      durationMinutes,
      completedAt: job.completed_at ?? new Date().toISOString(),
      photos: [],
      lineItems,
      subtotalCents,
      platformFeePercent,
      platformFeeCents,
      workerPayoutCents,
      customerChargedCents,
      currency: 'usd',
      workerNote: null,
      trace: {
        jobId: job.id,
        stripeChargeId: payment?.stripe_charge_id ?? null,
        paidAt: payment?.created_at ?? job.completed_at ?? new Date().toISOString(),
        payoutAvailableAt,
        payoutCompleted,
        currency: 'usd',
      },
      endorsement: 'none',
    };

    setData(receipt);
    setLoading(false);
  }, [jobId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── Sub-components ───────────────────────────────────────────

function OrnateDivider() {
  return (
    <View style={s.ornate}>
      <View style={s.ornateRule} />
      <Text style={s.ornateDiamond}>{'\u25C6'}</Text>
      <View style={s.ornateRule} />
    </View>
  );
}

function LineItem({ label, amountCents, muted = false, signed = false }: {
  label: string; amountCents: number; muted?: boolean; signed?: boolean;
}) {
  const color = muted ? Colors.textSecondary : INK_DIM;
  // U+2212 minus, never hyphen.
  const sign = signed && amountCents > 0 ? '\u2212' : '';
  return (
    <View style={s.lineItem}>
      <Text style={[s.lineLbl, { color }]} numberOfLines={1}>{label}</Text>
      <View style={s.lineLeader} />
      <Text
        style={[s.lineAmt, { color }]}
        accessibilityLabel={`${label}: ${fmtCents(amountCents)}`}
      >
        {sign}{fmtCents(amountCents)}
      </Text>
    </View>
  );
}

function HeroPhoto({ data }: { data: ReceiptData }) {
  const hero = data.photos[0];
  const total = data.photos.length;
  const workerFirst = data.worker.firstName;

  if (!hero) {
    return (
      <View style={s.photoHero}>
        <View style={s.photoInnerBorder} />
        <View style={s.photoPlaceholderCenter}>
          <Text style={s.photoStampLabel}>{'\u2014'} PHOTO {'\u2014'}</Text>
          <Text style={s.photoPlaceholderBody}>
            {workerFirst} hasn't uploaded photos yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={s.photoHero}>
        <Image source={{ uri: hero.url }} style={s.photoImg} />
        <View style={s.photoInnerBorder} />
        <Text style={s.photoStamp}>AFTER</Text>
        <Text style={s.photoMeta}>
          1 / {total} {'\u00B7'} {new Date(hero.capturedAt).toLocaleString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false,
          })}
        </Text>
      </View>

      {total > 1 && (
        <View style={s.thumbStrip}>
          {data.photos.slice(0, 4).map((p, i) => (
            <View key={i} style={[s.thumb, i === 0 && s.thumbActive]}>
              <Image source={{ uri: p.url }} style={s.thumbImg} />
            </View>
          ))}
          {total > 4 && (
            <Text style={s.thumbMore}>+{total - 4}</Text>
          )}
        </View>
      )}

      <Text style={s.photoUploadedHint}>
        {workerFirst} uploaded {total} {total === 1 ? 'image' : 'images'}
      </Text>
    </>
  );
}

function TraceRow({ label, value, valueColor }: {
  label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={s.traceRow}>
      <Text style={s.traceK}>{label}</Text>
      <Text
        style={[s.traceV, valueColor ? { color: valueColor } : undefined]}
        accessibilityLabel={
          label === 'stripe'
            ? `Stripe charge: ${value.split('').join(' ')}`
            : undefined
        }
      >
        {value}
      </Text>
    </View>
  );
}

function TraceBlock({ data }: { data: ReceiptData }) {
  const { trace } = data;
  const paidStr = new Date(trace.paidAt).toLocaleString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).toLowerCase();

  const payoutStr = trace.payoutCompleted
    ? 'funds available'
    : `funds available ${fmtShortDate(trace.payoutAvailableAt).toLowerCase()}`;

  const concernHold = data.endorsement === 'concern_raised';

  return (
    <View style={s.traceGrid}>
      <TraceRow label="paid" value={paidStr} />
      <TraceRow
        label="stripe"
        value={`${trace.stripeChargeId ?? '\u2014'} \u00B7 ${trace.currency}`}
      />
      <TraceRow
        label="payout"
        value={concernHold ? 'held pending review' : payoutStr}
        valueColor={concernHold ? Colors.red : Colors.gold}
      />
      <TraceRow label="job id" value={trace.jobId} />
    </View>
  );
}

function CustomerActions({ data, onEndorse, onConcern }: {
  data: ReceiptData; onEndorse: () => void; onConcern: () => void;
}) {
  if (data.endorsement === 'endorsed' && data.endorsedAt) {
    return (
      <View style={s.endorsedPill}>
        <Text style={s.endorsedText}>
          {'\u2713'} ENDORSED {'\u00B7'} {fmtShortDate(data.endorsedAt)}
        </Text>
      </View>
    );
  }

  if (data.endorsement === 'concern_raised') {
    return (
      <View style={s.concernPill}>
        <Text style={s.concernPillText}>CONCERN UNDER REVIEW</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={s.endorseBtn}
        onPress={onEndorse}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityHint={`Confirms ${data.worker.firstName}'s work was done well.`}
      >
        <View style={s.endorseCheck}>
          <Text style={s.endorseCheckGlyph}>{'\u2713'}</Text>
        </View>
        <Text style={s.endorseBtnText}>ENDORSE THIS WORK</Text>
      </TouchableOpacity>
      <View style={s.concernRow}>
        <Text style={s.concernPrefix}>Something wasn't right? </Text>
        <TouchableOpacity onPress={onConcern} activeOpacity={0.7}>
          <Text style={s.concernLink}>Raise a concern.</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ── Main screen ──────────────────────────────────────────────

export default function ReceiptScreen() {
  const router = useRouter();
  const { id, role: roleParam } = useLocalSearchParams<{
    id: string; role?: 'customer' | 'worker';
  }>();

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
    Oswald_600SemiBold,
    Oswald_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  const { data, loading, error, refetch } = useReceipt(id, roleParam);

  const handleShare = useCallback(async () => {
    if (!data) return;
    try {
      await Share.share({
        title: 'XProHub receipt',
        message: `Receipt \u2014 ${data.worker.fullName} \u00B7 ${fmtCents(data.workerPayoutCents)}`,
        url: `https://xprohub.com/job/${data.jobId}/receipt`,
      });
    } catch { /* user cancelled */ }
  }, [data]);

  const handleEndorse = useCallback(() => {
    if (!data) return;
    Alert.alert(
      `Endorse ${data.worker.firstName}'s work?`,
      'This adds a confidence vote to their profile. You can still raise a concern later if needed.',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'ENDORSE',
          onPress: () => {
            // TODO: write to endorsements table, refetch
          },
        },
      ],
      { userInterfaceStyle: 'dark' },
    );
  }, [data]);

  const handleConcern = useCallback(() => {
    if (!data) return;
    router.push(
      `/(tabs)/report?reported_user_id=${data.worker.id}&content_type=job&content_id=${data.jobId}&reported_user_name=${encodeURIComponent(data.worker.fullName)}` as any
    );
  }, [data, router]);

  // Loading state
  if (loading || !fontsLoaded) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <View style={s.errorRing}>
            <Text style={s.errorGlyph}>!</Text>
          </View>
          <Text style={s.errorHead}>COULDN'T LOAD RECEIPT</Text>
          <Text style={s.errorBody}>{error || 'Please try again.'}</Text>
          <TouchableOpacity style={s.errorBtn} onPress={refetch} activeOpacity={0.85}>
            <Text style={s.errorBtnText}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCustomer = data.viewerRole === 'customer';
  const workerFirst = data.worker.firstName;
  const workerFirstUpper = workerFirst.toUpperCase();

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Back"
        >
          <View style={s.navBack} />
        </TouchableOpacity>
        <Text style={s.navTitle}>RECEIPT</Text>
        <TouchableOpacity
          onPress={handleShare}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Share receipt"
        >
          <Text style={s.navShare}>{'\u2934'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
      >
        <OrnateDivider />

        {/* Stamp */}
        <View style={s.stampRow}>
          <Text style={s.eyebrowGold}>
            {isCustomer ? 'WORK COMPLETED' : 'YOU EARNED'}
          </Text>
          <Text style={s.stampDate}>{fmtDateStamp(data.completedAt)}</Text>
        </View>

        <HeroPhoto data={data} />

        {/* Worker block */}
        <View style={s.workerBlock}>
          <Text style={s.workerName}>{data.worker.fullName}</Text>
          <Text style={s.workerAction}>
            {isCustomer
              ? `${data.actionDescription} in ${data.customer.location} \u2014`
              : `You ${data.actionDescription} ${data.customer.firstName}'s ${data.customer.location} \u2014`}
          </Text>
          <Text style={s.workerAction}>
            deep clean, both bathrooms, kitchen, hallway closet.
          </Text>
          <Text style={s.workerContext}>
            {fmtDuration(data.durationMinutes)} {'\u00B7'} {fmtDayDate(data.completedAt)}
          </Text>
        </View>

        {/* Invoice */}
        <View style={s.invoice}>
          <Text style={s.sectionLabel}>ITEMIZED</Text>

          {data.lineItems.map((li, i) => (
            <LineItem key={i} label={li.label} amountCents={li.amountCents} />
          ))}

          <View style={s.ruleThin} />

          <LineItem label="Subtotal" amountCents={data.subtotalCents} />
          <LineItem
            label={`XProHub fee \u00B7 ${data.platformFeePercent}%`}
            amountCents={data.platformFeeCents}
            muted
            signed
          />

          <View style={s.ruleDouble} />

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>
              {isCustomer ? `PAID TO ${workerFirstUpper}` : 'YOU RECEIVED'}
            </Text>
            <Text
              style={s.totalAmount}
              accessibilityLabel={`${
                isCustomer ? `Paid to ${workerFirst}` : 'You received'
              }: ${fmtCents(data.workerPayoutCents)}`}
            >
              {fmtCents(data.workerPayoutCents)}
            </Text>
          </View>

          <Text style={s.reconcile}>
            {isCustomer ? (
              <>You paid <Text style={s.reconcileEm}>{fmtCents(data.customerChargedCents)}</Text>
              {'  \u00B7  '}{workerFirst} received <Text style={s.reconcileGold}>{fmtCents(data.workerPayoutCents)}</Text></>
            ) : (
              <>{data.customer.firstName} paid <Text style={s.reconcileEm}>{fmtCents(data.customerChargedCents)}</Text>
              {'  \u00B7  '}You received <Text style={s.reconcileGold}>{fmtCents(data.workerPayoutCents)}</Text></>
            )}
          </Text>
        </View>

        {/* Note */}
        <View style={s.noteBlock}>
          <Text style={s.sectionLabel}>FROM {workerFirstUpper}</Text>
          {data.workerNote ? (
            <>
              <View style={s.noteBody}>
                <View style={s.noteRule} />
                <Text style={s.noteText}>{data.workerNote}</Text>
              </View>
              <Text style={s.noteSignoff}>{'\u2014'} {workerFirst[0]}.</Text>
            </>
          ) : (
            <Text style={s.noteEmpty}>No note left for this job.</Text>
          )}
        </View>

        {/* Trace */}
        <View style={s.traceBlock}>
          <Text style={s.sectionLabel}>TRANSACTION</Text>
          <TraceBlock data={data} />
        </View>

        {/* Actions — customer view only */}
        {isCustomer && (
          <View style={s.actions}>
            <CustomerActions
              data={data}
              onEndorse={handleEndorse}
              onConcern={handleConcern}
            />
          </View>
        )}

        {/* Footer ticker */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            {'\u25C6'} REAL WORK {'\u00B7'} FAIR PAY {'\u00B7'} FOR EVERYONE {'\u25C6'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },

  // Nav
  nav: {
    height: 56, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  navBack: {
    width: 14, height: 14,
    borderLeftWidth: 2, borderBottomWidth: 2, borderColor: Colors.gold,
    transform: [{ rotate: '45deg' }],
  },
  navTitle: {
    fontFamily: FONT.oswald, fontSize: 12, letterSpacing: 4,
    color: Colors.gold, textTransform: 'uppercase',
  },
  navShare: { color: Colors.gold, fontSize: 20, lineHeight: 20 },

  body: { paddingHorizontal: 30, paddingBottom: 40 },

  // Ornate divider
  ornate:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 14 },
  ornateRule:    { flex: 1, height: 1, backgroundColor: Colors.gold, opacity: 0.4 },
  ornateDiamond: { color: Colors.gold, fontSize: 8 },

  // Stamp
  stampRow:     { alignItems: 'center', marginBottom: 20 },
  eyebrowGold: {
    fontFamily: FONT.oswald, fontSize: 11, letterSpacing: 4,
    color: Colors.gold, textTransform: 'uppercase',
  },
  stampDate: {
    fontFamily: FONT.mono, fontSize: 10, color: Colors.textSecondary,
    letterSpacing: 1.5, marginTop: 6,
  },

  // Photo hero
  photoHero: {
    height: 220, borderRadius: 4,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.background,
    position: 'relative', overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
  },
  photoImg:         { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  photoInnerBorder: {
    position: 'absolute', top: 10, left: 10, right: 10, bottom: 10,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.18)',
  },
  photoStamp: {
    position: 'absolute', top: 22, left: 22,
    fontFamily: FONT.oswaldB, fontSize: 10, letterSpacing: 4,
    color: Colors.gold, borderWidth: 1.5, borderColor: Colors.gold,
    paddingHorizontal: 9, paddingVertical: 5,
    transform: [{ rotate: '-3deg' }],
    backgroundColor: 'rgba(14,14,15,0.6)',
  },
  photoMeta: {
    position: 'absolute', bottom: 18, right: 22,
    fontFamily: FONT.mono, fontSize: 9, color: Colors.gold,
    letterSpacing: 1.5,
  },
  photoPlaceholderCenter: {
    alignItems: 'center',
  },
  photoStampLabel: {
    fontFamily: FONT.oswald, fontSize: 11, letterSpacing: 3,
    color: Colors.gold, marginBottom: 6,
  },
  photoPlaceholderBody: {
    fontFamily: FONT.mono, fontSize: 10, color: Colors.textSecondary,
  },
  photoUploadedHint: {
    fontFamily: FONT.mono, fontSize: 9, color: '#555558',
    letterSpacing: 1, marginTop: 8,
  },

  // Thumbnail strip
  thumbStrip: {
    flexDirection: 'row', gap: 6, marginTop: 6, alignItems: 'center',
  },
  thumb: {
    flex: 1, height: 56, borderRadius: 2,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  thumbActive: { borderColor: Colors.gold },
  thumbImg:    { width: '100%', height: '100%' },
  thumbMore: {
    fontFamily: FONT.mono, fontSize: 10, color: Colors.gold,
    marginLeft: 4,
  },

  // Worker block
  workerBlock: { marginTop: 36 },
  workerName: {
    fontFamily: FONT.playfair, fontSize: 36,
    color: Colors.gold, letterSpacing: -1, lineHeight: 38,
  },
  workerAction: {
    fontFamily: FONT.inter, fontSize: 14, color: INK_DIM,
    marginTop: 10, lineHeight: 21,
  },
  workerContext: {
    fontFamily: FONT.mono, fontSize: 10, color: Colors.textSecondary,
    letterSpacing: 1.5, marginTop: 8,
  },

  // Invoice
  invoice: {
    marginTop: 30, paddingTop: 22,
    borderTopWidth: 1, borderColor: Colors.border,
  },
  sectionLabel: {
    fontFamily: FONT.oswald, fontSize: 10, letterSpacing: 4,
    color: Colors.textSecondary, textTransform: 'uppercase',
    marginBottom: 14,
  },
  lineItem: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingVertical: 7,
  },
  lineLbl: {
    fontFamily: FONT.inter, fontSize: 14,
  },
  lineLeader: {
    flex: 1, height: 1,
    borderBottomWidth: 1, borderStyle: 'dotted', borderColor: Colors.border,
    marginBottom: 4,
  },
  lineAmt: {
    fontFamily: FONT.spaceGrotesk, fontSize: 14, fontVariant: ['tabular-nums'],
    minWidth: 64, textAlign: 'right',
  },
  ruleThin: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
  ruleDouble: {
    height: 5, marginVertical: 14,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.gold,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingBottom: 6,
  },
  totalLabel: {
    fontFamily: FONT.oswaldB, fontSize: 13, letterSpacing: 3,
    color: '#FFFFFF', textTransform: 'uppercase',
  },
  totalAmount: {
    fontFamily: FONT.spaceGroteskB, fontSize: 44, letterSpacing: -1,
    color: Colors.gold, lineHeight: 44, fontVariant: ['tabular-nums'],
  },
  reconcile: {
    fontFamily: FONT.inter, fontSize: 12, color: Colors.textSecondary,
    marginTop: 2,
  },
  reconcileEm:   { color: INK_DIM, fontFamily: FONT.interMed },
  reconcileGold: { color: Colors.gold, fontFamily: FONT.interMed },

  // Note
  noteBlock: {
    marginTop: 30, paddingVertical: 22,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border,
  },
  noteBody: {
    flexDirection: 'row', alignItems: 'stretch', gap: 14,
  },
  noteRule: { width: 2, backgroundColor: Colors.gold, marginVertical: 4 },
  noteText: {
    flex: 1,
    fontFamily: FONT.playfairIt, fontSize: 18, lineHeight: 26,
    color: INK_DIM, fontStyle: 'italic',
  },
  noteSignoff: {
    fontFamily: FONT.playfairIt, fontSize: 14, color: Colors.textSecondary,
    marginTop: 10, marginLeft: 16, fontStyle: 'italic',
  },
  noteEmpty: {
    fontFamily: FONT.playfairIt, fontSize: 15, fontStyle: 'italic',
    color: Colors.textSecondary,
  },

  // Trace
  traceBlock: { marginTop: 28 },
  traceGrid:  {},
  traceRow: {
    flexDirection: 'row', alignItems: 'baseline', paddingVertical: 2,
  },
  traceK: {
    fontFamily: FONT.mono, fontSize: 10, color: '#555558',
    letterSpacing: 0.5, lineHeight: 18, width: 80,
  },
  traceV: {
    fontFamily: FONT.mono, fontSize: 10, color: INK_DIM,
    letterSpacing: 0.5, lineHeight: 18, flex: 1,
  },

  // Actions
  actions: { marginTop: 36 },
  endorseBtn: {
    width: '100%', paddingVertical: 18,
    borderWidth: 1.5, borderColor: Colors.gold, borderRadius: 999,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  endorseCheck: {
    width: 14, height: 14, borderRadius: 999,
    borderWidth: 1.5, borderColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  endorseCheckGlyph: {
    fontSize: 9, color: Colors.gold, lineHeight: 9,
    marginTop: Platform.OS === 'ios' ? 0 : -1,
  },
  endorseBtnText: {
    fontFamily: FONT.oswaldB, fontSize: 13, letterSpacing: 3,
    color: Colors.gold, textTransform: 'uppercase',
  },
  endorsedPill: {
    width: '100%', paddingVertical: 18,
    backgroundColor: Colors.gold, borderRadius: 999, alignItems: 'center',
  },
  endorsedText: {
    fontFamily: FONT.oswaldB, fontSize: 13, letterSpacing: 3,
    color: '#1A0F00', textTransform: 'uppercase',
  },
  concernPill: {
    width: '100%', paddingVertical: 18,
    borderWidth: 1.5, borderColor: Colors.red, borderRadius: 999, alignItems: 'center',
  },
  concernPillText: {
    fontFamily: FONT.oswaldB, fontSize: 13, letterSpacing: 3,
    color: Colors.red, textTransform: 'uppercase',
  },
  concernRow: {
    marginTop: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline',
  },
  concernPrefix: {
    fontFamily: FONT.inter, fontSize: 12, color: Colors.textSecondary,
  },
  concernLink: {
    fontFamily: FONT.inter, fontSize: 12,
    color: Colors.red, textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },

  // Footer
  footer: {
    marginTop: 40, paddingVertical: 9,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.gold,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FONT.oswald, fontSize: 10, letterSpacing: 3,
    color: Colors.gold, textTransform: 'uppercase',
  },

  // Error state
  errorRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 2, borderColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  errorGlyph: { fontSize: 36, color: Colors.gold },
  errorHead: {
    fontFamily: FONT.oswaldB, fontSize: 18, letterSpacing: 1.5,
    color: '#FFFFFF', textAlign: 'center',
  },
  errorBody: {
    fontFamily: FONT.inter, fontSize: 14, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20,
  },
  errorBtn: {
    marginTop: 8, borderWidth: 1.5, borderColor: Colors.gold, borderRadius: 999,
    paddingVertical: 10, paddingHorizontal: 28,
  },
  errorBtnText: {
    fontFamily: FONT.oswaldB, fontSize: 13, letterSpacing: 1.5, color: Colors.gold,
  },
});
